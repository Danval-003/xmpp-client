"use client";
import React, { use, useEffect, useState } from "react";
import { Spotlight, SpotlightCard, ChatWindow, UserListButton } from "@/app/components";
import { useXMPP } from "@/app/context/XMPPContext";
interface Contact {
  jid: string;
  name: string;
  status?: string;
  active?: Number;
  imageBase64?: string;
}

const UserButton: React.FC<{ chat: Contact, className:string, onClick:()=>void }> = ({ chat, className, onClick }) => {
  const status = () => {
    if (chat.active === 1) {
      if (chat.status === ""){
        return "Online🟢";
      }
      return chat.status+"🟢";
    } else if (chat.active === 0) {
      if (chat.status === ""){
        return "Offline🔴";
      }
      return chat.status+"🔴";
    } else {
      if (chat.name === ""){
        return "";
      }

      return "Desconocido 🟡";
    }
  }

  const [image, setImage] = useState<string>("");

  useEffect(() => {
    if (chat.imageBase64 !== '') {
      setImage(`data:image/png;base64,${chat.imageBase64}`);
    }
  }, [chat.imageBase64]);



  return (
    <button className={`w-full text-white pl-5 pr-5 pt-4 pb-4 ${className}`} onClick={onClick}>
      <div className="flex gap-4">
        {
          chat.imageBase64 !== '' ? (
            <img src={image} alt="User" className="w-12 h-12 rounded-full" />
          ) : (
            <div className="w-12 h-12 bg-slate-400 rounded-full" />
          )
        }
        <div className="">
          
          <p className="text-slate-800 text-lg w-full text-start">{chat.name}</p>
          <p className="text-slate-600 text-sm w-full text-start font-light">{
            status()
            }</p>
        </div>
      </div>
    </button>
  );
}


const Principal: React.FC = () => {
  const { messages, sendMessage, chats, setChats } = useXMPP();
  const [To, setTo] = useState<string>("");
  const [ToContact, setToContact] = useState<Contact | null>(null);
  const [Body, setBody] = useState<string>("");
  const [actualChat, setActualChat] = useState<Contact | null >(null);
  // Message interface
  // Body -> Message body
  // From -> Emisor
  // To -> Receptor
  // Type -> Type of message
  // Id -> Message id

  const [usersNotTo, setUsersNotTo] = useState<Contact[]>([]);


  useEffect(() => {
    const chatsWithoutTo = chats.filter((chat) => chat.name !== To);
    // Delete duplicate chats find by name
    const chatsWithoutToSet = new Set(chatsWithoutTo.map((chat) => chat.name));
    // Set the new chats without the current chat
    const chatsWithoutToUnique = Array.from(chatsWithoutToSet).map((name) => chats.find((chat) => chat.name === name) || { jid: "", name: "" });
    setUsersNotTo(chatsWithoutToUnique);
    console.log('Chats without to:', chatsWithoutToUnique);
  }, [chats, To]);

  useEffect(() => {
    if(To === "" && chats.length > 0) {
      setTo(chats[0].name || "");
      setToContact(chats[0]);
    }
  }, [chats]);

  useEffect(() => {
    const chat = chats.find((chat) => chat.name === To);
    setToContact(chat || null);
  }, [To]);

  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

  const addChat = (contact:Contact) => {
    // Verify if not exist the chat
    if (!chats.find((chat) => chat.jid === contact.jid)) {
      console.log('Adding chat:', contact);
      setChats([...chats, contact]);
    }
    setTo(contact.name);
  };

  const chandleChangeChat = (chat: Contact) => {
    setTo(chat.name);
    setToContact(chat);
  };


  return (
    <div className="w-full h-full bg-chat-gradient font-aggro flex-col flex items-start justify-start">
      <div className="h-full bg-[#A7C1D9] w-full flex">
        <div className="w-3/12 h-full">
          <div className="h-[90.6%] overflow-y-auto">
            {
              ToContact && (
                <UserButton onClick={()=>{chandleChangeChat(ToContact)}} className="bg-slate-300" chat={ToContact} />
              )
            }
            
            
            {
              usersNotTo.map((chat, index) => (
                <UserButton onClick={()=>{chandleChangeChat(chat)}} className="" key={index} chat={chat} />
              ))
            }

          </div>
        {/* Part to add new other chat */}
          <div className="w-full bg-[#23338C]">
            <UserListButton onClick={addChat} />
          </div> 
        </div>
        <ChatWindow To={To} className="h-full w-9/12 bg-slate-100" />
      </div>
    </div>
  );
};

export default Principal;
