"use client";
import React, { use, useEffect, useState } from "react";
import { Spotlight, SpotlightCard, ChatWindow, UserListButton, ContactListButton } from "@/app/components";
import { useXMPP } from "@/app/context/XMPPContext";

interface Contact {
  jid: string;
  name: string;
  status?: string;
  active?: number;
  imageBase64?: string;
  group?: string;
}

const UserButton: React.FC<{ chat: Contact, className: string, onClick: () => void }> = ({ chat, className, onClick }) => {
  const status = () => {
    switch (chat.active) {
      case 1:
        return chat.status ? `${chat.status}🟢` : "Online🟢";
      case 0:
        return chat.status ? `${chat.status}🔴` : "Desconectado 🟣";
      case 2:
        return chat.status ? `${chat.status}⛔` : "Ocupado ⛔";
      case 3:
        return chat.status ? `${chat.status}🟠` : "Ausente 🟠";
      case 4:
        return chat.status ? `${chat.status}🟠` : "No disponible 🔴";
      default:
        return chat.name ? "Desconocido 🟡" : "";
    }
  };

  const isGroup = chat.jid.includes("@conference");

  return (
    <button className={`w-full text-white pl-5 pr-5 pt-4 pb-4 ${className}`} onClick={onClick}>
      <div className="flex gap-4">
        {chat.imageBase64 ? (
          <img src={`data:image/png;base64,${chat.imageBase64}`} alt="User" className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 bg-[#333333] rounded-full" />
        )}
        <div className="flex flex-col content-center items-center justify-center">
          {
            isGroup ? (
              <>
              <p className="text-[#1b1b1b] text-sm w-full text-start">{chat.name}</p>
              <p className="text-[#333333] text-xs w-full text-start font-light">{"Group chat"}</p>
              </>
            ) : (
              <>
              <p className="text-[#1b1b1b] text-sm w-full text-start">{chat.name}</p>
              <p className="text-[#333333] text-xs w-full text-start font-light">{status()}</p>
              </>
            )
          }
        </div>
      </div>
    </button>
  );
};

const Principal: React.FC = () => {
  const { messages, sendMessage, chats, setChats } = useXMPP();
  const [To, setTo] = useState<string>("");
  const [ToContact, setToContact] = useState<Contact | null>(null);
  const [usersNotTo, setUsersNotTo] = useState<Contact[]>([]);
  const [TypeChat, setTypeChat] = useState<string>("");

  useEffect(() => {
    // Filter out chats with no messages
    const chatsWithMessages = chats.filter(chat => 
      messages.some(message => message.chat === chat.name)
    );

    const chatsWithoutTo = chatsWithMessages.filter((chat) => chat.name !== To);
    const uniqueChats = Array.from(new Set(chatsWithoutTo.map((chat) => chat.name)))
      .map((name) => chatsWithMessages.find((chat) => chat.name === name) || { jid: "", name: "" });
    setUsersNotTo(uniqueChats);
    console.log('Chats with messages and without to:', uniqueChats);
  }, [To, chats, messages]);

  useEffect(() => {
    console.log('Chats:', chats);
  }, [chats]);

  useEffect(() => {
    if (To === "" && chats.length > 0) {
      const chatsWithMessages = chats.filter(chat => 
        messages.some(message => message.chat === chat.name)
      );
      if (chatsWithMessages.length > 0) {
        setTo(chatsWithMessages[0].name);
        setToContact(chatsWithMessages[0]);
      } else {
        setTo("");
        setToContact(null);
      }
    }
  }, [chats]);

  useEffect(() => {
    const ch = chats.find((chat) => chat.name === To) || null;
    setToContact(ch);
    if (ch?.jid.includes("@conference")) {
      setTypeChat("groupchat");
    } else {
      setTypeChat("chat");
    }
  }, [To, chats]);

  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

  const addChat = (contact: Contact) => {
    if (!chats.some((chat) => chat.jid === contact.jid)) {
      console.log('Adding chat:', contact);
      setChats([...chats, contact]);
    }
    setTo(contact.name);
    if (contact.jid.includes("@conference")){
      setTypeChat("groupchat");
    } else {
      setTypeChat("chat");
    }
  };

  const chandleChangeChat = (chat: Contact) => {
    setTo(chat.name);
    setToContact(chat);
    if (chat.jid.includes("@conference")){
      setTypeChat("groupchat");
    } else {
      setTypeChat("chat");
    }
  };

  useEffect(() => {
    const ch = chats.find((chat) => chat.name === To) || null;
    console.log('Ch:', ch);
    console.log('To:', To);
    console.log("TypeChat:", TypeChat);
  }, [To]);

  return (
    <div className="w-full h-[100vh] bg-chat-gradient font-aggro flex-col flex items-start justify-start overflow-hidden">
      <div className="h-[100vh] bg-[#CCEA8D] w-full flex overflow-hidden">
        <div className="w-3/12 h-full">
          <div className="w-full h-[10.4%] bg-[#005148]">
            <ContactListButton onClick={addChat} />
          </div>
          <div className="h-[80.2%] overflow-y-auto">
            {ToContact && (
              <UserButton onClick={() => chandleChangeChat(ToContact)} className="bg-[#019587] shadow-lg" chat={ToContact} />
            )}
            {usersNotTo.map((chat, index) => (
              <UserButton onClick={() => chandleChangeChat(chat)} className="" key={index} chat={chat} />
            ))}
          </div>
          <div className="w-full h-[10.4%] bg-[#005148]">
            <UserListButton onClick={addChat} />
          </div>
        </div>
        <ChatWindow To={To} className="h-full w-9/12 bg-slate-100" TypeChat={TypeChat} addContact={addChat} />
      </div>
    </div>
  );
};

export default Principal;
