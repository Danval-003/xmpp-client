'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useXMPP } from '@/app/context/XMPPContext';

interface Contact {
  jid: string;
  name: string;
  status?: string;
  active?: number;
  imageBase64?: string;
  group?: string;
}

const ProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; contact: Contact }> = ({ isOpen, onClose, contact }) => {
  const [selectedImage, setSelectedImage] = useState<string | ArrayBuffer | null>(null);
  const [newStatus, setNewStatus] = useState(contact.active || 6);
  const [profileMessage, setProfileMessage] = useState(contact.status || '');
  const modalRef = useRef<HTMLDivElement | null>(null);
  const { updateProfilePicture, updateStatus } = useXMPP();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    // Aquí implementarás la función para guardar los cambios en el servidor
    // Esta función debería actualizar la imagen de perfil y el estado del usuario
    // La función podría utilizar selectedImage, newStatus y profileMessage para enviar los datos al servidor

    // Verifica si se ha seleccionado una imagen
    if (selectedImage) {
      // Convierte la imagen a base64
      const base64 = selectedImage.toString().split(",")[1];
      // Actualiza la imagen del contacto
      contact.imageBase64 = base64;
      const filename = "profile.png";

      updateProfilePicture(base64, filename);
    }

    if (newStatus || profileMessage) {
      const show = newStatus;
      const status = profileMessage;
      // Actualiza el estado del contacto
      updateStatus(status, show);
    }

    // Llama a la función onClose después de guardar los cambios
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const statusOptions = [
    { value: 1, label: 'Online 🟢' },
    { value: 0, label: 'Desconectado 🔴' },
    { value: 2, label: 'Ocupado ⛔' },
    { value: 3, label: 'Ausente 🟠' },
    { value: 4, label: 'No disponible 🔴' },
  ];

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          ref={modalRef}
          className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 max-h-[80vh] p-6 relative z-40 border border-[#A6BC09]"
        >
          <button
            onClick={onClose}
            className="absolute z-10 top-2 right-2 text-[#005148] hover:text-[#01415B]"
          >
            ×
          </button>

          <div className="flex flex-col items-center">
            <label htmlFor="upload-image" className="cursor-pointer">
              <img
                src={
                  selectedImage ||
                  (contact.imageBase64
                    ? `data:image/png;base64,${contact.imageBase64}`
                    : "https://www.gravatar.com/avatar/" + contact.jid + "?d=identicon")
                }
                alt="profile"
                className="w-24 h-24 rounded-full mb-4"
              />
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden" // Oculta el input
              id="upload-image"
            />

            <h1 className="text-lg font-semibold mb-2">{contact.name}</h1>

            <label className="block text-sm font-medium text-gray-700">Estado:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full p-2 mt-2 mb-4 text-black border rounded-md"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-gray-700">Mensaje de perfil:</label>
            <input
              type="text"
              value={profileMessage}
              onChange={(e) => setProfileMessage(e.target.value)}
              className="w-full p-2 mt-2 mb-4 text-black border rounded-md"
              placeholder="Escribe tu mensaje de perfil aquí..."
            />

            <button
              onClick={handleSaveChanges}
              className="bg-[#019587] text-white py-2 px-4 rounded hover:bg-[#005148]"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={onClose}
        ></div>
      </div>
    </>
  );
};

const ProfileButton: React.FC<{ contact: Contact }> = ({ contact }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div onClick={openModal} className="cursor-pointer">
      {profileShow(contact)}
      <ProfileModal isOpen={isModalOpen} onClose={closeModal} contact={contact} />
    </div>
  );
};

const profileShow = (contact: Contact) => {
  const status = () => {
    switch (contact.active) {
      case 1:
        return contact.status ? `${contact.status}🟢` : "Online🟢";
      case 0:
        return contact.status ? `${contact.status}🔴` : "Desconectado 🟣";
      case 2:
        return contact.status ? `${contact.status}⛔` : "Ocupado ⛔";
      case 3:
        return contact.status ? `${contact.status}🟠` : "Ausente 🟠";
      case 4:
        return contact.status ? `${contact.status}🔴` : "No disponible 🔴";
      default:
        return contact.name ? "Desconocido 🟡" : "";
    }
  };
  return (
    <div className="flex items-center pr-3 pl-4">
      <img
        src={
          contact.imageBase64
            ? `data:image/png;base64,${contact.imageBase64}`
            : "https://www.gravatar.com/avatar/" + contact.jid + "?d=identicon"
        }
        alt="profile"
        className="w-10 h-10 rounded-full"
      />
      <div className="ml-3">
        <h1 className="text-lg font-semibold">{contact.name}</h1>
        <p className="text-sm text-[#ffffffd6]">{status()}</p>
      </div>
    </div>
  );
};

export default ProfileButton;
