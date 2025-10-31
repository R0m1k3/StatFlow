import React, { useState, useRef, useEffect } from 'react';
import { ColumnsIcon } from './Icons';

interface ColumnTogglerProps {
  columns: string[];
  hiddenColumns: string[];
  onToggle: (column: string) => void;
}

const ColumnToggler: React.FC<ColumnTogglerProps> = ({ columns, hiddenColumns, onToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <ColumnsIcon className="mr-2 h-5 w-5 text-gray-400" />
        Afficher/Masquer Colonnes
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none max-h-80 overflow-y-auto">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {columns.map((column) => (
              <label key={column} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  checked={!hiddenColumns.some(hc => hc.toLowerCase() === column.toLowerCase())}
                  onChange={() => onToggle(column)}
                />
                <span className="ml-3">{column}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnToggler;
