import socket
import ssl
import threading
from queue import Queue
import base64
import re
import websockets
import json
import xml.etree.ElementTree as ET
import tabulate
from typing import *

class ManagerXMPP:
    def __init__(self, username: str, password: str, fullname: str = ''):
        self.username = "val21240-" + username
        self.fullname = fullname
        self.password = password
        self.server = "alumchat.lol"
        self.email = "val21240@uvg.edu.gt"
        self.jid = ""

        self.printCond = threading.Condition()
        
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.server, 5222))

        self.context = ssl.create_default_context()
        self.context.check_hostname = False
        self.context.verify_mode = ssl.CERT_NONE

        self.contact_count = 0
        self.pendient_contacts: Dict[int, str] = {}

    def __del__(self):
        self.running = False
        self.printCond.acquire()
        self.printCond.notify_all()
        self.printCond.release()
        if hasattr(self, 'ssl_sock'):
            self.ssl_sock.close()
        
        if hasattr(self, 'sock'):
            self.sock.close()

        if hasattr(self, 'listen_thread'):
            self.listen_thread.join()

        if hasattr(self, 'messages'):
            self.messages.queue.clear()

        print("Connection closed.")


    def send_message(self, message):
        try:
            print(f"Sending: {message}")
            self.ssl_sock.sendall(message.encode('utf-8'))
        except Exception as e:
            print(f"Error in send_message: {e}")

    def send_andReceive(self, message):
        self.sock.sendall(message.encode('utf-8'))
        response = b''
        while True:
            chunk = self.sock.recv(4096)
            response += chunk
            if len(chunk) < 4096:
                break
        response_decoded = response.decode('utf-8')
        print()
        print()
        print(f"###############")
        print(f"___Received: {response_decoded}")
        print(f"###############")
        print()
        print()
        return response_decoded

    def send_andReceiveWithSSL(self, message):
        self.send_message(message)
        response = b''
        while True:
            chunk = self.ssl_sock.recv(4096)
            response += chunk
            if len(chunk) < 4096:
                break
        response_decoded = response.decode('utf-8')
        print()
        print()
        print(f"###############")
        print(f"___Received: {response_decoded}")
        print(f"###############")
        print()
        print()
        return response_decoded
    
    def register(self) -> tuple[bool, str]:
        initFlow = f"""<?xml version='1.0'?><stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>"""
        print("-------------------------------------------------------")
        print("Sent initial stream.")
        response = self.send_andReceive(initFlow)
        # Verify if successful
        if "<stream:features>" not in response:
            print("Failed to start stream.")
            return False, "Failed to start stream."

        register_form = """<iq type='get' id='reg1'><query xmlns='jabber:iq:register'/></iq>"""
        print()
        response = self.send_andReceive(register_form)
        if "<iq type='result'" not in response and "<iq type=\"result\"" not in response:
            print("Failed to get register form.")
            return False, "Failed to get register form."

        register_form = f"""<iq type='set' id='reg2'><query xmlns='jabber:iq:register'><username>{self.username}</username><password>{self.password}</password><email>{self.email}</email><name>{self.fullname}</name></query></iq>"""
        response = self.send_andReceive(register_form)
        print()
        if "<iq type='result'" not in response and "<iq type=\"result\"" not in response:
            print("Failed to register.")
            return False, "Failed to register."

        # Close socket and create a new
        self.sock.close()
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.server, 5222))

        print("-------------------------------------------------------")
        return True, "Registered successfully."

    def init_session(self) -> Tuple[bool, str]:
        try:
            init_stream = f"""<?xml version='1.0'?><stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>"""
            self.sock.sendall(init_stream.encode('utf-8'))
            print("-------------------------------------------------------")
            print("Sent initial stream.")
            result = (False, "Failed to initialize session.")

            # Receive initial server features
            while True:
                response = self.sock.recv(4096).decode('utf-8')
                # verify if this is successful
                if "<stream:features>" not in response:
                    print("Failed to start stream.")
                    return False, "Failed to start stream."

                if '<mechanism>PLAIN</mechanism>' in response:
                    result = self.start_tls()
                    if not result[0]:
                        return result

                if '</stream:features>' in response:
                    break
            
            print("-------------------------------------------------------")

            self.running = True  # Flag para controlar los hilos

            print()
            print()
            print("############")
            print("### XMPP ###")
            print("############")
            print()
            print()

            
            return True, "Session initialized successfully."

        except Exception as e:
            print(f"Error initializing session: {e}")

    def start_tls(self) -> Tuple[bool, str]:
        try:
            start_tls_message = "<starttls xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>"
            self.sock.sendall(start_tls_message.encode('utf-8'))
            print("Sent STARTTLS command.")
            # Le preguntas a chatgpt por el flow de xml
            # Y solo seguis los pasos

            response = self.sock.recv(4096).decode('utf-8')
            if '<proceed xmlns=' in response:
                self.ssl_sock = self.context.wrap_socket(self.sock, server_hostname=self.server)
                print("TLS handshake completed.")

                # Reiniciar el flujo XMPP con el socket TLS
                restart_stream = f"""<?xml version='1.0'?><stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>"""
                self.ssl_sock.sendall(restart_stream.encode('utf-8'))
                print("Sent restart stream after TLS.")

                # Receive new server features after TLS
                while True:
                    response = self.ssl_sock.recv(4096).decode('utf-8')
                    if '<mechanism>PLAIN</mechanism>' in response:
                        
                        return self.authenticate()

                    if '</stream:features>' in response:
                        return False, "Failed to initiate TLS"
            else:
                raise Exception("Failed to initiate TLS")

        except Exception as e:
            print(f"Error starting TLS: {e}")

    def send_chat_message(self, message: str, to: str):
        chat_message = f"""<message to='{to}@{self.server}' type='chat'><body>{message}</body></message>"""
        self.send_message(chat_message)
        print(f"Sent message to {to}: {message}")

    def authenticate(self) -> Tuple[bool, str]:
        auth_string = f'\0{self.username}\0{self.password}'
        auth_b64 = base64.b64encode(auth_string.encode()).decode()
        auth_message = f'<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">{auth_b64}</auth>'
        self.send_message(auth_message)
        
        # Esperar a que llegue la respuesta de autenticación
        while True:
            response = self.ssl_sock.recv(4096).decode('utf-8')
            if "<success xmlns=" in response:
                print("Authenticated successfully.")
                print("__Authenticated__:", response)
                iq_bind = """
<iq type='set' id='bind1'>
  <bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'>
    <resource>testWeb</resource>
  </bind>
</iq>
"""
                response = self.send_andReceiveWithSSL(iq_bind)
                if ('<jid>' in response):
                    self.jid = re.search(r'<jid>(.*?)</jid>', response).group(1)
                    print(f"JID: {self.jid}")
                self.restart_flow()
                return True, "Authenticated successfully."
                
            elif "<failure xmlns=" in response:
                print("Authentication failed.")
                return False, "Authentication failed."

    def restart_flow(self):
        restart_stream = f"""<?xml version='1.0'?><stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>"""
        response = self.send_andReceiveWithSSL(restart_stream)
        

        # Link resource

        # Session
        session = """<iq type='set' id='sess1'><session xmlns='urn:ietf:params:xml:ns:xmpp-session'/></iq>"""
        response = self.send_andReceiveWithSSL(session)

        if "<iq type='result'" in response or "<iq type=\"result\"" in response:
            print("Session started successfully.")
        else:
            print("Session failed to start.")

        # Precense
        presence = """<presence/>"""
        response = self.send_andReceiveWithSSL(presence)


    def obtain_users_filter(self, filter: str = "*"):
        # Construir la solicitud de búsqueda con el filtro especificado
        iq = f"""<iq type='set' from='{self.username}@{self.server}/testWeb' to='search.alumchat.lol' id='search1' xml:lang='en'>
    <query xmlns='jabber:iq:search'>
        <x xmlns='jabber:x:data' type='submit'>
        <field var='FORM_TYPE' type='hidden'>
            <value>jabber:iq:search</value>
        </field>
        <field var='search'>
            <value>{filter}</value> <!-- Valor de búsqueda -->
        </field>
        <field var='Username' type='boolean'>
            <value>1</value>
        </field>
        <field var='Name' type='boolean'>
            <value>1</value>
        </field>
        <field var='Email' type='boolean'>
            <value>1</value>
        </field>
        </x>
    </query>
    </iq>"""
        # Enviar la solicitud y recibir la respuesta
        self.send_message(iq)

    
    def bind_resource(self):
        # Enviar la solicitud de bind
        iq_bind = f"""<iq type='set' id='bind1'><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'><resource>testWeb</resource></bind></iq>"""
        response = self.send_andReceiveWithSSL(iq_bind)
        print(f"Bind response: {response}")

    def auth(self):
        # Auth
        auth_string = f'\0{self.username}\0{self.password}'
        auth_b64 = base64.b64encode(auth_string.encode()).decode()
        auth_message = f'<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">{auth_b64}</auth>'
        response = self.send_andReceiveWithSSL(auth_message)
        print(f"Auth response: {response}")

    def start_session(self):
        # Enviar la solicitud de sesión
        iq_session = f"""<iq type='set' id='sess1'><session xmlns='urn:ietf:params:xml:ns:xmpp-session'/></iq>"""
        response = self.send_andReceiveWithSSL(iq_session)
        print(f"Session response: {response}")

    def obtain_roster_contacts(self):

        print("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
        print("Session started.")

        iq = f"""<iq type='get' from='{self.jid}' to='{self.server}' id='roster_1'>
        <query xmlns='jabber:iq:roster'/>
        </iq>"""

        def parse_roster_from_xml(xml_response):
            contacts = []

            # Expresiones regulares para extraer los campos de cada contacto
            contact_pattern = re.compile(
                r'<item jid="(.*?)" name="(.*?)"/>',
                re.DOTALL
            )

            # Buscar todos los matches en la respuesta XML
            matches = contact_pattern.findall(xml_response)

            # Construir la lista de contactos
            for match in matches:
                contact = {
                    'jid': match[0],
                    'name': match[1]
                }
                contacts.append(contact)

            return contacts

        # Enviar la solicitud y recibir la respuesta
        response = self.send_andReceiveWithSSL(iq)
        print("Contacts:")
        contacts = parse_roster_from_xml(response)
        print(tabulate.tabulate(contacts, headers="keys"))

        return contacts
    
    def obtainCorrectJID(self):
        iq = f"""<iq type='get' from='{self.username}@{self.server}/testWeb' to='{self.server}' id='roster_1'>
    <query xmlns='jabber:iq:roster'/>
    </iq>"""
        def parse_roster_from_xml(xml_response):
            contacts = []
            
            # Expresiones regulares para extraer los campos de cada contacto
            contact_pattern = re.compile(
                r'<item jid="(.*?)" name="(.*?)"/>',
                re.DOTALL
            )

            # Buscar todos los matches en la respuesta XML
            matches = contact_pattern.findall(xml_response)

            # Construir la lista de contactos
            for match in matches:
                contact = {
                    'jid': match[0],
                    'name': match[1]
                }
                contacts.append(contact)
            
            return contacts
        # Enviar la solicitud y recibir la respuesta
        response = self.send_andReceiveWithSSL(iq)

        contacts = parse_roster_from_xml(response)

        return contacts
    
    def closeSession(self):
        precense = f"""<presence type='unavailable' from="{self.username}@{self.server}/testWeb" to="{self.server}" />"""
        
        self.send_andReceiveWithSSL(precense)
        self.running = False
        self.sock.close()
        self.ssl_sock.close()

        self.__del__()

    def add_contact(self, jid: str):
        # Enviar la solicitud de agregar contacto
        iq = f"""<iq type='set' from='{self.jid}' id='add{self.contact_count}'>
    <query xmlns='jabber:iq:roster'>
        <item jid='{jid}' />
    </query>
    </iq>"""
        self.pendient_contacts[self.contact_count] = jid
        self.contact_count += 1
        response = self.send_message(iq)
        print(f"Add contact response: {response}")



    def deleteAccount(self):
        iq = f"""<iq type='set' id='reg2'><query xmlns='jabber:iq:register'><remove/></query></iq>"""
        self.send_message(iq)
        print("Account deleted.")


import xmltodict
import json

def parseXMLTOJSON(xml):
    # Convertir XML a diccionario
    dict_data = xmltodict.parse(xml)
    return dict_data