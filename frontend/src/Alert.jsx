import React from 'react';

const Alert = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      ></div>
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-2">{title}</h3>
        <p className="text-slate-500 leading-relaxed mb-8">
          {message}
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Keep it
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-3.5 rounded-2xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default Alert;
