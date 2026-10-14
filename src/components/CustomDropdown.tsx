import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string; // Tên phần cứng đầy đủ, ví dụ: "Intel(R) Ethernet Controller (3) I225-V #2"
  tag?: string;  // Tên ngắn gọn: "Ethernet #1", "Ethernet #2", "Wi-Fi"
  type?: 'wifi' | 'ethernet' | 'virtual' | 'other';
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select adapter...',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative w-full" ref={dropdownRef} id={id}>
      {/* Trigger Button - Khi chọn chỉ hiển thị: Ethernet #1, Ethernet #2, Wi-Fi */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-9 px-3 flex items-center justify-between text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[6px] text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-2xs"
      >
        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
          {selectedOption ? (selectedOption.tag || selectedOption.value) : placeholder}
        </span>

        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-150 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu - Hiển thị 2 dòng: dòng 1 là tag (Ethernet #1), dòng 2 là tên đầy đủ của card */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[6px] shadow-xl py-1 z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 ${
                  isSelected
                    ? 'bg-blue-50/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                {/* 2 dòng: Line 1 = Tag ngắn gọn, Line 2 = Tên đầy đủ */}
                <div className="flex flex-col min-w-0 flex-1 pr-2 leading-snug">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {option.tag || option.value}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 break-words mt-0.5">
                    {option.label}
                  </span>
                </div>

                {isSelected && (
                  <Check size={14} className="text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
