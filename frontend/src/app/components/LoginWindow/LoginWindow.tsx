'use client';
import React, { useState } from 'react';
import { Spotlight, SpotlightCard } from '../spotlight-card';
import LoginSection from '../LoginSection';
import SinginSection from '../SinginSection';

const LoginWindow: React.FC = () => {
    const [isLogin, setIsLogin] = useState<boolean>(true);

    return (
        <Spotlight className='w-2/3  h-5/6 z-10 lg:w-1/2 xl:w-1/3 flex flex-row justify-center text-black font-aggro rounded-lg'>
            <SpotlightCard className='w-full rounded-3xl h-full'>
                <div className='w-full h-full flex justify-center'>
                    <div className='relative w-full h-full overflow-hidden'>
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
                    </div>
                </div>
            </SpotlightCard>
        </Spotlight>
    );
}

export default LoginWindow;
