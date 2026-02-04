
import React, { useEffect, useState } from 'react';
import { CheckCircle2, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  type: ToastType;
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, title, message, isVisible, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
      const timer = setTimeout(() => {
        handleClose();
      }, 4000); // Auto close after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for fade-out animation
  };

  if (!isVisible && !isClosing) return null;

  const getConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          bgIcon: 'bg-emerald-100',
          textIcon: 'text-emerald-600',
          borderColor: 'border-emerald-100',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgIcon: 'bg-rose-100',
          textIcon: 'text-rose-600',
          borderColor: 'border-rose-100',
        };
      default:
        return {
          icon: Info,
          bgIcon: 'bg-blue-100',
          textIcon: 'text-blue-600',
          borderColor: 'border-blue-100',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div 
      className={`fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-auto
        ${isVisible && !isClosing ? 'animate-slide-up' : 'animate-fade-out pointer-events-none'}
      `}
    >
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 pr-10 relative min-w-[320px] max-w-[400px] shadow-xl shadow-gray-200/50">
        {/* Icon Wrapper */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgIcon} ${config.textIcon}`}>
          <Icon size={20} strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="flex-1 pt-0.5">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight">{title}</h4>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed font-normal">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
        >
          <X size={16} />
        </button>

        {/* Subtle border overlay */}
        <div className={`absolute inset-0 border ${config.borderColor} rounded-xl pointer-events-none opacity-50`}></div>
      </div>
    </div>
  );
};

export default Toast;
