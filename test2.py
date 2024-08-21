import json
import re
from ManagerXMPP import ManagerXMPP, parseXMLTOJSON
import xml.etree.ElementTree as ET
from tabulate import tabulate
import pandas as pd

# cargar un archivo en bytes
with open("retrato-perro-chihuahua-vestido-como-luchador-lucha-libre-mexicana-tradicional-mexico_655090-950396.jpg", "rb") as f:
    data: bytes = f.read()




# Crear instancia de ManagerXMPP
xmpp_client = ManagerXMPP(username="val21240-testWeb", fullname="Web Service", password="PSSWD")
#xmpp_client.init_session()
#xmpp_client.register()
res = xmpp_client.init_session()
#xmpp_client.accept_subscription("val21240-testWeb@alumchat.lol")
#xmpp_client.add_contact("mnovella@alumchat.lol")
#xmpp_client.obtain_users_filter()
#xmpp_client.obtain_server_time()
#xmpp_client.obtain_group_chats()
xmpp_client.upload_profile_picture( data, "retrato-perro-chihuahua-vestido-como-luchador-lucha-libre-mexicana-tradicional-mexico_655090-950396.jpg")

#xmpp_client.obtain_last_messages()

# Enviar mensaje de prueba
#xmpp_client.send_message("<message to='val21240@alumchat.lol' type='chat'><body>Hello, this is a test message.</body></message>")



# Mantener el script en ejecución para recibir mensajes
try:
     while hasattr(xmpp_client, 'ssl_sock'):
          response = b''
          while hasattr(xmpp_client, 'ssl_sock'):
               chunk = xmpp_client.ssl_sock.recv(4096)
               response += chunk
               if len(chunk) < 4096:
                    try:
                        response_decoded = response.decode('utf-8')
                        dictS = parseXMLTOJSON(response_decoded)
                        json_data = json.dumps(dictS, indent=4)
                        break
                    except Exception as e:
                         pass
          print()
          print('###')
          print('Response:', response)
          print('Json Data:', json_data)
          input("Presiona enter para continuar")

          """
          if "@from" in dictS[list(dictS.keys())[0]]:
               print("From:", dictS[list(dictS.keys())[0]]["@from"])
               print("Message:")
               print(dictS.keys())
               print(dictS[list(dictS.keys())[0]])
               input("Presiona enter para continuar")
          """


          
          # Verificar si dictS es iq, y si tiene @id add[Algun numero]
          if "iq" in dictS:
               if "@id" in dictS["iq"]:
                    # Verificar que siga el formato de add[Algun numero]
                    id_iq = dictS["iq"]["@id"]
                    if id_iq == "disco_items_1":
                         # Obtener disco items
                         disco_items = dictS["iq"]
                         print("Disco Items:")
                         print(disco_items)
                         input("Presiona enter para continuar")
                         pass
                    elif re.match(r'^add[0-9]+$', id_iq):
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
