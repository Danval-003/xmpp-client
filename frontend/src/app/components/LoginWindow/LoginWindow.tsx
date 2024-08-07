'use client';
import React, { useEffect, useState } from 'react';
import { Spotlight, SpotlightCard } from '../spotlight-card';
import LoginSection from '../LoginSection';
import SinginSection from '../SinginSection';
import { useXMPP } from '../../context/XMPPContext';
import { useRouter } from 'next/navigation';

const LoginWindow: React.FC = () => {
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const { Logged, setLogged } = useXMPP();
    const router = useRouter();

    useEffect(() => {
        if (Logged === 3) {
            router.push('/chat');
        }
    }, [Logged]);

    return (
        <Spotlight className='w-2/3  h-4/6 z-10 md:w-3/6 lg:w-2/3 xl:w-1/3 flex flex-row justify-center text-black font-aggro rounded-lg'>
            <SpotlightCard className='w-full rounded-3xl h-full'>
                <div className='w-full h-full flex justify-center'>
                    <div className='relative w-full h-full overflow-hidden'>
                        {
                            Logged === 0 ? (
                                <div
                                    className={`absolute top-0 left-0 w-full h-full flex transition-transform duration-700 ${
                                        isLogin ? 'transform translate-x-0' : 'transform -translate-x-full'
                                    }`}
                                >
                                    <div className='w-full flex-shrink-0'>
                                        <LoginSection setIsLogin={setIsLogin} />
                                    </div>
                                    <div className='w-full flex-shrink-0'>
                                        <SinginSection setIsLogin={setIsLogin} />
                                    </div>
                                </div>
                            ): (
                                Logged === 4 ? (
                                    <div className='w-full h-full flex flex-col items-center justify-center'>
                                        <h1 className='text-3xl p-5 text-center text-[#f8f8f8] font-bold'>Error al autenticar el usuario</h1>
                                        <button
                                            onClick={() => setLogged(0)}
                                            className='bg-[#f8f8f800] border text-[#f8f8f8] hover:bg-[#f8f8f8] hover:text-[#333] px-4 py-2 rounded-lg'
                                        >
                                            Volver a intentar
                                        </button>
                                    </div> 
                                ) : (
                                    <div className='w-full h-full flex items-center justify-center'>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 100 100"
                                            preserveAspectRatio="xMidYMid"
                                            width="200"
                                            height="200"
                                            style={{ shapeRendering: 'auto', display: 'block', background: 'transparent' }}
                                        >
                                            <g>
                                            <circle
                                                strokeDasharray="164.93361431346415 56.97787143782138"
                                                r="35"
                                                strokeWidth="10"
                                                stroke="#f8f8f8"
                                                fill="none"
                                                cy="50"
                                                cx="50"
                                            >
                                                <animateTransform
                                                keyTimes="0;1"
                                                values="0 50 50;360 50 50"
                                                dur="1s"
                                                repeatCount="indefinite"
                                                type="rotate"
                                                attributeName="transform"
                                                />
                                            </circle>
                                            </g>
                                        </svg>
                                    </div>
                                )
                            )
                        }
                    </div>
                </div>
            </SpotlightCard>
        </Spotlight>
    );
}

export default LoginWindow;
