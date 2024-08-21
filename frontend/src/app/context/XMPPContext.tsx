'use client';
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Message {
  from: string;
  body: string;
  to: string;
  type: string;
  id: string;
  time: Date;
  chat: string;
  file?: File;
}

interface XMPPContextProps {
  connection: WebSocket | null;
  isLogin: boolean;
  initiateConnection: (username: string, password: string, type: string) => void;
  register: (username: string, password: string, fullname:string) => void;
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
  actualUser: string;
  contacts: Contacts_[];
  groupChats: GroupChat[];
  addContact: (jid: string) => void;
  rejectContact: (jid: string) => void;
  acceptContact: (jid: string) => void;
  solContacts: Solicitudes[];
  setSolContacts: React.Dispatch<React.SetStateAction<Solicitudes[]>>;
  disconnect: () => void;
  deleteAccount: () => void;
  iam: Contact;
  sendFile: (to: string, file: File) => void;
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
  actualUser: '',
  contacts: [],
  groupChats: [],
  addContact: () => {},
  rejectContact: () => {},
  acceptContact: () => {},
  solContacts: [],
  setSolContacts: () => {},
  disconnect: () => {},
  deleteAccount: () => {},
  iam: {
    jid: '',
    name: '',
    status: '',
    active: 0,
    imageBase64: '',
  },
  sendFile: () => {},
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

interface Contacts_ {
  jid: string;
  name: string;
  type: string;
}

interface Contacts__ {
  '@jid': string;
  '@subscription': string;
}

interface GroupChat {
  jid: string;
  name: string;
}

interface Solicitudes {
  jid: string;
  name: string;
  status: string;
}

export const XMPPProvider: React.FC<XMPPProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Contact[]>([]);
  const [userList, setUserList] = useState<Users[]>([]);
  const [Logged, setLogged] = useState<Number>(0);
  const [actualUser, setActualUser] = useState<string>('');
  const [contacts, setContacts] = useState<Contacts_[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [permission, setPermission] = useState<string>("default");
  const [solContacts, setSolContacts] = useState<Solicitudes[]>([]);
  const [iam, setIam] = useState<Contact>(
    {
      jid: '',
      name: '',
      status: '',
      active: 0,
      imageBase64: '',
    }
  );

  const router = useRouter();
  let TimeDiff: number = 0;
  let actual: string = ''

  // Funcion para hacer una notificación
  const notify = (title: string, body: string) => {
    if (permission === 'granted') {
      new Notification(title, { body });
      console.log('Notification sent:', title, body);
    }
  };

  useEffect(() => {
    // Clean up WebSocket connection on unmount
    return () => {
      if (connection) {
        connection.close();
      }
    };
  }, [connection]);

  // Función para solicitar permiso
  const requestPermission = () => {
    if (Notification.permission === 'default') {
        Notification.requestPermission().then((result) => {
            setPermission(result);
        });
    }
  };

  const initiateConnection = (username: string, password: string, type: string) => {
    console.log('Initiating connection');
    const ws = new WebSocket('ws://localhost:8000/ws');
    console.log('Initiating connection');
    
    ws.onopen = () => {
      console.log('Connection opened');
      ws.send(JSON.stringify({ username, password, type }));
      console.log('Connection opened');
      setConnection(ws);
      setActualUser(username.toLowerCase());
      actual = username.toLowerCase();
      // Do strip
      actual = actual.trim()
      setLogged(1);
    };

    ws.onmessage = (message) => {
      try { 
        const data = JSON.parse(message.data);
        console.log('Received message:', data);
        
    
        if (data.message) {
          if (data.message.body) {
            let messageData: Message;
            const from = data.message['@from'].split('@')[0];
            const isActualUser = from === actual;

            if (data.message.file) {
              const file = data.message.file.media;
              const filename = file.filename;
              const content_base64 = file.content;
              const type = filename.split('.').pop();

              // decode base64 to file
              const byteCharacters = atob(content_base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new File([byteArray], filename, { type: type });
              // Add or update chat for message
              messageData = {
                from,
                body: data.message.body,
                to: data.message['@to'],
                type: data.message['@type'],
                id: data.message['@id'],
                time: new Date(),
                chat: actual === from ? data.message['@to'].split('@')[0] : from,
                file: blob,
              };

            } else {
              // Add or update chat for message
              messageData = {
                from,
                body: data.message.body,
                to: data.message['@to'],
                type: data.message['@type'],
                id: data.message['@id'],
                time: new Date(),
                chat: actual === from ? data.message['@to'].split('@')[0] : from,
              };
            }
    
            
            console.log('Received message######:', messageData);
    
            setMessages(prev => {
              const newMessages = [...prev, messageData];
              newMessages.sort((a, b) => a.time.getTime() - b.time.getTime());
              return newMessages;
            });

            // Notify if message is from another user
            
            notify(`Mensaje de ${from}`, data.message.body);
            
    
            if (!isActualUser) {
              setChats(prev => {
                const existingChat = prev.find(chat => chat.name === from);
                if (!existingChat) {
                  // Add new chat if it does not exist
                  return [...prev, {
                    jid: data.message['@from'],
                    name: from,
                    status: '',
                    active: 6,
                    imageBase64: '',
                  }];
                }
                return prev;
              });
            }
          } else if (data.message.event) {
            if (data.message.event.items && '@node' in data.message.event.items && data.message.event.items['@node'] === 'urn:xmpp:avatar:data') {
              const from = data.message['@from'].split('@')[0];
              const isActualUser = from === actual;
              const imageBase64 = data.message.event.items.item.data['#text'];
              console.log('Received image:', imageBase64);
    
              if (!isActualUser) {
                setChats(prev => {
                  const chatIndex = prev.findIndex(chat => chat.name === from);
                  if (chatIndex === -1) {
                    // Add new chat if it does not exist
                    return [...prev, {
                      jid: data.message['@from'],
                      name: from,
                      status: '',
                      active: 6,
                      imageBase64,
                    }];
                  } else {
                    // Update existing chat with new image
                    const newChats = [...prev];
                    newChats[chatIndex] = { ...newChats[chatIndex], imageBase64 };
                    return newChats;
                  }
                });
              }
            }
          } else if (data.message.result) {
            if ('forwarded' in data.message.result) {
              const forwarded = data.message.result.forwarded;
              const serverTime = new Date(forwarded.delay['@stamp']);
              const adjustedTime = new Date(serverTime.getTime() + TimeDiff);
              const from = forwarded.message['@from'].split('@')[0];
              const to = forwarded.message['@to'].split('@')[0];
              const isActualUser = from === actual || to === actual;

              let messageData: Message;

              if (forwarded.message.file) {
                const file = forwarded.message.file.media;
                const filename = file.filename;
                const content_base64 = file.content;
                const type = filename.split('.').pop();

                // decode base64 to file
                const byteCharacters = atob(content_base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new File([byteArray], filename, { type: type });
                // Add or update chat for message
                messageData = {
                  from,
                  body: forwarded.message.body,
                  to,
                  type: forwarded.message['@type'],
                  id: forwarded.message['@id'],
                  time: adjustedTime,
                  chat: from === actual ? to : from,
                  file: blob,
                };
              } else {
                messageData = {
                  from,
                  body: forwarded.message.body,
                  to,
                  type: forwarded.message['@type'],
                  id: forwarded.message['@id'],
                  time: adjustedTime,
                  chat: from === actual ? to : from,
                };
              }
              console.log(
                "Received old message:",
                messageData,
                actual
              )
              if (messageData.file){
                console.log("File --", messageData, actual)
              }
    
              
    
              console.log('Received message:', messageData);
              setMessages(prev => {
                const newMessages = [...prev, messageData];
                newMessages.sort((a, b) => a.time.getTime() - b.time.getTime());
                return newMessages;
              });
    
              if (!isActualUser) {
                setChats(prev => {
                  const chatNames = [from, to];
                  const newChats = prev.filter(chat => !chatNames.includes(chat.name));
    
                  chatNames.forEach(name => {
                    if (!newChats.find(chat => chat.name === name)) {
                      newChats.push({
                        jid: name === from ? forwarded.message['@from'] : forwarded.message['@to'],
                        name,
                        status: '',
                        active: 6,
                        imageBase64: '',
                      });
                    }
                  });
                  return newChats;
                });
              }
            }
          }
        } else if (data.presence) {
          const name = data.presence['@from'].split('@')[0];
          if (name !== actual) {
            if ('@type' in data.presence ) {
              if (data.presence['@type'] === 'unavailable') {
                notify(`Usuario ${name} desconectado`, '');
                return;
              } else if (data.presence['@type'] === 'subscribe') {
                notify(`Solicitud de ${name}`, 'Solicitud de contacto');
                setSolContacts(prev => {
                  const existingContact = prev.find(contact => contact.jid === data.presence['@from']);
                  if ('status' in data.presence) {
                    const newSolContacts = [...prev, { jid: data.presence['@from'], name, status: data.presence.status }];
                    return newSolContacts;
                  }
                  return prev;
                });
                return;
              }
            }


            let preces = data.presence.show === 'dnd' ? 2 : data.presence.show === 'xa' ? 4 : data.presence.show === 'away' ? 3 : data.presence.show === 'unavailable' ? 0 : 1;
            if (preces === 1) {
              if (data.presence['@type'] === 'unavailable') {
                preces = 0;
              } else if (data.presence.idle) {
                preces = 0;
              }
            }
            const presenceData = {
              jid: data.presence['@from'],
              name,
              status: data.presence.status || '',
              active: preces,
            };
    
            setChats(prev => {
              const existingChat = prev.find(chat => chat.jid === data.presence['@from']);
              if (!existingChat) {
                // Add new chat if it does not exist
                return [...prev, { ...presenceData, imageBase64: '' }];
              } else {
                // Update existing chat while preserving the image
                const newChats = prev.map(chat =>
                  chat.jid === data.presence['@from'] ? { ...chat, ...presenceData } : chat
                );
                return newChats;
              }
            });
          } else {
            setIam({
              jid: data.presence['@from'],
              name,
              status: data.presence.status || '',
              active: data.presence.show === 'dnd' ? 2 : data.presence.show === 'xa' ? 4 : data.presence.show === 'away' ? 3 : 1,
              imageBase64: '',
            });

          }
        } else if (data.iq) {
          if (data.iq['@id'] === "search1" && 'query' in data.iq) {
            const users = data.iq.query.x.item.map((item: any) => ({
              jid: item.field[0].value,
              name: item.field[1].value,
              fullname: item.field[2].value,
              email: item.field[3].value,
            }));
            console.log('Received users:', users);
            setUserList(users);
          } else if (data.iq['@id'] === "time1") {
            const time = data.iq.time.utc;
            const serverTime = new Date(time);
            const localTime = new Date();
            TimeDiff = localTime.getTime() - serverTime.getTime();
          } else if (data.iq['@id'] === "roster_contacts"){
            if (data.iq['@type'] === "error") {
              return; 
            }
            const query = data.iq.query;
            const contacts: Contacts_[] = query.item.map((item: Contacts__) => ({
              jid: item['@jid'],
              name: item['@jid'].split('@')[0],
              type: item['@subscription'],
            }));

            setContacts(contacts);
          } else if (data.iq['@id'] === "group_rooms") {
            if (data.iq['@type'] === "error") {
              return; 
            }
            const query = data.iq.query;
            const groupChats: GroupChat[] = query.item.map((item: any) => ({
              jid: item['@jid'],
              name: item['@name'],
            }));
            setGroupChats(groupChats);
          } else if (data.iq['@id'] === "personal_vcard") {
            const iq_ = data.iq;
            if (iq_.vCard) {
              let image64: string = ''
              if (iq_.vCard.PHOTO) {
                const photo = iq_.vCard.PHOTO;
                image64 = photo.BINVAL;
              }
              // Update iam
              setIam(prev => ({ ...prev, imageBase64: image64 }));
            }
          }
        } else if (data.error) {
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
      setActualUser('');
      setLogged(0);
      clear();
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
      //  Sleep for 2 seconds
      setTimeout(() => {}, 5000);
      setLogged(2);
      requestPermission();
    }
  }, [userList]);

  const clear = () => {
    setLogged(0);
    setActualUser('');
    setMessages([]);
    setChats([]);
    setUserList([]);
    setContacts([]);
    setGroupChats([]);
    setSolContacts([]);
    setIam({
      jid: '',
      name: '',
      status: '',
      active: 0,
      imageBase64: '',
    });
  }

  const sendFile = (to, file) => {
    // Decode file to base64
    const reader = new FileReader();
      reader.onload = () => {
          // Convert the file content to base64
          const base64File = reader.result?.split(',')[1];  // Omitimos la cabecera de "data:image/jpeg;base64,"

          // Send base64 data to the server
          const data = {
              filename: file.name,
              content: base64File,  // Send the base64 content
              to: to,
              type: 'sendFile',
          };

          if (connection) {
              connection.send(JSON.stringify(data));  // Sending through a WebSocket or other connection
          }
      };
      // Read the file as a data URL (base64)
      reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (Logged === 2) {
      router.push('/chat');
    } else if (Logged !== 2) {
      router.push('/');
    }
  }, [Logged]);

  const register = (username: string, password: string, fullname: string) => {
    const ws = new WebSocket('ws://localhost:8000/ws');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ username, password, type: 'register', fullname }));
      setConnection(ws);
      setLogged(1);
    };

    ws.onmessage = (message) => {
      try { 
        const data = JSON.parse(message.data);
        console.log('Received message:', data);
        
    
        if (data.message) {
          if (data.message.body) {
            let messageData: Message;
            const from = data.message['@from'].split('@')[0];
            const isActualUser = from === actual;

            if (data.message.file) {
              const file = data.message.file.media;
              const filename = file.filename;
              const content_base64 = file.content;
              const type = filename.split('.').pop();

              // decode base64 to file
              const byteCharacters = atob(content_base64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new File([byteArray], filename, { type: type });
              // Add or update chat for message
              messageData = {
                from,
                body: data.message.body,
                to: data.message['@to'],
                type: data.message['@type'],
                id: data.message['@id'],
                time: new Date(),
                chat: from,
                file: blob,
              };

            } else {
              // Add or update chat for message
              messageData = {
                from,
                body: data.message.body,
                to: data.message['@to'],
                type: data.message['@type'],
                id: data.message['@id'],
                time: new Date(),
                chat: from,
              };
            }
    
            
            console.log('Received message:', messageData);
    
            setMessages(prev => {
              const newMessages = [...prev, messageData];
              newMessages.sort((a, b) => a.time.getTime() - b.time.getTime());
              return newMessages;
            });

            // Notify if message is from another user
            
            notify(`Mensaje de ${from}`, data.message.body);
            
    
            if (!isActualUser) {
              setChats(prev => {
                const existingChat = prev.find(chat => chat.name === from);
                if (!existingChat) {
                  // Add new chat if it does not exist
                  return [...prev, {
                    jid: data.message['@from'],
                    name: from,
                    status: '',
                    active: 6,
                    imageBase64: '',
                  }];
                }
                return prev;
              });
            }
          } else if (data.message.event) {
            if (data.message.event.items && '@node' in data.message.event.items && data.message.event.items['@node'] === 'urn:xmpp:avatar:data') {
              const from = data.message['@from'].split('@')[0];
              const isActualUser = from === actual;
              const imageBase64 = data.message.event.items.item.data['#text'];
              console.log('Received image:', imageBase64);
    
              if (!isActualUser) {
                setChats(prev => {
                  const chatIndex = prev.findIndex(chat => chat.name === from);
                  if (chatIndex === -1) {
                    // Add new chat if it does not exist
                    return [...prev, {
                      jid: data.message['@from'],
                      name: from,
                      status: '',
                      active: 6,
                      imageBase64,
                    }];
                  } else {
                    // Update existing chat with new image
                    const newChats = [...prev];
                    newChats[chatIndex] = { ...newChats[chatIndex], imageBase64 };
                    return newChats;
                  }
                });
              }
            }
          } else if (data.message.result) {
            if ('forwarded' in data.message.result) {
              const forwarded = data.message.result.forwarded;
              const serverTime = new Date(forwarded.delay['@stamp']);
              const adjustedTime = new Date(serverTime.getTime() + TimeDiff);
              const from = forwarded.message['@from'].split('@')[0];
              const to = forwarded.message['@to'].split('@')[0];
              const isActualUser = from === actual || to === actual;

              let messageData: Message;

              if (forwarded.message.file) {
                const file = forwarded.message.file.media;
                const filename = file.filename;
                const content_base64 = file.content;
                const type = filename.split('.').pop();

                // decode base64 to file
                const byteCharacters = atob(content_base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new File([byteArray], filename, { type: type });
                // Add or update chat for message
                messageData = {
                  from,
                  body: forwarded.message.body,
                  to,
                  type: forwarded.message['@type'],
                  id: forwarded.message['@id'],
                  time: adjustedTime,
                  chat: from === actual ? to : from,
                  file: blob,
                };
              } else {
                messageData = {
                  from,
                  body: forwarded.message.body,
                  to,
                  type: forwarded.message['@type'],
                  id: forwarded.message['@id'],
                  time: adjustedTime,
                  chat: from === actual ? to : from,
                };
              }
    
              
    
              console.log('Received message:', messageData);
              setMessages(prev => {
                const newMessages = [...prev, messageData];
                newMessages.sort((a, b) => a.time.getTime() - b.time.getTime());
                return newMessages;
              });
    
              if (!isActualUser) {
                setChats(prev => {
                  const chatNames = [from, to];
                  const newChats = prev.filter(chat => !chatNames.includes(chat.name));
    
                  chatNames.forEach(name => {
                    if (!newChats.find(chat => chat.name === name)) {
                      newChats.push({
                        jid: name === from ? forwarded.message['@from'] : forwarded.message['@to'],
                        name,
                        status: '',
                        active: 6,
                        imageBase64: '',
                      });
                    }
                  });
                  return newChats;
                });
              }
            }
          }
        } else if (data.presence) {
          const name = data.presence['@from'].split('@')[0];
          if (name !== actual) {
            if ('@type' in data.presence ) {
              if (data.presence['@type'] === 'unavailable') {
                notify(`Usuario ${name} desconectado`, '');
                return;
              } else if (data.presence['@type'] === 'subscribe') {
                notify(`Solicitud de ${name}`, 'Solicitud de contacto');
                setSolContacts(prev => {
                  const existingContact = prev.find(contact => contact.jid === data.presence['@from']);
                  if ('status' in data.presence) {
                    const newSolContacts = [...prev, { jid: data.presence['@from'], name, status: data.presence.status }];
                    return newSolContacts;
                  }
                  return prev;
                });
                return;
              }
            }


            let preces = data.presence.show === 'dnd' ? 2 : data.presence.show === 'xa' ? 4 : data.presence.show === 'away' ? 3 : 1;
            if (preces === 1) {
              if (data.presence['@type'] === 'unavailable') {
                preces = 0;
              } else if (data.presence.idle) {
                preces = 0;
              }
            }
            const presenceData = {
              jid: data.presence['@from'],
              name,
              status: data.presence.status || '',
              active: preces,
            };
    
            setChats(prev => {
              const existingChat = prev.find(chat => chat.jid === data.presence['@from']);
              if (!existingChat) {
                // Add new chat if it does not exist
                return [...prev, { ...presenceData, imageBase64: '' }];
              } else {
                // Update existing chat while preserving the image
                const newChats = prev.map(chat =>
                  chat.jid === data.presence['@from'] ? { ...chat, ...presenceData } : chat
                );
                return newChats;
              }
            });
          }
        } else if (data.iq) {
          if (data.iq['@id'] === "search1" && 'query' in data.iq) {
            const users = data.iq.query.x.item.map((item: any) => ({
              jid: item.field[0].value,
              name: item.field[1].value,
              fullname: item.field[2].value,
              email: item.field[3].value,
            }));
            console.log('Received users:', users);
            setUserList(users);
          } else if (data.iq['@id'] === "time1") {
            const time = data.iq.time.utc;
            const serverTime = new Date(time);
            const localTime = new Date();
            TimeDiff = localTime.getTime() - serverTime.getTime();
          } else if (data.iq['@id'] === "roster_contacts"){
            if (data.iq['@type'] === "error") {
              return; 
            }
            const query = data.iq.query;
            const contacts: Contacts_[] = query.item.map((item: Contacts__) => ({
              jid: item['@jid'],
              name: item['@jid'].split('@')[0],
              type: item['@subscription'],
            }));

            setContacts(contacts);
          } else if (data.iq['@id'] === "group_rooms") {
            if (data.iq['@type'] === "error") {
              return; 
            }
            const query = data.iq.query;
            const groupChats: GroupChat[] = query.item.map((item: any) => ({
              jid: item['@jid'],
              name: item['@name'],
            }));
            setGroupChats(groupChats);
          } else if (data.iq['@id'] === "personal_vcard") {
            const iq_ = data.iq;
            if (iq_.vCard) {
              let image64: string = ''
              if (iq_.vCard.PHOTO) {
                const photo = iq_.vCard.PHOTO;
                image64 = photo.BINVAL;
              }
              // Update iam
              setIam(prev => ({ ...prev, imageBase64: image64 }));
            }
          }
        } else if (data.error) {
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
      setActualUser('');
      setLogged(0);
      clear();
    };
  };

  const addContact = (jid: string) => {
    if (connection) {
      connection.send(JSON.stringify({ type: 'addContact', contact: jid }));
    }
  }

  const rejectContact = (jid: string) => {
    if (connection) {
      connection.send(JSON.stringify({ type: 'rejectContact', contact: jid }));
    }
  }
  
  const acceptContact = (jid: string) => {
    if (connection) {
      connection.send(JSON.stringify({ type: 'acceptContact', contact: jid }));
    }
  }

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

  const disconnect = () => {
    if (connection) {
      connection.send(JSON.stringify({ type: 'disconnect' }));
    }
  }

  const deleteAccount = () => {
    if (connection) {
      connection.send(JSON.stringify({ type: 'deleteAccount' }));
    }
  }

  useEffect(() => {
    if(connection) {
      console.log('Current connection:', connection);
    }
  }, [connection]);

  // Use effect to delete actual users from chat
  useEffect(() => {
    if (chats.length > 0) {
      const existActualUser = chats.find((chat) => chat.name === actualUser);
      if (existActualUser) {
        setChats(prev => {
          const newChats = prev.filter(chat => chat.name !== actualUser);
          return newChats;
        });
      }
    }
  }, [chats]);

  return (
    <XMPPContext.Provider value={{ connection, isLogin, initiateConnection, closeConnection, setIsLogin, register, messages, sendMessage, setMessages, chats, setChats, userList, Logged, setLogged, actualUser, contacts, groupChats, addContact, rejectContact, acceptContact, solContacts, setSolContacts, disconnect, deleteAccount, iam, sendFile }}>
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
