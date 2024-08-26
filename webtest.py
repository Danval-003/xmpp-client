"""
Author: Daniel Armando Valdez Reyes
Date: 2024-08-25
Description: Server for XMPP client using FastAPI and WebSockets
"""
import base64
from fastapi import FastAPI, WebSocket
import asyncio
from typing import *
from ManagerXMPP import ManagerXMPP, parseXMLTOJSON
import json
import threading
from queue import Queue
import re

# Parse XML to JSON
app = FastAPI()

# WebSockets
clients: Dict[int,WebSocket] = {}
 
# Managers and Queues
managers: Dict[int, ManagerXMPP] = {}
queues: Dict[int, Queue] = {}

def listen(manager: ManagerXMPP, queue: Queue):
    """
    Listen for messages from the server xmpp
    :param manager: ManagerXMPP, the manager
    :param queue: Queue, the queue to store the messages
    """
    while hasattr(manager, 'running'):
        try:
            response = b''
            # Receive data from the server
            while hasattr(manager, 'running'):
                chunk = manager.ssl_sock.recv(4096)
                response += chunk
                if len(chunk) < 4096:
                    try:
                        # Decode the response and parse it to JSON
                        response_decoded = response.decode('utf-8')
                        dictS = parseXMLTOJSON(response_decoded)
                        dictS = json.dumps(dictS, indent=4)
                        print('Parsed:', dictS)
                        break
                    except Exception as e:
                        # If the response is not a valid XML, continue receiving data
                        print(f"Error en parseXMLTOJSON: {e}", response_decoded)
            
            # If the response is empty, continue the loop
            response_decoded = response.decode('utf-8')
            # If the response is empty, continue the loop
            if len(response) == 0:
                continue

            try:
                # Parse the response to JSON
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
                
                # Send the parsed response to the queue
                queue.put(dictS)
            except Exception as e:
                print(f"Error en parseXMLTOJSON: {e}", response_decoded)

        except Exception as e:
            print(f"Error en listen: {e}")
            break

async def send_periodic_ping(idWebSocket: int):
    """
    Send a ping message to the server to keep the connection alive
    :param idWebSocket: int, the id of the websocket
    """
    manager = managers[idWebSocket]
    while hasattr(manager, 'running'):
        try:
            manager.send_ping()
            await asyncio.sleep(10)
        except Exception as e:
            print(f"Error al enviar ping: {e}")
            break

async def init_session(idWesock:int, data: Dict):
    """
    Initialize the session with the server
    :param idWesock: int, the id of the websocket
    :param data: Dict, the data sent by the client
    """
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
    """
    Obtain the server time, last messages, roster contacts and my vcard
    """
    managers[idWesock].obtain_server_time()
    managers[idWesock].obtain_last_messages()
    managers[idWesock].obtain_roster_contacts()
    managers[idWesock].obtain_my_vcard()
    await asyncio.sleep(4)
    # Obtain the users filter
    managers[idWesock].obtain_users_filter()
    threading.Thread(target=listen, args=(managers[idWesock], queues[idWesock])).start()


async def register_user(idWesock:int, data: Dict):
    """
    Register a new user in the server
    :param idWesock: int, the id of the websocket
    :param data: Dict, the data sent by the client
    """
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
    # Obtain the server time, last messages, roster contacts and my vcard
    managers[idWesock].obtain_server_time()
    managers[idWesock].obtain_last_messages()
    managers[idWesock].obtain_roster_contacts()
    managers[idWesock].obtain_my_vcard()
    await asyncio.sleep(4)
    # Obtain the users filter
    managers[idWesock].obtain_users_filter()
    threading.Thread(target=listen, args=(managers[idWesock], queues[idWesock])).start()

async def send_periodic_messages(websocket: WebSocket):
    """
    Send messages to the client
    :param websocket: WebSocket, the websocket
    """
    while True:
        try:
            websocketId = id(websocket)
            # Check if the websocket is in the queues
            if websocketId in queues:
                # Get the messages from the queue
                QueueById = queues[websocketId]
                if not QueueById.empty():
                    message = QueueById.get()
                    await websocket.send_text(message)

            await asyncio.sleep(0.1)
        except Exception as e:
            print(f"Error al enviar mensaje: {e}")
            break

async def listen_for_messages(websocket: WebSocket):
    """
    Listen for messages from the client
    :param websocket: WebSocket, the websocket to listen
    """
    while hasattr(websocket, 'accept'):
        try:
            data = await websocket.receive_text()
            intWebSocket = id(websocket)
            dataJson = json.loads(data)
            print(f"Mensaje recibido de {intWebSocket}: {dataJson}")

            # Check the type of the message
            if dataJson["type"] == "login":
                # Initialize the session
                await init_session(intWebSocket, dataJson)
            elif dataJson["type"] == "register":
                # Register a new user
                await register_user(intWebSocket, dataJson)

            elif dataJson["type"] == "message":
                # Send a message
                if intWebSocket in managers:
                    managers[intWebSocket].send_chat_message(dataJson["body"] ,dataJson["to"], dataJson["typechat"])

            elif dataJson["type"] == "refreshUserlist":
                # Obtain the users filter
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_users_filter()

            elif dataJson["type"] == "disconnect":
                # Close the session
                if intWebSocket in managers:
                    managers[intWebSocket].closeSession()
                    del managers[intWebSocket]
                    del queues[intWebSocket]
                    websocket.close()
                    websocket = None
                    break
            elif dataJson["type"] == "addContact":
                # Add a new contact
                if intWebSocket in managers and "contact" in dataJson:
                    print("Añadir contacto")
                    managers[intWebSocket].add_contact(dataJson["contact"])
            elif dataJson["type"] == "acceptContact":
                # Accept a contact
                if intWebSocket in managers and "contact" in dataJson:
                    managers[intWebSocket].accept_subscription(dataJson["contact"])
            elif dataJson["type"] == "rejectContact":
                # Reject a contact
                if intWebSocket in managers and "contact" in dataJson:
                    managers[intWebSocket].unsubscribe(dataJson["contact"])

            elif dataJson["type"] == "deleteAccount":
                # Delete the account
                if intWebSocket in managers:
                    managers[intWebSocket].deleteAccount()
                    managers[intWebSocket].closeSession()
                    del managers[intWebSocket]
                    del queues[intWebSocket]
                    websocket.close()
                    websocket = None
                    break	
            elif dataJson["type"] == "uploadProfilePicture":
                # Upload a profile picture
                if intWebSocket in managers and "file64" in dataJson and "filename" in dataJson:
                    managers[intWebSocket].upload_profile_picture(dataJson['file64'], dataJson['filename'])

            elif dataJson["type"] == "sendFile":
                # Send a file
                if intWebSocket in managers and "content" in dataJson and "filename" in dataJson and "to" in dataJson:
                    # Parse content from str a bytes, not 64
                    base64_content = dataJson['content']
    
                    # Decodificar base64 a bytes
                    file_bytes = base64.b64decode(base64_content)

                    managers[intWebSocket].file_message(to=dataJson['to'], file_bytes=file_bytes, filename=dataJson['filename'], type_=dataJson['typechat']) 

            elif dataJson["type"] == "obtainGroupChats":
                # Obtain the group chats
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_group_chats()

            elif dataJson["type"] == "createGroupChat":
                # Create a group chat
                if intWebSocket in managers and "name" in dataJson and "config" in dataJson:
                    managers[intWebSocket].create_group_chat(dataJson['name'])
                    configS = {}
                    # Parse the configuration
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
                    
                    # Configure the group chat
                    managers[intWebSocket].configure_group_chat(dataJson['name'], configS)

            elif dataJson["type"] == "sendPrecense":
                # Send a presence message to a group
                if intWebSocket in managers and "to":
                    managers[intWebSocket].precesenced_group(dataJson['to'])

            elif dataJson["type"] == "updateChatGroups":
                # Update the chat groups
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_group_chats()
            
            elif dataJson["type"] == "updateUsers":
                # Update the users
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_users_filter()


            elif dataJson["type"] == "changeProfileImg":
                # Change the profile image
                if intWebSocket in managers and "file64" in dataJson and "filename" in dataJson:
                    managers[intWebSocket].upload_profile_picture(dataJson['file64'], dataJson['filename'])

            elif dataJson["type"] == "changeStatus":
                # Change the status
                if intWebSocket in managers and ("status_message" in dataJson or "show" in dataJson):
                    managers[intWebSocket].change_Precense(dataJson['status_message'], int(dataJson['show']))

            elif dataJson["type"] == "obtainRoster":
                # Obtain the roster
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_roster_contacts()
                

        except Exception as e:
            print(f"Error al recibir mensaje: {e}")
            break

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    Websocket endpoint
    :param websocket: WebSocket, the websocket
    """
    print("WebSocket conectado", websocket)
    await websocket.accept()
    idWebSocket = id(websocket)
    # Guardar el websocket en la lista de clientes
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
        # Cerrar la conexión
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