'use client';
import React from 'react';

interface ModalConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ModalConfirm: React.FC<ModalConfirmProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/3 max-h-[80vh] overflow-y-auto relative z-40 border border-[#A6BC09]">
        <button onClick={onClose} className="absolute top-2 right-2 text-[#005148] hover:text-[#01415B]">
          ×
        </button>

        <h2 className="text-xl text-[#01415B] font-bold mb-4">¿Estás seguro?</h2>
        <p className="text-[#5c5c5c] mb-6">Esta acción no se puede deshacer.</p>

        <div className="mt-4 flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-[#A6BC09] text-white rounded hover:bg-[#01415B]"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 bg-[#019587] text-white rounded hover:bg-[#005148]"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
    </div>
  );
};

export default ModalConfirm;