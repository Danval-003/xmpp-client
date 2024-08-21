'use client';
import React, { useState } from 'react';
import { useXMPP } from '@/app/context/XMPPContext';

interface Users {
    jid: string;
    name: string;
    fullname?: string;
    email?: string;
}

interface Contact {
    jid: string;
    name: string;
    status?: string;
    active?: number;
    imageBase64?: string;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; UserAction: (contact: Contact) => void }> = ({ isOpen, onClose, UserAction }) => {
    const { userList, addContact } = useXMPP(); // `userList` es de tipo `Users[]`
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda
    const [selectedUser, setSelectedUser] = useState<Users | null>(null);
    const usersPerPage = 10;

    if (!isOpen) return null;

    const setUser = (contact: Contact) => {
        UserAction(contact);
        onClose();
    };

    // Filtrar usuarios por `jid` en base al término de búsqueda
    const filteredUsers = userList.filter((user) => user.jid.toLowerCase().includes(searchTerm.toLowerCase()));
    const paginatedUsers = filteredUsers.slice(0, currentPage * usersPerPage);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto relative z-40 border border-[#A6BC09]">
                <button onClick={onClose} className="absolute top-2 right-2 text-[#005148] hover:text-[#01415B]">
                    ×
                </button>

                {/* Campo de búsqueda */}
                

                {!selectedUser ? (
                    <>
                    <input
                    type="text"
                    className="w-full p-3 mb-4 border rounded-md"
                    placeholder="Buscar por JID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div>
                        <table className="min-w-full divide-y divide-[#005148]">
                            <thead className="bg-[#CCEA8D] text-[#01415B]">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Fullname</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#005148]">
                                {paginatedUsers.map((user, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-[#005148]">{user.name}</td>
                                        <td className="px-4 py-2 text-sm text-[#005148]">{user.fullname || 'N/A'}</td>
                                        <td className="px-4 py-2 text-sm text-[#005148]">
                                            <button
                                                className="text-[#019587] hover:underline"
                                                onClick={() => setSelectedUser({
                                                    jid: user.jid,
                                                    name: user.name,
                                                    fullname: user.fullname,
                                                    email: user.email
                                                })}
                                            >
                                                Ver más
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {paginatedUsers.length < filteredUsers.length && (
                            <div className="text-center mt-4">
                                <button
                                    className="px-4 py-2 bg-[#019587] text-white rounded hover:bg-[#005148]"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Ver más
                                </button>
                            </div>
                        )}
                    </div>
                    </>
                ) : (
                    <div>
                        <h2 className="text-xl text-[#01415B] font-bold mb-4">{selectedUser.name}</h2>
                        <p className='text-[#5c5c5c]'><strong>JID:</strong> {selectedUser.jid}</p>
                        <p className='text-[#5c5c5c]'><strong>Fullname:</strong> {selectedUser.fullname || 'N/A'}</p>
                        <p className='text-[#5c5c5c]'><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>

                        <div className="mt-4 flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 bg-[#A6BC09] text-white rounded hover:bg-[#01415B]"
                                onClick={() => setSelectedUser(null)}
                            >
                                Volver
                            </button>
                            <button
                                className="px-4 py-2 bg-[#CCEA8D] text-[#01415B] rounded hover:bg-[#A6BC09]"
                                onClick={() => {
                                    if (selectedUser) {
                                        addContact(selectedUser.jid);
                                        setSelectedUser(null);
                                    }
                                }}
                            >
                                Agregar Usuario
                            </button>
                            <button
                                className="px-4 py-2 bg-[#019587] text-white rounded hover:bg-[#005148]"
                                onClick={() => {
                                    if (selectedUser) {
                                        const contact: Contact = {
                                            jid: selectedUser.jid,
                                            name: selectedUser.name,
                                            status: '',
                                            active: 6,
                                            imageBase64: ''
                                        };
                                        setUser(contact);
                                    }
                                }}
                            >
                                Iniciar Chat
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        </div>
    );
};

// Componente principal
const UserListButton: React.FC<{onClick: (contact: Contact) => void}> = ({onClick}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const { userList } = useXMPP();
    const count = userList.length;

    return (
        <div className='flex items-center justify-center content-center h-full'>
            <button onClick={openModal} className="w-full h-full text-sm leading-4 bg-[#005148] text-white pl-5 pr-5 rounded">
                Mostrar Usuarios 
            </button>
            <div className='pr-6'>
            {
                    // Mostrar la cantidad de usuarios en un círculo
                    count > 0 && (
                        <span className="bg-[#CCEA8D] text-[#005148] text-xs rounded-full px-2 py-1 ml-2">
                            {count}
                        </span>
                    )
            }
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} UserAction={onClick} />
        </div>
    );
};

export default UserListButton;
