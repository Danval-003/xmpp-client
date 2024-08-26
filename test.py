import json
import re
from ManagerXMPP import ManagerXMPP, parseXMLTOJSON
import xml.etree.ElementTree as ET
from tabulate import tabulate
import pandas as pd

with open("retrato-perro-chihuahua-vestido-como-luchador-lucha-libre-mexicana-tradicional-mexico_655090-950396.jpg", "rb") as f:
     data: bytes = f.read()

# Crear instancia de ManagerXMPP
xmpp_client = ManagerXMPP(username="val21240-testweb", fullname="Web Service", password="PSSWD")
res = xmpp_client.init_session()

# Crear y configurar el grupo
"""xmpp_client.create_group_chat("AmigosDelRock")
xmpp_client.configure_group_chat("AmigosDelRock", {
    "muc#roomconfig_persistentroom": "1",
    "muc#roomconfig_roomname": "AmigosDelRock",
    "muc#roomconfig_roomdesc": "Grupo de amigos que les gusta el rock",
    "muc#roomconfig_changesubject": "1",
    "muc#roomconfig_maxusers": "100",
    "muc#roomconfig_publicroom": "1",
    "muc#roomconfig_allowinvites": "1",
    "muc#roomconfig_enablelogging": "1",
})"""

xmpp_client.precesenced_group("amigosdelrock")


# Añadir personas al grupo
#xmpp_client.add_people_to_group("AmigosDelRock", "andrea-redestest", "Unete al chat weona")
#xmpp_client.add_people_to_group("AmigosDelRock", "val21240", "Unete al chat weona")

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
        

        dictCopy = dictS.copy()

        # Verify if the message is from a conference, use dictS
        # Obtain texts from conferenceJid if exists on dictS using regex
        

        if "iq" in dictS and "@id" in dictS["iq"]:
            id_iq = dictS["iq"]["@id"]
            if id_iq == "disco_items_1":
                disco_items = dictS["iq"]
                print("Disco Items:")
                print(disco_items)
                input("Presiona enter para continuar")
            elif re.match(r'^add[0-9]+$', id_iq):
                number = re.sub(r'add', '', id_iq)
                print(f"Number: {number}")
                if number.isnumeric():
                    id_iq = int(number)
                    jid_contact = xmpp_client.pendient_contacts[id_iq]
                    precense = f"<presence to='{jid_contact}' type='subscribe'/>"
                    xmpp_client.send_message(precense)
                    del xmpp_client.pendient_contacts[id_iq]

        input("Presiona enter para continuar")

except KeyboardInterrupt:
    print("Script terminado por el usuario.")
    xmpp_client.closeSession()
    exit(0)
