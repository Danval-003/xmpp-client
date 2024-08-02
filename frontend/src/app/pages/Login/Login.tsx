import React from 'react';
import { LoginWindow, Particles } from '@/app/components';

const Login: React.FC = () => {
    return (
        <div className='w-full h-full bg-custom-gradient flex items-center justify-center'>
            <LoginWindow />
            <Particles />
        </div>
    );
}

export default Login;
