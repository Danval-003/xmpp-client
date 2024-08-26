'use client';
import React, { useState } from 'react';
import { useXMPP } from '@/app/context/XMPPContext';

interface Contacts_ {
    jid: string;
    name: string;
    type: string; // 'from', 'to', 'both'
}

interface Contact {
    jid: string;
    name: string;
    status?: string;
    active?: number;
    imageBase64?: string;
    type: string; // 'from', 'to', 'both'
}

interface Solicitudes {
    jid: string;
    name: string;
    status: string;
}

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; UserAction: (contact: Contact) => void }> = ({ isOpen, onClose, UserAction }) => {
    const { contacts, acceptContact, addContact, rejectContact, solContacts, setSolContacts } = useXMPP(); // `contacts` es de tipo `Contacts[]`
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedContact, setSelectedContact] = useState<Contacts_ | null>(null);
    const contactsPerPage = 10;

    if (!isOpen) return null;

    const setContact = (contact: Contact) => {
        UserAction(contact);
        onClose();
    };

    const paginatedContacts = contacts.slice(0, currentPage * contactsPerPage);

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto relative z-40 border border-[#A6BC09]">
                <button onClick={onClose} className="absolute top-2 right-2 text-[#005148] hover:text-[#01415B]">
                    ×
                </button>

                {!selectedContact ? (
                    <div>
                        <h2 className="text-xl text-[#01415B] font-bold mb-4">Contactos</h2>
                        <table className="min-w-full divide-y divide-[#005148]">
                            <thead className="bg-[#CCEA8D] text-[#01415B]">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#005148]">
                                {paginatedContacts.map((contact, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-[#005148]">{contact.name}</td>
                                        <td className="px-4 py-2 text-sm text-[#005148]">{contact.type}</td>
                                        <td className="px-4 py-2 text-sm text-[#005148]">
                                            <button
                                                className="text-[#019587] hover:underline"
                                                onClick={() => setSelectedContact({
                                                    jid: contact.jid,
                                                    name: contact.name,
                                                    type: contact.type
                                                })}
                                            >
                                                Ver más
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {paginatedContacts.length < contacts.length && (
                            <div className="text-center mt-4">
                                <button
                                    className="px-4 py-2 bg-[#019587] text-white rounded hover:bg-[#005148]"
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                >
                                    Ver más
                                </button>
                            </div>
                        )}

                        {
                            solContacts.length > 0 && (
                                <>
                                <h2 className="text-xl text-[#01415B] font-bold mb-4 mt-8">Solicitudes de Seguimiento</h2>
                        <table className="min-w-full divide-y divide-[#005148]">
                            <thead className="bg-[#CCEA8D] text-[#01415B]">
                                <tr>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                                    <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#005148]">
                                {solContacts.length > 0 ?   solContacts.map((solicitud, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2 text-sm text-[#005148]">{solicitud.name}</td>
                                        <td className="px-4 py-2 text-sm text-[#005148]">{solicitud.status}</td>
                                        <td className="px-4 py-2 text-sm text-[#005148]">
                                            <button
                                                className="text-[#019587] hover:underline mr-2"
                                                onClick={() => {
                                                    acceptContact(solicitud.jid);
                                                    setSolContacts(solContacts.filter((sol) => sol.jid !== solicitud.jid));
                                                }}
                                            >
                                                Aceptar
                                            </button>
                                            <button
                                                className="text-[#F44336] hover:underline"
                                                onClick={() => {
                                                    rejectContact(solicitud.jid);
                                                    setSolContacts(solContacts.filter((sol) => sol.jid !== solicitud.jid));
                                                }}
                                            >
                                                Rechazar
                                            </button>
                                        </td>
                                    </tr>
                                )): (null)
                        
                            }
                            </tbody>
                        </table>
                                </>
                            )
                        }
                        
                    </div>
                ) : (
                    <div>
                        <h2 className="text-xl text-[#01415B] font-bold mb-4">{selectedContact.name}</h2>
                        <p className='text-[#5c5c5c]'><strong>JID:</strong> {selectedContact.jid}</p>
                        <p className='text-[#5c5c5c]'><strong>Type:</strong> {selectedContact.type}</p>

                        <div className="mt-4 flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 bg-[#A6BC09] text-white rounded hover:bg-[#01415B]"
                                onClick={() => setSelectedContact(null)}
                            >
                                Volver
                            </button>
                            {selectedContact.type === 'to' && (
                                <button
                                    className="px-4 py-2 bg-[#CCEA8D] text-[#01415B] rounded hover:bg-[#A6BC09]"
                                    onClick={() => {
                                        acceptContact(selectedContact.jid);
                                        setSelectedContact(null);
                                    }}
                                >
                                    Aceptar Solicitud
                                </button>
                            )}
                            {(selectedContact.type === 'from' || selectedContact.type === 'both' || selectedContact.type === 'none') && (
                                <button
                                    className="px-4 py-2 bg-[#CCEA8D] text-[#01415B] rounded hover:bg-[#A6BC09]"
                                    onClick={() => {
                                        rejectContact(selectedContact.jid);
                                        setSelectedContact(null);
                                    }}
                                >
                                    Remover Contacto
                                </button>
                            )}
                            {selectedContact.type === 'both' && (
                                <button
                                    className="px-4 py-2 bg-[#019587] text-white rounded hover:bg-[#005148]"
                                    onClick={() => {
                                        const contact: Contact = {
                                            jid: selectedContact.jid,
                                            name: selectedContact.name,
                                            type: selectedContact.type,
                                            status: '',
                                            active: 6,
                                            imageBase64: ''
                                        };
                                        setContact(contact);
                                    }}
                                >
                                    Iniciar Chat
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        </div>
    );
};

// Componente principal
const ContactListButton: React.FC<{ onClick: (contact: Contact) => void }> = ({ onClick }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);
    const { contacts } = useXMPP();
    const count = contacts.length;

    return (
        <div className='flex items-center justify-center content-center h-full'>
            <button onClick={openModal} className="w-full h-full text-sm leading-4 bg-[#005148] text-white pl-5 pr-5 rounded">
                Mostrar Contactos
            </button>
            <div className='pr-6'>
                {count > 0 && (
                    <span className="bg-[#CCEA8D] text-[#005148] text-xs rounded-full px-2 py-1 ml-2">
                        {count}
                    </span>
                )}
            </div>
            <Modal isOpen={isModalOpen} onClose={closeModal} UserAction={onClick} />
        </div>
    );
};

export default ContactListButton;
