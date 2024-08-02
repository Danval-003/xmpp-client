import socket
import ssl
import threading
from queue import Queue
import base64

class ManagerXMPP:
    def __init__(self, username: str, fullname: str, password: str):
        self.username = "val21240-" + username
        self.fullname = fullname
        self.password = password
        self.server = "alumchat.lol"

        self.printCond = threading.Condition()
        
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.connect((self.server, 5222))

        self.context = ssl.create_default_context()
        self.context.check_hostname = False
        self.context.verify_mode = ssl.CERT_NONE

        self.init_session()

        self.messages = Queue()
        self.running = True  # Flag para controlar los hilos

        self.listen_thread = threading.Thread(target=self.listen)
        self.listen_thread.start()

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

    def listen(self):
        while self.running:
            try:
                response = self.ssl_sock.recv(4096)
                if not response:
                    break

                message = response.decode('utf-8')
                print(f"Received raw: {message}")

                # Procesa y analiza los mensajes
                if '<message' in message:
                    print(f"Message received: {message}")

                self.messages.put(message)
                with self.printCond:
                    self.printCond.notify()
            except Exception as e:
                print(f"Error in listen thread: {e}")


    def send_message(self, message):
        try:
            print(f"Sending: {message}")
            self.ssl_sock.sendall(message.encode('utf-8'))
        except Exception as e:
            print(f"Error in send_message: {e}")

    def send_andReceiveWithSSL(self, message):
        self.send_message(message)
        response = self.ssl_sock.recv(4096)
        response_decoded = response.decode('utf-8')
        print(f"___Received_: {response_decoded}")
        return response_decoded

    def init_session(self):
        try:
            init_stream = """<?xml version='1.0'?><stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>"""
            self.sock.sendall(init_stream.encode('utf-8'))
            print("Sent initial stream.")

            # Receive initial server features
            while True:
                response = self.sock.recv(4096).decode('utf-8')
                print(f"Received: {response}")
                if '<mechanism>PLAIN</mechanism>' in response:
                    self.start_tls()
                    return

                if '</stream:features>' in response:
                    break

            # Register the user
            iq_get_register = """<iq type='get' id='reg1'><query xmlns='jabber:iq:register'/></iq>"""
            self.send_message(iq_get_register)

            iq_set_register = """<iq type='set' id='reg2'><query xmlns='jabber:iq:register'><username>{self.username}</username><password>{self.password}</password><name>{self.fullname}</name></query></iq>"""
            self.send_message(iq_set_register)

        except Exception as e:
            print(f"Error initializing session: {e}")

    def start_tls(self):
        try:
            start_tls_message = "<starttls xmlns='urn:ietf:params:xml:ns:xmpp-tls'/>"
            self.sock.sendall(start_tls_message.encode('utf-8'))
            print("Sent STARTTLS command.")

            response = self.sock.recv(4096).decode('utf-8')
            if '<proceed xmlns=' in response:
                self.ssl_sock = self.context.wrap_socket(self.sock, server_hostname=self.server)
                print("TLS handshake completed.")

                # Reiniciar el flujo XMPP con el socket TLS
                restart_stream = """<?xml version='1.0'?><stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>"""
                self.ssl_sock.sendall(restart_stream.encode('utf-8'))
                print("Sent restart stream after TLS.")

                # Receive new server features after TLS
                while True:
                    response = self.ssl_sock.recv(4096).decode('utf-8')
                    print(f"Received: {response}")
                    if '<mechanism>PLAIN</mechanism>' in response:
                        self.authenticate()
                        return

                    if '</stream:features>' in response:
                        break

            else:
                raise Exception("Failed to initiate TLS")

        except Exception as e:
            print(f"Error starting TLS: {e}")

    def authenticate(self):
        auth_string = f'\0{self.username}\0{self.password}'
        auth_b64 = base64.b64encode(auth_string.encode()).decode()
        auth_message = f'<auth xmlns="urn:ietf:params:xml:ns:xmpp-sasl" mechanism="PLAIN">{auth_b64}</auth>'
        print("Trying to authenticate...")
        self.send_message(auth_message)
        
        # Esperar a que llegue la respuesta de autenticación
        while True:
            response = self.ssl_sock.recv(4096).decode('utf-8')
            print(f"Received_: {response}")
            if "<success xmlns=" in response:
                print("Authenticated successfully.")
                self.restart_flow()
                break
            elif "<failure xmlns=" in response:
                print("Authentication failed.")
                break

    def restart_flow(self):
        restart_stream = """<?xml version='1.0'?><stream:stream to='{self.server}' xmlns='jabber:client' xmlns:stream='http://etherx.jabber.org/streams' version='1.0'>"""
        response = self.send_andReceiveWithSSL(restart_stream)
        print(f"Received__: {response}")

        # Link resource
        resource_bind = """<iq type='set' id='bind1'><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'><resource>testWeb</resource></bind></iq>"""
        response = self.send_andReceiveWithSSL(resource_bind)
        print(f"Received__: {response}")

        # Session
        session = """<iq type='set' id='sess1'><session xmlns='urn:ietf:params:xml:ns:xmpp-session'/></iq>"""
        response = self.send_andReceiveWithSSL(session)
        print(f"Received__: {response}")

        if "<iq type='result'" in response or "<iq type=\"result\"" in response:
            print("Session started successfully.")
        else:
            print("Session failed to start.")

# Crear instancia de ManagerXMPP
xmpp_client = ManagerXMPP(username="test1", fullname="Web Service", password="PSSWD")

# Enviar mensaje de prueba
xmpp_client.send_message("<message to='val21240-testWeb@alumchat.lol' type='chat'><body>Hello, this is a test message.</body></message>")

# Mantener el script en ejecución para recibir mensajes
try:
    while True:
        pass
except KeyboardInterrupt:
    print("Script terminado por el usuario.")
    xmpp_client.__del__()
    exit(0)
