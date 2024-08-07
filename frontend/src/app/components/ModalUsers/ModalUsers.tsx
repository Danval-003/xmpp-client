'use client';
import React, { useState } from 'react';
import { useXMPP } from '@/app/context/XMPPContext';

interface Contact {
    jid: string;
    name: string;
    status?: string;
    active?: Number;
    imageBase64?: string;
  }

const Modal: React.FC<{ isOpen: boolean; onClose: () => void, UserAction: (contact:Contact) => void }> = ({ isOpen, onClose, UserAction }) => {
    const { userList } = useXMPP();
    if (!isOpen) return null;

    const setUser = (contact:Contact) => {
        UserAction(contact);
        onClose();
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded shadow-lg w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto relative z-40">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-500">
                    ×
                </button>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">JID</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Fullname</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Email</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {userList.map((user, index) => (
                            <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                    <button className="text-blue-500 hover:underline"
                                    onClick={() =>{
                                        const userS = {
                                            jid: user.jid,
                                            name: user.name,
                                            status: '',
                                            active: 2,
                                            imageBase64: ''
                                        }
                                        setUser(userS);
                                    }}
                                    
                                    
                                    >{user.jid}</button>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{user.fullname || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{user.email || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        </div>
    );
};

// Componente principal
const UserListButton: React.FC<{onClick: (contact:Contact) => void}> = ({onClick}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const { userList } = useXMPP();
    const count = userList.length;

    return (
        <div>
            <button onClick={openModal} className="w-full h-1/12 bg-[#23338C] text-white p-5">
                Mostrar Usuarios {
                    // Mostrar la cantidad de usuarios en un circulo
                    count > 0 && (
                        <span className="bg-[#9AA3D9] text-white rounded-full px-2 py-1 ml-2">
                            {count}
                        </span>
                    )
                }
            </button>
            <Modal isOpen={isModalOpen} onClose={closeModal} UserAction={onClick} />
        </div>
    );
};

export default UserListButton;
