import React from 'react';

interface SheetSelectorProps {
  years: string[];
  monthsForSelectedYear: string[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  isLoading: boolean;
}

const SheetSelector: React.FC<SheetSelectorProps> = ({
  years,
  monthsForSelectedYear,
  selectedYear,
  onYearChange,
  selectedMonth,
  onMonthChange,
  isLoading,
}) => {
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label htmlFor="year-select" className="block text-sm font-medium text-slate-700 mb-1">
                Année
                </label>
                <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                disabled={isLoading || years.length === 0}
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                {years.map((year) => (
                    <option key={year} value={year}>
                    {year}
                    </option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="month-select" className="block text-sm font-medium text-slate-700 mb-1">
                Mois
                </label>
                <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                disabled={isLoading || monthsForSelectedYear.length === 0}
                className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                {monthsForSelectedYear.map((month) => (
                    <option key={month} value={month}>
                    {monthNames[parseInt(month) - 1]}
                    </option>
                ))}
                </select>
            </div>
        </div>
    </div>
  );
};

export default SheetSelector;