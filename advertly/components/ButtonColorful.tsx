
import React from 'react';
import { Plus, LucideIcon } from 'lucide-react';

interface ButtonColorfulProps {
    label: string;
    onClick: () => void;
    className?: string;
    labelClassName?: string;
    variant?: 'white' | 'primary';
    icon?: LucideIcon;
}

export const ButtonColorful: React.FC<ButtonColorfulProps> = ({ 
    label, 
    onClick, 
    className = "", 
    labelClassName = "",
    variant = 'white',
    icon: Icon = Plus
}) => {
    const variants = {
        white: "bg-white text-primary border border-white/40 hover:bg-gray-50 hover:border-primary/30 transition-all duration-300",
        primary: "bg-gradient-to-r from-primary to-indigo-600 text-white border border-primary/50 hover:opacity-90 transition-all duration-300"
    };

    return (
        <button
            onClick={onClick}
            className={`
                group relative inline-flex items-center justify-center gap-2 
                px-5 py-2.5 md:px-6 md:py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-300 ease-in-out
                active:scale-[0.97] 
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2
                ${variants[variant]}
                ${className}
            `}
        >
            <Icon 
                size={16} 
                strokeWidth={2.5} 
                className="transition-transform duration-300" 
            />
            <span className={`tracking-tight font-semibold ${labelClassName}`}>{label}</span>
        </button>
    );
};

export default ButtonColorful;
