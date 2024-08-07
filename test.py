import json
import re
from ManagerXMPP import ManagerXMPP, parseXMLTOJSON
import xml.etree.ElementTree as ET
from tabulate import tabulate
import pandas as pd




# Crear instancia de ManagerXMPP
xmpp_client = ManagerXMPP(username="testWeb2", fullname="Web Service", password="PSSWD")
#xmpp_client.init_session()
#xmpp_client.register()
res = xmpp_client.init_session()
#xmpp_client.obtain_users_filter()

xmpp_client.add_contact("val21240@alumchat.lol")

# Enviar mensaje de prueba
#xmpp_client.send_message("<message to='val21240@alumchat.lol' type='chat'><body>Hello, this is a test message.</body></message>")



# Mantener el script en ejecución para recibir mensajes
try:
     while True:
          response = b''
          while True:
               chunk = xmpp_client.ssl_sock.recv(4096)
               response += chunk
               if len(chunk) < 4096:
                break
          response_decoded = response.decode('utf-8')
          print()
          print('###')
          print(response_decoded)
          print()
          dictS = parseXMLTOJSON(response_decoded)
          
          # Convertir diccionario a JSON
          json_data = json.dumps(dictS, indent=4)
          print(json_data)
          # Verificar si dictS es iq, y si tiene @id add[Algun numero]
          if "iq" in dictS:
               if "@id" in dictS["iq"]:
                    # Verificar que siga el formato de add[Algun numero]
                    id_iq = dictS["iq"]["@id"]
                    if re.match(r'^add[0-9]+$', id_iq):
                         # Obtener el número
                         number = re.sub(r'add', '', id_iq)
                         print(f"Number: {number}")
                         # Verificar si es un número
                         if number.isnumeric():
                             id_iq = int(number)
                             jid_contact = xmpp_client.pendient_contacts[id_iq]

                             # Mandar presencia de suscripción
                             precense = f"<presence to='{jid_contact}' type='subscribe'/>"
                             xmpp_client.send_message(precense)

                             # Eliminar contacto pendiente
                             del xmpp_client.pendient_contacts[id_iq]

               


except KeyboardInterrupt:
    print("Script terminado por el usuario.")
    xmpp_client.closeSession()
    exit(0)
