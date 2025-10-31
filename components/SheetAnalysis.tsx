import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getSheetNames, getSheetData } from '../services/googleSheetsService';
import SheetSelector from './SheetSelector';
import SheetDisplay from './SheetDisplay';
import Spinner from './Spinner';

interface SheetAnalysisProps {
  sheetId: string;
  tabName: string;
}

interface PeriodData {
  [year: string]: string[];
}

type DateFormat = 'YYYY-MM' | 'YYYYMM';

const SheetAnalysis: React.FC<SheetAnalysisProps> = ({ sheetId, tabName }) => {
  const [periods, setPeriods] = useState<PeriodData>({});
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [sheetData, setSheetData] = useState<Record<string, string>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>('YYYY-MM');

  const dataCache = useRef<Record<string, Record<string, string>[]>>({});

  useEffect(() => {
    const fetchSheetIndex = async () => {
      setIsLoading(true);
      setError(null);
      setSheetData([]);
      setSelectedYear('');
      setSelectedMonth('');
      setPeriods({});
      dataCache.current = {};

      try {
        console.log(`[SheetAnalysis] [${sheetId}] Démarrage de la récupération de l'index.`);
        const names = await getSheetNames(sheetId);
        
        const firstValidName = names.find(name => /^\d{4}-\d{1,2}$/.test(name) || /^\d{6}$/.test(name));
        
        if (!firstValidName) {
            if (names.length > 0) {
                 setError("Aucune période valide (format AAAA-MM ou AAAAMM) n'a été trouvée dans la feuille 'index'.");
            }
            setIsLoading(false);
            return;
        }

        const detectedFormat: DateFormat = firstValidName.includes('-') ? 'YYYY-MM' : 'YYYYMM';
        setDateFormat(detectedFormat);

        const newPeriods: PeriodData = names.reduce((acc, name) => {
          let year: string | undefined;
          let month: string | undefined;

          if (detectedFormat === 'YYYY-MM' && name.includes('-')) {
            [year, month] = name.split('-');
          } else if (detectedFormat === 'YYYYMM' && name.length === 6 && !isNaN(parseInt(name))) {
            year = name.substring(0, 4);
            month = name.substring(4, 6);
          }
          
          if (year && month) {
            if (!acc[year]) {
              acc[year] = [];
            }
            if (!acc[year].includes(month)) {
                acc[year].push(month);
            }
          }
          return acc;
        }, {} as PeriodData);
        
        Object.keys(newPeriods).forEach(year => {
          newPeriods[year].sort((a, b) => parseInt(b) - parseInt(a));
        });

        setPeriods(newPeriods);

        const latestYear = Object.keys(newPeriods).sort().pop();
        if (latestYear) {
          setSelectedYear(latestYear);
          const latestMonth = newPeriods[latestYear]?.[0];
          if (latestMonth) {
            setSelectedMonth(latestMonth);
          } else {
            setIsLoading(false);
          }
        } else {
            setIsLoading(false);
        }
        console.log(`[SheetAnalysis] [${sheetId}] Index récupéré. Périodes:`, newPeriods);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue.';
        console.error(`[SheetAnalysis] [${sheetId}] Erreur index:`, err);
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    fetchSheetIndex();
  }, [sheetId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedYear || !selectedMonth) {
        return;
      }

      const sheetName = dateFormat === 'YYYY-MM'
        ? `${selectedYear}-${selectedMonth}`
        : `${selectedYear}${selectedMonth}`;
      
      if (dataCache.current[sheetName]) {
        setSheetData(dataCache.current[sheetName]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        console.log(`[SheetAnalysis] [${sheetId}] Démarrage de la récupération des données pour: "${sheetName}"`);
        const data = await getSheetData(sheetId, sheetName);
        dataCache.current[sheetName] = data;
        setSheetData(data);
        console.log(`[SheetAnalysis] [${sheetId}] Données récupérées pour: "${sheetName}".`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue.';
        console.error(`[SheetAnalysis] [${sheetId}] Erreur données pour "${sheetName}":`, err);
        setError(errorMessage);
        setSheetData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth, sheetId, dateFormat]);

  const processedSheetData = useMemo(() => {
    if (tabName === 'Hit Parade' && sheetData.length > 0) {
      // Rend la recherche de la colonne plus robuste en normalisant les espaces multiples.
      const keyToDelete = Object.keys(sheetData[0]).find(k => 
        k.trim().replace(/\s+/g, ' ').toLowerCase() === 'ca max fournisseur'
      );
      if (!keyToDelete) {
        return sheetData;
      }
      return sheetData.map(row => {
        const { [keyToDelete]: _, ...rest } = row;
        return rest;
      });
    }
    return sheetData;
  }, [sheetData, tabName]);

  const years = useMemo(() => Object.keys(periods).sort().reverse(), [periods]);
  const monthsForYear = useMemo(() => periods[selectedYear] || [], [periods, selectedYear]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (periods[year] && periods[year].length > 0) {
      setSelectedMonth(periods[year][0]);
    } else {
      setSelectedMonth('');
    }
  };

  const renderContent = () => {
    if (isLoading && sheetData.length === 0) {
      return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    if (error) {
      return <div className="text-center text-red-700 bg-red-50 border border-red-200 p-4 rounded-lg">{error}</div>;
    }
    if (processedSheetData.length > 0) {
      return <SheetDisplay data={processedSheetData} />;
    }
    if (years.length > 0) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500">
            Aucune donnée à afficher pour la période sélectionnée.
        </div>
      );
    }
    return (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500">
            Aucune période disponible pour cette analyse.
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <SheetSelector
        years={years}
        monthsForSelectedYear={monthsForYear}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        isLoading={isLoading && sheetData.length === 0}
      />
      {renderContent()}
    </div>
  );
};

export default SheetAnalysis;