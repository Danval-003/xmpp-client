"use client";
import React, { useEffect, useState } from 'react';
import { useXMPP } from '../../context/XMPPContext';
import { useRouter } from 'next/navigation';

interface RegisterSectionProps {
    setIsLogin: (value: boolean) => void;
}

const RegisterSection: React.FC<RegisterSectionProps> = ({ setIsLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const router = useRouter();
  const { register, isLogin, setIsLogin: setIsLogin2 } = useXMPP();

  const handleRegister = () => {
    console.log("Register");
    register(username, password, fullname);
    setIsLogin2(true);
    router.push("/chat");
  };


  return (
    <div className="w-full h-full p-10">
      <h1 className="text-3xl uppercase font-bold text-[#f8f8f8] text-center">Register</h1>
      <div className="mt-5" onSubmit={handleRegister}>
        <div className="flex flex-col">
          <label htmlFor="username" className="text-md font-bold text-[#f8f8f8]">Username</label>
          <input
            type="text"
            id="username"
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full h-10 px-3 text-md placeholder:text-[#ffffffe9] bg-[#ececec29] text-[#f8f8f8] border border-[#f8f8f8] rounded-lg focus:outline-none focus:border-[#f8f8f8]"
          />
        </div>
        <div className="flex flex-col mt-3">
          <label htmlFor="password" className="text-md font-bold text-[#f8f8f8]">Password</label>
          <input
            type="password"
            id="password"
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-10 px-3 text-md placeholder:text-[#ffffffe9] bg-[#ececec29] text-[#f8f8f8] border border-[#f8f8f8] rounded-lg focus:outline-none focus:border-[#f8f8f8]"
          />
        </div>
        <div className="flex flex-col mt-3">
          <label htmlFor="fullname" className="text-md font-bold text-[#f8f8f8]">Fullname</label>
          <input
            type="text"
            id="fullname"
            placeholder='Fullname'
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
            className="w-full h-10 px-3 text-md bg-[#ececec29] placeholder:text-[#ffffffe9] text-[#f8f8f8] border border-[#f8f8f8] rounded-lg focus:outline-none focus:border-[#f8f8f8]"
          />
        </div>
        <button type="button" className="w-full h-10 mt-5 bg-[#f8f8f8] text-[#333] font-bold uppercase rounded-lg hover:bg-[#e5e5e5] focus:outline-none"
          onClick={handleRegister}
        >Register</button>
      </div>
      <button className="text-[#f8f8f8] hover:text-[#cbcbcb] text-md font-bold uppercase mt-5" onClick={() => {
        setIsLogin(true);
      }}>Already have an account? Login</button>
    </div>
  );
};

export default RegisterSection;
