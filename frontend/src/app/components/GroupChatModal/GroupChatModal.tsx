'use client';
import React, { useState } from 'react';
import { useXMPP } from '@/app/context/XMPPContext';

interface Contact {
    jid: string;
    name: string;
    status?: string;
    active?: number;
    imageBase64?: string;
}

interface ConfigRoom {
    name: string;
    type: string;
    config: {
        nameroom: string;
        description: string;
        maxusers: number;
        publicroom: 0|1;
        allowinvites: 0|1;
        enablelogging: 0|1;
    }
}

const GroupChatModal: React.FC<{ isOpen: boolean; onClose: () => void; UserAction: (contact: Contact) => void }> = ({ isOpen, onClose, UserAction }) => {
    const { groupChats, createChatRoom, sendPrecense, updateChatsGroup } = useXMPP();
    const [searchTerm, setSearchTerm] = useState("");
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const [roomName, setRoomName] = useState('');
    const [description, setDescription] = useState('');
    const [maxUsers, setMaxUsers] = useState(10);
    const [publicRoom, setPublicRoom] = useState<0 | 1>(1);
    const [allowInvites, setAllowInvites] = useState<0 | 1>(1);

    if (!isOpen) return null;

    const setGroup = (contact: Contact) => {
        UserAction(contact);
        onClose();
    };

    const handleNextSlide = () => setCurrentSlide(1);
    const handlePreviousSlide = () => setCurrentSlide(0);

    const handleCreateRoom = (e: React.FormEvent) => {
        e.preventDefault();

        const newRoomConfig: ConfigRoom = {
            name: roomName.replace(/\s/g, '').toLowerCase(),
            type: 'groupchat',
            config: {
                nameroom: roomName,
                description: description,
                maxusers: maxUsers,
                publicroom: publicRoom,
                allowinvites: allowInvites,
                enablelogging: 1
            }
        };

        createChatRoom(newRoomConfig);
        onClose(); // Cierra el modal después de crear el grupo
    };

    const filteredGroups = groupChats.filter((group) => group.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white overflow-x-hidden rounded-lg shadow-lg w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto relative z-40 border border-[#A6BC09]">
                <button onClick={onClose} className="absolute top-2 z-10 right-2 text-[#005148] hover:text-[#01415B]">
                    ×
                </button>

                <div
                    className="flex transition-transform w-full duration-500"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {/* Primera Vista */}
                    <div className="w-full p-6 flex-shrink-0">
                        <div className='flex justify-center items-center content-center'>
                            <input
                                type="text"
                                className="w-4/5 p-3 text-black mb-4 border rounded-md"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button
                                onClick={handleNextSlide}
                                className=" w-1/5 mb-4 ml-3  bg-[#019587] text-white py-2 rounded hover:bg-[#005148]"
                            >
                                Crear Grupo
                            </button>
                        </div>
                        <div className='flex justify-between items-center mb-4'>
                            <h2 className="text-lg font-medium text-[#01415B]">Grupos Disponibles</h2>
                            <button
                                onClick={updateChatsGroup}
                                className="bg-[#019587] text-white py-2 px-4 rounded hover:bg-[#005148]"
                            >
                                Actualizar Lista
                            </button>
                        </div>
                        <table className="min-w-full divide-y divide-[#005148]">
                            <thead className="bg-[#CCEA8D] text-[#01415B]">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#005148]">
                                {filteredGroups.map((group, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-[#005148]">{group.name}</td>
                                        <td className="px-4 py-2 text-sm text-[#005148]">
                                            <button
                                                className="px-4 py-2 bg-[#019587] text-white rounded hover:bg-[#005148]"
                                                onClick={() => {
                                                    setGroup(group)
                                                    sendPrecense(group.jid);
                                                }}
                                            >
                                                Iniciar Chat
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Segunda Vista */}
                    <div className="w-full p-6 flex-shrink-0">
                        <button onClick={handlePreviousSlide} className="mb-4 text-[#005148] hover:text-[#01415B]">
                            ← Volver a Grupos
                        </button>

                        <form onSubmit={handleCreateRoom}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Nombre del Grupo</label>
                                <input
                                    type="text"
                                    className="mt-1 text-black p-2 block w-full border rounded-md"
                                    value={roomName}
                                    onChange={(e) => setRoomName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                <textarea
                                    className="mt-1 p-2 block text-black w-full border rounded-md"
                                    rows={3}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Máximo Número de Integrantes</label>
                                <input
                                    type="number"
                                    className="mt-1 text-black p-2 block w-full border rounded-md"
                                    value={maxUsers}
                                    onChange={(e) => setMaxUsers(Number(e.target.value))}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">¿Es Público?</label>
                                <select
                                    className="mt-1 p-2 block text-black w-full border rounded-md"
                                    value={publicRoom}
                                    onChange={(e) => setPublicRoom(e.target.value === 'yes' ? 1 : 0)}
                                    required
                                >
                                    <option value="yes">Sí</option>
                                    <option value="no">No</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">¿Permite Invitaciones?</label>
                                <select
                                    className="mt-1 p-2 block text-black w-full border rounded-md"
                                    value={allowInvites}
                                    onChange={(e) => setAllowInvites(e.target.value === 'yes' ? 1 : 0)}
                                    required
                                >
                                    <option value="yes">Sí</option>
                                    <option value="no">No</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-[#019587] text-white py-2 rounded hover:bg-[#005148]">
                                Crear Grupo
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        </div>
    );
};

const GroupChatButton: React.FC<{ onClick: (contact: Contact) => void }> = ({ onClick }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const { groupChats } = useXMPP();
    const count = groupChats.length;

    return (
        <div className='flex items-center justify-center content-center h-full'>
            <button onClick={openModal} className="w-full h-full text-sm leading-4 bg-[#005148] text-white pl-5 pr-5 rounded">
                Mostrar Grupos
            </button>
            <GroupChatModal isOpen={isModalOpen} onClose={closeModal} UserAction={onClick} />
            <div className="flex flex-col items-center text-center w-fit h-fit p-1.5 ml-[-0.8rem] rounded-full bg-[#CCEA8D] text-xs text-black">
                {count}
            </div>
        </div>
    );
};

export default GroupChatButton;
