
import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, className, ...props }) => {
  return (
    <label className={`flex items-center gap-3 cursor-pointer group select-none ${className || ''}`}>
      <div className="relative flex items-center justify-center w-6 h-6">
        <input
          type="checkbox"
          className="peer sr-only"
          {...props}
        />
        {/* Base Box */}
        <div className="w-6 h-6 border-2 border-gray-300 rounded-[7px] bg-white transition-all duration-200 ease-out
          peer-checked:bg-primary peer-checked:border-primary peer-checked:shadow-sm
          group-hover:border-primary/60">
        </div>
        
        {/* Check Icon with Scale/Opacity Animation */}
        <Check 
          size={14} 
          strokeWidth={3.5} 
          className="absolute text-white opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-200 ease-out" 
        />
      </div>
      {label && <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>}
    </label>
  );
};

export default Checkbox;
