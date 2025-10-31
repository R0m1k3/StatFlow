import React from 'react';
import { ChevronDownIcon } from './Icons';

interface SheetSelectorProps {
  availableYears: string[];
  monthsForSelectedYear: string[];
  selectedYear: string;
  selectedMonth: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
  disabled: boolean;
  loading: boolean;
}

const MONTH_NAMES: { [key: string]: string } = {
    '01': 'Janvier', '02': 'Février', '03': 'Mars', '04': 'Avril',
    '05': 'Mai', '06': 'Juin', '07': 'Juillet', '08': 'Août',
    '09': 'Septembre', '10': 'Octobre', '11': 'Novembre', '12': 'Décembre'
};

const SheetSelector: React.FC<SheetSelectorProps> = ({
  availableYears,
  monthsForSelectedYear,
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  disabled,
  loading
}) => {
  return (
    <div>
      <label htmlFor="year-selector" className="block text-sm font-medium text-gray-700 mb-2">
        Sélectionner une période d'analyse
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Year Selector */}
        <div className="relative">
          <select
            id="year-selector"
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            disabled={disabled}
            className="w-full appearance-none bg-white border border-gray-300 text-gray-900 py-3 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sélectionner l'année"
          >
            {loading && <option>Chargement...</option>}
            {!loading && availableYears.length === 0 && <option>Aucune année</option>}
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <ChevronDownIcon className="w-5 h-5" />
          </div>
        </div>

        {/* Month Selector */}
        <div className="relative">
          <select
            id="month-selector"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            disabled={disabled || monthsForSelectedYear.length === 0}
            className="w-full appearance-none bg-white border border-gray-300 text-gray-900 py-3 px-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sélectionner le mois"
          >
            {loading && <option>Chargement...</option>}
            {!loading && monthsForSelectedYear.length === 0 && <option>Aucun mois</option>}
            {monthsForSelectedYear.map((month) => (
              <option key={month} value={month}>
                {MONTH_NAMES[month] || month}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
            <ChevronDownIcon className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetSelector;
