"use client";
import React, { useState, useEffect, useRef } from "react";
import { useXMPP } from "@/app/context/XMPPContext";

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
}

const ChatWindow: React.FC<ChatWindowProps> = ({ To, className }) => {
    const [Body, setBody] = useState<string>("");
    const [messagesTo, setMessagesTo] = useState<Message[]>([]);
    const [error, setError] = useState<string>("");
    const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

    const { sendMessage, messages, setMessages } = useXMPP();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessagesTo(messages.filter((message) => message.to === To || message.from === To));
    }, [messages, To]);

    useEffect(() => {
        if (messagesEndRef.current && isScrolledToBottom) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messagesTo, isScrolledToBottom]);

    const handleSendMessage = () => {
        if (!To) {
            setError("Recipient cannot be empty.");
            return;
        }
        sendMessage(To, Body);
        setMessages([...messages, { from: "Me", body: Body, to: To, type: "chat", id: "1" }]);
        setBody("");
        setError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evita que el formulario se envíe si está en uno
            handleSendMessage();
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 1);
    };

    return (
        <div className={className}>
            <div 
                className='pt-2 h-[90.6%] bg-slate-900 overflow-y-auto w-full block'
                onScroll={handleScroll}
            >
                {
                    messagesTo.map((message, index) => (
                        <div key={index} className={`w-full mb-5 h-fit text-gray-800 flex flex-col ${message.id !== '1' ? 'items-start justify-start' : 'items-end justify-end'}`}>
                            <p className={`bg-slate-300 p-5 ${message.id === '1' ? 'rounded-l-lg' : 'rounded-r-lg'}`}>{message.from}: {message.body}</p>
                        </div>
                    ))
                }
                <div ref={messagesEndRef} /> {/* Esto es el marcador para el final de los mensajes */}
            </div>
            <div className="w-full bg-[#9AA3D9] flex items-start justify-start">
                <input
                    type="text"
                    className="w-4/5 focus:outline-none placeholder:text-white focus:border-none bg-[#9AA3D9] text-slate-700 p-5"
                    placeholder="Message"
                    value={Body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="w-1/5 bg-[#7988D9] rounded-tl-3xl text-white p-5"
                    onClick={handleSendMessage}
                >
                    Send
                </button>
                {error && <p className="text-red-500">{error}</p>}
            </div>
        </div>
    );
};

export default ChatWindow;
