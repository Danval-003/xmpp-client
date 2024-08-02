from ManagerXMPP import ManagerXMPP



# Crear instancia de ManagerXMPP
xmpp_client = ManagerXMPP(username="testWeb", fullname="Web Service", password="PSSWD")
#xmpp_client.init_session()
#xmpp_client.register()
xmpp_client.init_session()
xmpp_client.obtain_users_filter()

# Enviar mensaje de prueba
xmpp_client.send_message("<message to='val21240@alumchat.lol' type='chat'><body>Hello, this is a test message.</body></message>")

# Cerar sesión
xmpp_client.closeSession()

# Mantener el script en ejecución para recibir mensajes
try:
    while True:
        pass
except KeyboardInterrupt:
    print("Script terminado por el usuario.")
    exit(0)
