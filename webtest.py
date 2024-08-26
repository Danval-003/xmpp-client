import base64
from fastapi import FastAPI, WebSocket
import asyncio
from typing import *
from ManagerXMPP import ManagerXMPP, parseXMLTOJSON
import json
import threading
from queue import Queue
import re

app = FastAPI()

clients: Dict[int,WebSocket] = {}

managers: Dict[int, ManagerXMPP] = {}
queues: Dict[int, Queue] = {}

def listen(manager: ManagerXMPP, queue: Queue):
    while hasattr(manager, 'running'):
        try:
            response = b''
            while hasattr(manager, 'running'):
                chunk = manager.ssl_sock.recv(4096)
                response += chunk
                if len(chunk) < 4096:
                    try:
                        response_decoded = response.decode('utf-8')
                        dictS = parseXMLTOJSON(response_decoded)
                        dictS = json.dumps(dictS, indent=4)
                        print('Parsed:', dictS)
                        break
                    except Exception as e:
                        print(f"Error en parseXMLTOJSON: {e}", response_decoded)

            response_decoded = response.decode('utf-8')
            
            if len(response) == 0:
                continue

            try:
                dictS = parseXMLTOJSON(response_decoded)
                dictCopy = dictS.copy()
                dictS:str = json.dumps(dictS, indent=4)
                words = ['"iq"', '"@subscription"', '"@type": "set"']
                otherWords = ['"presence"', '"@type": "subscribe"']
                otherOtherWords = ['"iq"', '"@id": "upload_', '"@type": "result"']
                otherOtherWords2 = ['"iq"', '"@id": "roster_contacts"']


                isTr = True
                for word in words:
                    if word not in dictS:
                        isTr = False
                        break

                isTr2 = False
                for word in otherWords:
                    if word in dictS:
                        isTr2 = False
                        break
                isTr3 = True
                for word in otherOtherWords:
                    if not word in dictS:
                        isTr3 = False
                        break

                isTr4 = True
                for word in otherOtherWords2:
                    if not word in dictS:
                        isTr4 = False
                        break

                if isTr or isTr2:
                    manager.obtain_roster_contacts()

                if isTr3:
                    manager.upload_file(dictCopy)

                queue.put(dictS)
            except Exception as e:
                print(f"Error en parseXMLTOJSON: {e}", response_decoded)

        except Exception as e:
            print(f"Error en listen: {e}")
            break

async def send_periodic_ping(idWebSocket: int):
    manager = managers[idWebSocket]
    while hasattr(manager, 'running'):
        try:
            manager.send_ping()
            await asyncio.sleep(10)
        except Exception as e:
            print(f"Error al enviar ping: {e}")
            break

async def init_session(idWesock:int, data: Dict):
    managers[idWesock] = ManagerXMPP(username=data["username"], password=data["password"])
    queues[idWesock] = Queue()
    response = managers[idWesock].init_session()
    
    if not response[0]:
        print("Error al iniciar sesión")
        response = {"error": "Error al iniciar sesión"}
        await clients[idWesock].send_text(json.dumps(response))
        managers[idWesock].closeSession()
        clients[idWesock].close()
        return
    managers[idWesock].obtain_server_time()
    managers[idWesock].obtain_last_messages()
    managers[idWesock].obtain_roster_contacts()
    managers[idWesock].obtain_my_vcard()
    await asyncio.sleep(4)
    managers[idWesock].obtain_users_filter()
    threading.Thread(target=listen, args=(managers[idWesock], queues[idWesock])).start()


async def register_user(idWesock:int, data: Dict):
    managers[idWesock] = ManagerXMPP(username=data["username"], fullname=data["fullname"], password=data["password"])
    queues[idWesock] = Queue()
    managers[idWesock].register()
    response = managers[idWesock].init_session()
    if not response[0]:
        print("Error al iniciar sesión")
        response = {"error": "Error al iniciar sesión"}
        await clients[idWesock].send_text(json.dumps(response))
        managers[idWesock].closeSession()
        clients[idWesock].close()
        return
    managers[idWesock].obtain_server_time()
    managers[idWesock].obtain_last_messages()
    managers[idWesock].obtain_roster_contacts()
    managers[idWesock].obtain_my_vcard()
    await asyncio.sleep(4)
    managers[idWesock].obtain_users_filter()
    threading.Thread(target=listen, args=(managers[idWesock], queues[idWesock])).start()

async def send_periodic_messages(websocket: WebSocket):
    while True:
        try:
            websocketId = id(websocket)
            if websocketId in queues:
                QueueById = queues[websocketId]
                if not QueueById.empty():
                    message = QueueById.get()
                    await websocket.send_text(message)

            await asyncio.sleep(0.1)
        except Exception as e:
            print(f"Error al enviar mensaje: {e}")
            break

async def listen_for_messages(websocket: WebSocket):
    while hasattr(websocket, 'accept'):
        try:
            data = await websocket.receive_text()
            intWebSocket = id(websocket)
            dataJson = json.loads(data)
            print(f"Mensaje recibido de {intWebSocket}: {dataJson}")

            if dataJson["type"] == "login":
                await init_session(intWebSocket, dataJson)
            elif dataJson["type"] == "register":
                await register_user(intWebSocket, dataJson)

            elif dataJson["type"] == "message":
                if intWebSocket in managers:
                    managers[intWebSocket].send_chat_message(dataJson["body"] ,dataJson["to"], dataJson["typechat"])

            elif dataJson["type"] == "refreshUserlist":
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_users_filter()

            elif dataJson["type"] == "disconnect":
                if intWebSocket in managers:
                    managers[intWebSocket].closeSession()
                    del managers[intWebSocket]
                    del queues[intWebSocket]
                    websocket.close()
                    websocket = None
                    break
            elif dataJson["type"] == "addContact":
                if intWebSocket in managers and "contact" in dataJson:
                    print("Añadir contacto")
                    managers[intWebSocket].add_contact(dataJson["contact"])
            elif dataJson["type"] == "acceptContact":
                if intWebSocket in managers and "contact" in dataJson:
                    managers[intWebSocket].accept_subscription(dataJson["contact"])
            elif dataJson["type"] == "rejectContact":
                if intWebSocket in managers and "contact" in dataJson:
                    managers[intWebSocket].unsubscribe(dataJson["contact"])

            elif dataJson["type"] == "deleteAccount":
                if intWebSocket in managers:
                    managers[intWebSocket].deleteAccount()
                    managers[intWebSocket].closeSession()
                    del managers[intWebSocket]
                    del queues[intWebSocket]
                    websocket.close()
                    websocket = None
                    break	
            elif dataJson["type"] == "uploadProfilePicture":
                if intWebSocket in managers and "file64" in dataJson and "filename" in dataJson:
                    managers[intWebSocket].upload_profile_picture(dataJson['file64'], dataJson['filename'])

            elif dataJson["type"] == "sendFile":
                if intWebSocket in managers and "content" in dataJson and "filename" in dataJson and "to" in dataJson:
                    # Parse content from str a bytes, not 64
                    base64_content = dataJson['content']
    
                    # Decodificar base64 a bytes
                    file_bytes = base64.b64decode(base64_content)

                    managers[intWebSocket].file_message(to=dataJson['to'], file_bytes=file_bytes, filename=dataJson['filename'], type_=dataJson['typechat']) 

            elif dataJson["type"] == "obtainGroupChats":
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_group_chats()

            elif dataJson["type"] == "createGroupChat":
                if intWebSocket in managers and "name" in dataJson and "config" in dataJson:
                    managers[intWebSocket].create_group_chat(dataJson['name'])
                    configS = {}
                    for configkey, value in dataJson['config'].items():
                        if configkey == "description":
                            configS["muc#roomconfig_roomdesc"] = value
                        elif configkey == "maxusers":
                            configS["muc#roomconfig_maxusers"] = value
                        elif configkey == "publicroom":
                            configS["muc#roomconfig_publicroom"] = value
                        elif configkey == "allowinvites":
                            configS["muc#roomconfig_allowinvites"] = value
                        elif configkey == "enablelogging":
                            configS["muc#roomconfig_enablelogging"] = value
                        elif configkey == "nameroom":
                            configS["muc#roomconfig_roomname"] = value

                    managers[intWebSocket].configure_group_chat(dataJson['name'], configS)

            elif dataJson["type"] == "sendPrecense":
                if intWebSocket in managers and "to":
                    managers[intWebSocket].precesenced_group(dataJson['to'])

            elif dataJson["type"] == "updateChatGroups":
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_group_chats()
            
            elif dataJson["type"] == "updateUsers":
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_users_filter()


            elif dataJson["type"] == "changeProfileImg":
                if intWebSocket in managers and "file64" in dataJson and "filename" in dataJson:
                    managers[intWebSocket].upload_profile_picture(dataJson['file64'], dataJson['filename'])

            elif dataJson["type"] == "changeStatus":
                if intWebSocket in managers and ("status_message" in dataJson or "show" in dataJson):
                    managers[intWebSocket].change_Precense(dataJson['status_message'], dataJson['show'])
                

        except Exception as e:
            print(f"Error al recibir mensaje: {e}")
            break

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    print("WebSocket conectado", websocket)
    await websocket.accept()
    idWebSocket = id(websocket)
    clients[idWebSocket] = websocket

    
    # Iniciar tareas asincrónicas para enviar y recibir mensajes
    send_task = asyncio.create_task(send_periodic_messages(websocket))
    listen_task = asyncio.create_task(listen_for_messages(websocket))

    # Mandar mensaje inicial
    initM = {'type': "Alredy connected"}
    await websocket.send_text(json.dumps(initM))

    try:
        # Espera para permitir que las tareas se ejecuten
        await asyncio.wait([send_task, listen_task], return_when=asyncio.FIRST_COMPLETED)
    except Exception as e:
        print(f"Error en la conexión WebSocket: {e}")
    finally:
        
        if idWebSocket in managers:
            managers[idWebSocket].__del__()
        if idWebSocket in queues:
            del queues[idWebSocket]
        
        clients[idWebSocket].close()
        del clients[idWebSocket]
        
        
        await websocket.close()
    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="8000")