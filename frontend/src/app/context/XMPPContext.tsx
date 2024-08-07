'use client';
import React, { createContext, useState, useContext, ReactNode, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  from: string;
  body: string;
  to: string;
  type: string;
  id: string;
}

interface XMPPContextProps {
  connection: WebSocket | null;
  isLogin: boolean;
  initiateConnection: (username: string, password: string, type: string) => void;
  register: (username: string, password: string) => void;
  closeConnection: () => void;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
  messages: Message[];
  sendMessage: (To: string, Body: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  chats: Contact[];
  setChats: React.Dispatch<React.SetStateAction<Contact[]>>;
  userList: Users[];
  Logged: Number;
  setLogged: React.Dispatch<React.SetStateAction<Number>>;
}

interface Users {
  jid: string;
  name: string;
  fullname?: string;
  email?: string;
}

const XMPPContext = createContext<XMPPContextProps>({
  connection: null,
  isLogin: true,
  initiateConnection: () => {},
  closeConnection: () => {},
  setIsLogin: () => {},
  register: () => {},
  messages: [],
  sendMessage: () => {},
  setMessages: () => {},
  chats: [],
  setChats: () => {},
  userList: [],
  Logged: 0,
  setLogged: () => {},
});

interface Contact {
  jid: string;
  name: string;
  status?: string;
  active?: Number;
  imageBase64?: string;
}

interface XMPPProviderProps {
  children: ReactNode;
}

export const XMPPProvider: React.FC<XMPPProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Contact[]>([]);
  const [userList, setUserList] = useState<Users[]>([]);
  const [Logged, setLogged] = useState<Number>(0);
  const router = useRouter();

  useEffect(() => {
    // Clean up WebSocket connection on unmount
    return () => {
      if (connection) {
        connection.close();
      }
    };
  }, [connection]);

  const initiateConnection = (username: string, password: string, type: string) => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ username, password, type }));
      setConnection(ws);
      setLogged(1);
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        console.log('Received message:', data);   
        if (data.message){
          // For obtain from split the jid of @from
          const from = data.message['@from'].split('@')[0];

          if (data.message.body) {
            const messageData: Message = {
              from,
              body: data.message.body,
              to: data.message['@to'],
              type: data.message['@type'],
              id: data.message['@id'],
            }
            console.log('Received message:', messageData);
            setMessages(prev => [...prev, messageData]);
          } else if (data.message.event) {
            if (data.message.event.items) {
              if ('@node' in data.message.event.items) {
                if (data.message.event.items['@node'] === 'urn:xmpp:avatar:data') {
                  const imageBase64 = data.message.event.items.item.data['#text'];
                  console.log('Received image:', imageBase64);
  
                  setChats(prev => {
                    const newChats = prev.map(chat => {
                      // Verify if the chat contains the same jid. But exist cases were @from has jid/someting
                      if (chat.jid === data.message['@from'] || chat.jid.split('/')[0] === data.message['@from'].split('/')[0]) {
                        console.log('Chat found:', chat);
                        return {
                          ...chat,
                          imageBase64,
                        }
                      }
                      return chat;
                    });
                    return newChats;
                  });
  
                }
              }
            }
          }

        } else if (data.presence) {
          // For obtain name of the user only split the jid
          const name = data.presence['@from'].split('@')[0];

          const presenceData: Contact = {
            jid: data.presence['@from'],
            name,
            status: data.presence.status || '',
            active: ('idle' in data.presence) ? 0 : 1,
            imageBase64: '',
          }
          setChats(prev => [...prev, presenceData]);
        } else if (data.iq){
          if ('@from' in data.iq){
            if (data.iq['@from'] === "search.alumchat.lol"){
              const users = data.iq.query.x.item.map((item: any) => {
                const field = item.field;
  
                return {
                  jid: field[0].value,
                  name: field[1].value,
                  fullname: field[2].value,
                  email: field[3].value,
                }
              });
              console.log('Received users:', users);
              setUserList(users);
            }
            
          }
        } else if (data.error){
          console.log('Error:', data.error);
          setLogged(4);
        }
      } catch (error) {
        console.error('Error parsing message data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnection(null);
      setLogged(0);
    };
  };

  useEffect(() => {
    if(connection) {
      // Log status of the connection
      console.log('Current connection:', connection);
    }
  }, [connection]);

  useEffect(() => {
    if (userList.length > 0) {
      setLogged(2);
    }
  }, [userList]);

  useEffect(() => {
    if (Logged === 2) {
      router.push('/chat');
    } else if (Logged !== 2) {
      router.push('/');
    }
  }, [Logged]);

  const register = (username: string, password: string) => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ username, password, type: 'register', fullname: 'User' }));
      setConnection(ws);
      setLogged(1);
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        console.log('Received message:', data); 
        if (data.message){
          // For obtain from split the jid of @from
          const from = data.message['@from'].split('@')[0];

          if (data.message.body) {
            const messageData: Message = {
              from,
              body: data.message.body,
              to: data.message['@to'],
              type: data.message['@type'],
              id: data.message['@id'],
            }
            console.log('Received message:', messageData);
            setMessages(prev => [...prev, messageData]);
          } else if (data.message.event) {
            if (data.message.event.items) {
              if ('@node' in data.message.event.items) {
                if (data.message.event.items['@node'] === 'urn:xmpp:avatar:data') {
                  const imageBase64 = data.message.event.items.item.data['#text'];
                  console.log('Received image:', imageBase64);
  
                  setChats(prev => {
                    const newChats = prev.map(chat => {
                      // Verify if the chat contains the same jid. But exist cases were @from has jid/someting
                      if (chat.jid === data.message['@from'] || chat.jid.split('/')[0] === data.message['@from'].split('/')[0]) {
                        console.log('Chat found:', chat);
                        return {
                          ...chat,
                          imageBase64,
                        }
                      }
                      return chat;
                    });
                    return newChats;
                  });
  
                }
              }
            }
          }

        } else if (data.presence) {
          // For obtain name of the user only split the jid
          const name = data.presence['@from'].split('@')[0];

          const presenceData: Contact = {
            jid: data.presence['@from'],
            name,
            status: data.presence.status || '',
            active: ('idle' in data.presence) ? 0 : 1,
            imageBase64: '',
          }
          // Verify if not exist
          if (!chats.find((chat) => chat.jid === data.presence['@from'])) {
            setChats(prev => [...prev, presenceData]);
          } else {
            // If exist update the chat
            setChats(prev => {
              const newChats = prev.map(chat => {
                if (chat.jid === data.presence['@from']) {
                  return presenceData;
                }
                return chat;
              });
              return newChats;
            });
          }



        } else if (data.iq){
          if ('@from' in data.iq){
            if (data.iq['@from'] === "search.alumchat.lol"){
              const users = data.iq.query.x.item.map((item: any) => {
                const field = item.field;
  
                return {
                  jid: field[0].value,
                  name: field[1].value,
                  fullname: field[2].value,
                  email: field[3].value,
                }
              });
              console.log('Received users:', users);
              setUserList(users);
            }
            
          }
        } else if (data.error){
          console.log('Error:', data.error);
          setLogged(4);
        } 

      } catch (error) {
        console.error('Error parsing message data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setConnection(null);
      setLogged(0);
    };
  };

  const sendMessage = (to: string, body: string) => {
    const data = { to, body, type: 'message' };
    if (connection) {
      connection.send(JSON.stringify(data));
    }
  }

  const closeConnection = () => {
    if (connection) {
      connection.close();
      setConnection(null);
    }
  };

  useEffect(() => {
    if(connection) {
      console.log('Current connection:', connection);
    }
  }, [connection]);

  return (
    <XMPPContext.Provider value={{ connection, isLogin, initiateConnection, closeConnection, setIsLogin, register, messages, sendMessage, setMessages, chats, setChats, userList, Logged, setLogged }}>
      {children}
    </XMPPContext.Provider>
  );
};

export const useXMPP = () => {
  const context = useContext(XMPPContext);
  if (!context) {
    throw new Error('useXMPP must be used within an XMPPProvider');
  }
  return context;
};
