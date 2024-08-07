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
                    break

            response_decoded = response.decode('utf-8')
            
            if len(response) == 0:
                continue

            print(response_decoded) 
            dictS = parseXMLTOJSON(response_decoded)
            print(dictS)
            
            # Convertir diccionario a JSON
            json_data = json.dumps(dictS, indent=4)
            queue.put(json_data)

        except Exception as e:
            print(f"Error en listen: {e}")
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
            await asyncio.sleep(2)  # Espera de 2 segundos
        except Exception as e:
            print(f"Error al enviar mensaje: {e}")
            break

async def listen_for_messages(websocket: WebSocket):
    while True:
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
                    managers[intWebSocket].send_chat_message(dataJson["body"] ,dataJson["to"])

            elif dataJson["type"] == "refreshUserlist":
                if intWebSocket in managers:
                    managers[intWebSocket].obtain_users_filter()
                

        except Exception as e:
            print(f"Error al recibir mensaje: {e}")
            break

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    idWebSocket = id(websocket)
    clients[idWebSocket] = websocket

    
    # Iniciar tareas asincrónicas para enviar y recibir mensajes
    send_task = asyncio.create_task(send_periodic_messages(websocket))
    listen_task = asyncio.create_task(listen_for_messages(websocket))

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
    