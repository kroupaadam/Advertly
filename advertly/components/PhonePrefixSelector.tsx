import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface PhonePrefix {
  code: string;
  country: string;
  countryCode: string; // ISO country code for flag icon URL
}

interface PhonePrefixSelectorProps {
  value: string;
  onChange: (value: string) => void;
  prefixes: PhonePrefix[];
}

const PhonePrefixSelector: React.FC<PhonePrefixSelectorProps> = ({ value, onChange, prefixes }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const selectedPrefix = prefixes.find(p => p.code === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-3.5 pr-3.5 py-2.5 bg-gray-50/50 border border-gray-200 rounded-lg hover:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-[1.25px] outline-none transition-all font-medium text-sm text-gray-800 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedPrefix && (
            <img 
              src={`https://flagcdn.com/${selectedPrefix.countryCode.toLowerCase()}.svg`} 
              alt={selectedPrefix.country}
              className="w-5 h-auto rounded-sm"
            />
          )}
          <span className="truncate">{selectedPrefix?.code}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-200 text-gray-400 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {prefixes.map((prefix) => (
            <button
              key={prefix.code}
              type="button"
              onClick={() => {
                onChange(prefix.code);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                value === prefix.code ? 'bg-violet-50' : ''
              }`}
            >
              <img 
                src={`https://flagcdn.com/${prefix.countryCode.toLowerCase()}.svg`} 
                alt={prefix.country}
                className="w-5 h-auto rounded-sm flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800">{prefix.code}</div>
                <div className="text-xs text-gray-500 truncate">{prefix.country}</div>
              </div>
              {value === prefix.code && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhonePrefixSelector;
