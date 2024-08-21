import slixmpp

class Test(slixmpp.ClientXMPP):
    
        def __init__(self, jid, password):
            slixmpp.ClientXMPP.__init__(self, jid, password)
    
            self.add_event_handler('session_start', self.start)

            # Recibe mensajes
            self.add_event_handler('message', self.message)

        def message(self, msg):
             print(f"Mensaje recibido: {msg}")
    
        def start(self, event):
            self.send_presence()
            self.get_roster()
            self.send_presence()