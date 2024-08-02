from fastapi import FastAPI, WebSocket
import asyncio
from typing import *
from ManagerXMPP import ManagerXMPP
import json
import threading
from queue import Queue
import re

app = FastAPI()

clients: List[WebSocket] = []

managers: Dict[int, ManagerXMPP] = {}
queues: Dict[int, Queue] = {}

def listen(manager: ManagerXMPP, queue: Queue):
    while manager.running:
        try:
            response = manager.ssl_sock.recv(4096)
            if not response:
                break

            message = response.decode('utf-8')
            print(f"Received raw: {message}")

            # Procesa y analiza los mensajes
            if '<message' in message:
                sender = re.search(r'from="([^"]*)"', message).group(1)
                sender = sender.split('@')[0]
                
                messageDict = {
                    'from': sender,
                    'body': re.search(r'<body>(.*)</body>', message).group(1),
                    'type': re.search(r'type="([^"]*)"', message).group(1),
                    'to': re.search(r'to="([^"]*)"', message).group(1)
                }
                messageJson = json.dumps(messageDict)
                queue.put(messageJson)
        except Exception as e:
            print(f"Error en listen: {e}")

async def init_session(idWesock:int):
    managers[idWesock] = ManagerXMPP(username="testWeb", fullname="Web Service", password="PSSWD")
    queues[idWesock] = Queue()
    managers[idWesock].init_session()
    threading.Thread(target=listen, args=(managers[idWesock], queues[idWesock])).start()


async def register_user(idWesock:int, data: Dict):
    managers[idWesock] = ManagerXMPP(username=data["username"], fullname=data["fullname"], password=data["password"])
    queues[idWesock] = Queue()
    managers[idWesock].register()
    managers[idWesock].init_session()
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
                await init_session(intWebSocket)
            elif dataJson["type"] == "register":
                await register_user(intWebSocket, dataJson)

            elif dataJson["type"] == "message":
                if intWebSocket in managers:
                    managers[intWebSocket].send_chat_message(dataJson["body"] ,dataJson["to"])
                

        except Exception as e:
            print(f"Error al recibir mensaje: {e}")
            break

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    
    # Iniciar tareas asincrónicas para enviar y recibir mensajes
    send_task = asyncio.create_task(send_periodic_messages(websocket))
    listen_task = asyncio.create_task(listen_for_messages(websocket))

    try:
        # Mantener la conexión abierta
        await websocket.send_text("Conexión establecida. Enviando mensajes cada 2 segundos.")
        # Espera para permitir que las tareas se ejecuten
        await asyncio.wait([send_task, listen_task], return_when=asyncio.FIRST_COMPLETED)
    except Exception as e:
        print(f"Error en la conexión WebSocket: {e}")
    finally:
        clients.remove(websocket)
        idWebSocket = id(websocket)
        if idWebSocket in managers:
            managers[idWebSocket].running = False
            del managers[idWebSocket]
        if idWebSocket in queues:
            del queues[idWebSocket]
        await websocket.close()
    
