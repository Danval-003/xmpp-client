"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useXMPP } from '../../context/XMPPContext';

interface LoginSectionProps {
  setIsLogin: (value: boolean) => void;
}


const LoginSection:React.FC<LoginSectionProps> = ({setIsLogin}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { initiateConnection } = useXMPP();

  const handleLogin = () => {
    initiateConnection(username, password, "login");
  };

  return (
    <div className="w-full h-full p-10">
      <h1 className="text-3xl uppercase font-bold text-[#f8f8f8] text-center">Login</h1>
      <div className="mt-10" onSubmit={handleLogin}>
        <div className="flex flex-col">
          <label htmlFor="username" className="text-md font-bold text-[#f8f8f8]">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            placeholder='Username'
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-10 px-3 text-md bg-[#ececec29] text-[#f8f8f8] border border-[#f8f8f8] rounded-lg focus:outline-none focus:border-[#f8f8f8]"
          />
        </div>
        <div className="flex flex-col mt-5">
          <label htmlFor="password" className="text-md font-bold text-[#f8f8f8]">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            placeholder='Password'
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 text-md bg-[#ececec29] text-[#f8f8f8] border border-[#f8f8f8] rounded-lg focus:outline-none focus:border-[#f8f8f8]"
          />
        </div>
        <button
        type="button" className="w-full h-10 mt-5 bg-[#f8f8f8] text-[#333] font-bold uppercase rounded-lg hover:bg-[#e5e5e53b] hover:text-[#f8f8f8]  focus:outline-none"
        onClick={() => handleLogin()}
        >Login</button>
      </div>
      <button className="text-[#f8f8f8] hover:text-[#f8f8f8] hover:textShadow-2xl text-md font-bold uppercase mt-5" onClick={() => {
        setIsLogin(false);
      }}>Not have an account? Sign up</button>
    </div>
  );
};

export default LoginSection;
