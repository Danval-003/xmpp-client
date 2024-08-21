"use client";
import React, { useState, useEffect, useRef } from "react";
import { useXMPP } from "@/app/context/XMPPContext";
import ModalConfirm from "../ModalConfirm";

interface ChatWindowProps {
  To: string;
  className: string;
}

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

interface Contact {
  jid: string;
  name: string;
  status?: string;
  active?: Number;
  imageBase64?: string;
}

const profileShow = (contact: Contact) => {
  const status = () => {
    switch (contact.active) {
      case 1:
        return contact.status ? `${contact.status}🟢` : "Online🟢";
      case 0:
        return contact.status ? `${contact.status}🔴` : "Desconectado 🟣";
      case 2:
        return contact.status ? `${contact.status}⛔` : "Ocupado ⛔";
      case 3:
        return contact.status ? `${contact.status}🟠` : "Ausente 🟠";
      case 4:
        return contact.status ? `${contact.status}🟠` : "No disponible 🔴";
      default:
        return contact.name ? "Desconocido 🟡" : "";
    }
  };
  return (
    <div className="flex items-center pr-3">
      <img
        src={
          contact.imageBase64 !== ""
            ? `data:image/png;base64,${contact.imageBase64}`
            : "https://www.gravatar.com/avatar/" + contact.jid + "?d=identicon"
        }
        alt="profile"
        className="w-10 h-10 rounded-full"
      />
      <div className="ml-3">
        <h1 className="text-lg font-semibold">{contact.name}</h1>
        <p className="text-sm text-[#ffffffd6]">{status()}</p>
      </div>
    </div>
  );
};

const ChatWindow: React.FC<ChatWindowProps> = ({ To, className }) => {
  const [Body, setBody] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [messagesTo, setMessagesTo] = useState<Message[]>([]);
  const [error, setError] = useState<string>("");
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [messagesLoaded, setMessagesLoaded] = useState<number>(20);
  const [userScrolled, setUserScrolled] = useState<boolean>(true);

  const { sendMessage, sendFile, messages, setMessages, actualUser, disconnect, deleteAccount, iam } = useXMPP();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  useEffect(() => {
    const filteredMessages = messages.filter((message) => message.chat === To);
    setMessagesTo(filteredMessages.slice(-messagesLoaded));
  }, [messages, To, messagesLoaded]);

  useEffect(() => {
    if (messagesEndRef.current && isScrolledToBottom && userScrolled) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesTo, isScrolledToBottom, userScrolled]);

  const handleSendMessage = () => {
    if (!To) {
      setError("Recipient cannot be empty.");
      return;
    }

    if (file) {
      sendFile(To, file);
      setMessages([
        ...messages,
        { from: actualUser, body: "", to: To, type: "file", id: "2", time: new Date(), chat: To, file },
      ]);
      setFile(null);
    } else {
      sendMessage(To, Body);
      setMessages([
        ...messages,
        { from: actualUser, body: Body, to: To, type: "chat", id: "1", time: new Date(), chat: To },
      ]);
    }
    setBody("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 1);
    if (scrollTop === 0) {
      prevScrollHeightRef.current = scrollHeight;
      setMessagesLoaded((prev) => prev + 20);
    }
    if (scrollTop + clientHeight < scrollHeight - 1) {
      setUserScrolled(false);
    } else {
      setUserScrolled(true);
    }
  };

  useEffect(() => {
    console.log("messagesTo", messagesTo);
    console.log("Messages", messages);
    if (chatWindowRef.current && prevScrollHeightRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight - prevScrollHeightRef.current;
    }
  }, [messagesTo]);

  const validImageExtensions = ["png", "jpg", "jpeg", "gif", "bmp", "webp"];

  return (
    <div className={`${className} absolute right-0 overflow-hidden`}>
      <div className="h-full w-full z-10 absolute top-0 left-0">
        <div className="w-full h-[10.4%] bg-[#005148] shadow-lg flex items-center justify-end">
          {iam && profileShow(iam)}
          <button
            className=" bg-[#d72929] text-white p-6"
            onClick={() => {
              setError("Account deleted!");
            }}
          >
            Delete Account
          </button>

          <button
            className=" bg-[#005148] text-white p-5"
            onClick={() => {
              disconnect();
              setMessagesTo([]);
              setBody("");
              setError("");
            }}
          >
            Close
          </button>
        </div>
        <div
          className="pt-5 h-[80.3%] bg-[#01405d] overflow-y-auto w-full block"
          onScroll={handleScroll}
          ref={chatWindowRef}
        >
          {messagesTo.map((message, index) => (
            <div
              key={index}
              className={`w-full mb-5 h-fit text-gray-800 flex flex-col ${
                message.from !== actualUser ? "items-start justify-start" : "items-end justify-end"
              }`}
            >
              {message.file ? (
                <a
                  href={URL.createObjectURL(message.file)}
                  download={message.file.name}
                  className={`p-5 pl-6 max-w-[50%] min-w-[18%] shadow-xl ${
                    message.from === actualUser
                      ? "rounded-l-lg bg-[#019587] pl-4 pr-4 text-[#1b1b1b] underline"
                      : " bg-[#A6BC09] text-[#1b1b1b] rounded-r-lg pr-4 pl-4"
                  }`}
                >
                  <span className="font-semibold text-xs w-full">{message.from}: </span>
                  <br />
                  <span className="pt-5 text-base break-words">{message.file.name}</span>
                  {validImageExtensions.includes(message.file.type) ? (
                    <img src={URL.createObjectURL(message.file)} alt="image" className="w-full h-full mt-2" />
                  ) : null}
                </a>
              ) : (
                <p
                  className={`p-5 pl-6 max-w-[50%] min-w-[18%] shadow-xl ${
                    message.from === actualUser
                      ? "rounded-l-lg bg-[#019587] pl-4 pr-4 text-[#1b1b1b]"
                      : "bg-[#A6BC09] text-[#1b1b1b] rounded-r-lg pr-4 pl-4"
                  }`}
                >
                  <span className="font-semibold text-xs w-full">{message.from}: </span>
                  <br />
                  <span className="pt-5 text-base break-words">{message.body}</span>
                </p>
              )}
              <p
                className={`text-[#e3e3e3] drop-shadow-lg pt-1 pb-2 text-xs ${
                  message.from === actualUser ? "pr-2" : "pl-2"
                }`}
              >
                {message.time.toLocaleDateString()} {message.time.toLocaleTimeString()}
              </p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="w-full h-[9.2%] bg-[#005148] p-4 flex justify-between">
          <input
            className="w-[75%] rounded-md shadow-xl bg-[#CCEA8D] text-[#222222] placeholder:text-[#2222228b] p-3 text-base active:outline-none focus:outline-none"
            placeholder="Escribe un mensaje aquí"
            value={Body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!!file}
          />
          <input type="file" className="hidden" id="file-upload" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="bg-[#019587] pr-3 pl-3 flex content-center items-center rounded-lg shadow-lg text-white cursor-pointer">
            Adjuntar Archivo
          </label>
          <button
            className="pr-3 pl-3 items-center flex bg-[#A6BC09] text-white rounded-lg shadow-lg"
            onClick={handleSendMessage}
            disabled={Body.trim() === "" && !file}
          >
            Enviar
          </button>
        </div>
        {error && (
          <ModalConfirm onClose={() => setError("")}>
            <h1 className="font-semibold text-lg mb-4">{error}</h1>
          </ModalConfirm>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
