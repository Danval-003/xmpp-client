"use client";
import React, { use, useEffect, useState } from "react";
import { Spotlight, SpotlightCard } from "@/app/components";
import { useXMPP } from "@/app/context/XMPPContext";

const Principal: React.FC = () => {
  const { messages, sendMessage } = useXMPP();
  const [To, setTo] = useState<string>("val21240");
  const [Body, setBody] = useState<string>("");
  // Message interface
  // Body -> Message body
  // From -> Emisor
  // To -> Receptor
  // Type -> Type of message
  // Id -> Message id

  useEffect(() => {
    console.log('Current messages:', messages);
  }, [messages]);

  return (
    <div className="w-full h-full bg-chat-gradient font-aggro flex-col flex items-start justify-start">
      <Spotlight className="w-full">
        <SpotlightCard className="w-full rounded-b-3xl">
          <h1 className="text-4xl w-fit text-white p-5 uppercase">Chat Xmpp</h1>
        </SpotlightCard>
      </Spotlight>
      <div className="w-full h-4/6 bg-slate-200 overflow-y-auto">
        {messages.map((message, index) => {
          // Show only message body and emisor.
          return (
            <div key={index} className="w-full flex flex-col items-start justify-start p-5">
              <h1 className="text-white text-lg font-bold">{message.from}</h1>
              <p className="text-white">{message.body}</p>
            </div>
          );
        })}
      </div>
      <div className="w-full h-1/6 bg-slate-300 flex flex-col items-start justify-start">
        <input
          type="text"
          className="w-full h-1/3 bg-slate-300 text-white p-5"
          placeholder="To"
          value={To}
          onChange={(e) => setTo(e.target.value)}
        />
        <input
          type="text"
          className="w-full h-1/3 bg-slate-300 text-white p-5"
          placeholder="Message"
          value={Body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          className="w-full h-1/3 bg-slate-400 text-white p-5"
          onClick={() => sendMessage(To, Body)}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Principal;
