'use client';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

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
});

interface XMPPProviderProps {
  children: ReactNode;
}

export const XMPPProvider: React.FC<XMPPProviderProps> = ({ children }) => {
  const [connection, setConnection] = useState<WebSocket | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

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
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        console.log('Received message:', data);
        setMessages(prev => [...prev, data]);
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
    };
  };

  const register = (username: string, password: string) => {
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
      ws.send(JSON.stringify({ username, password, type: 'register' }));
      setConnection(ws);
    };

    ws.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        console.log('Received message:', data);
        setMessages(prev => [...prev, data]);
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

  return (
    <XMPPContext.Provider value={{ connection, isLogin, initiateConnection, closeConnection, setIsLogin, register, messages, sendMessage }}>
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
