import React, { useEffect } from 'react';

const Toast = ({ message, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000); // Auto-close after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-100 animate-in slide-in-from-bottom-10 duration-300">
      <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-md">
        <div className="bg-emerald-500 p-1 rounded-full">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="font-bold tracking-wide text-sm">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
