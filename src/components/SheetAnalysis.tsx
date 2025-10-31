import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSheetNames, getSheetData } from '../services/googleSheetsService';
import SheetSelector from './SheetSelector';
import SheetDisplay from './SheetDisplay';
import ColumnToggler from './ColumnToggler';

interface SheetAnalysisProps {
  sheetId: string;
}

interface SheetInfo {
  year: string;
  month: string;
  originalName: string;
}

const SheetAnalysis: React.FC<SheetAnalysisProps> = ({ sheetId }) => {
  const [sheetInfo, setSheetInfo] = useState<SheetInfo[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);

  const [sheetData, setSheetData] = useState<string[][] | null>(null);
  const [loadingSheets, setLoadingSheets] = useState<boolean>(true);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, string[][]>>({});


  const fetchSheets = useCallback(async () => {
    try {
      setError(null);
      setLoadingSheets(true);
      setSheetData(null);
      setCache({});
      
      const names = await getSheetNames(sheetId);
      const parsed = names.map(name => {
        const matchSpaced = name.match(/^(\d{4})\s*-\s*(\d{2})$/);
        if (matchSpaced) return { year: matchSpaced[1], month: matchSpaced[2], originalName: name };

        const matchCompact = name.match(/^(\d{4})(\d{2})$/);
        if (matchCompact) return { year: matchCompact[1], month: matchCompact[2], originalName: name };
        
        return null;
      }).filter((item): item is SheetInfo => item !== null);

      // Sort by year then month, descending
      parsed.sort((a, b) => b.originalName.localeCompare(a.originalName));

      setSheetInfo(parsed);
      
      const years = [...new Set(parsed.map(p => p.year))].sort((a, b) => b.localeCompare(a));
      setAvailableYears(years);
      
      if (years.length > 0) {
        const latestYear = years[0];
        setSelectedYear(latestYear);
        const monthsForLatestYear = parsed.filter(p => p.year === latestYear).map(p => p.month);
        if (monthsForLatestYear.length > 0) {
          setSelectedMonth(monthsForLatestYear[0]);
        } else {
          setSelectedMonth('');
        }
      } else {
        setSelectedYear('');
        setSelectedMonth('');
        setSheetData(null);
      }
    } catch (err) {
      setError('Erreur lors du chargement de l\'index des feuilles. Veuillez vérifier l\'URL et la configuration de la feuille.');
      console.error(err);
    } finally {
      setLoadingSheets(false);
    }
  }, [sheetId]);

  const fetchDataForSheet = useCallback(async (sheetName: string) => {
    if (!sheetName) return;

    if (cache[sheetName]) {
      setSheetData(cache[sheetName]);
      return;
    }

    try {
      setError(null);
      setLoadingData(true);
      setSheetData(null);
      const data = await getSheetData(sheetId, sheetName);
      setCache(prevCache => ({ ...prevCache, [sheetName]: data }));
      setSheetData(data);
    } catch (err) {
      setError(`Erreur lors du chargement des données pour la feuille: ${sheetName}.`);
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [sheetId, cache]);
  
  useEffect(() => {
    fetchSheets();
  }, [fetchSheets]);
  
  useEffect(() => {
    // Reset hidden columns when tab changes
    if (sheetId === '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374') {
      setHiddenColumns(['CA Max Fournisseur']);
    } else {
      setHiddenColumns([]);
    }
  }, [sheetId]);


  useEffect(() => {
    const currentSheet = sheetInfo.find(s => s.year === selectedYear && s.month === selectedMonth);
    if (currentSheet) {
      fetchDataForSheet(currentSheet.originalName);
    } else if (!loadingSheets && sheetInfo.length > 0) {
        setSheetData(null);
    }
  }, [selectedYear, selectedMonth, sheetInfo, fetchDataForSheet, loadingSheets]);

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const monthsForNewYear = sheetInfo
      .filter(p => p.year === year)
      .map(p => p.month);
    
    if (monthsForNewYear.length > 0) {
      setSelectedMonth(monthsForNewYear[0]);
    } else {
      setSelectedMonth('');
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };
  
  const handleToggleColumn = useCallback((columnName: string) => {
    setHiddenColumns(prev => {
      const isCurrentlyHidden = prev.some(c => c.toLowerCase() === columnName.toLowerCase());
      if (isCurrentlyHidden) {
        return prev.filter(c => c.toLowerCase() !== columnName.toLowerCase());
      } else {
        return [...prev, columnName];
      }
    });
  }, []);
  
  const currentSheetName = sheetInfo.find(s => s.year === selectedYear && s.month === selectedMonth)?.originalName ?? '';
  const originalHeader = useMemo(() => sheetData?.[0] || [], [sheetData]);

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <SheetSelector
            availableYears={availableYears}
            monthsForSelectedYear={sheetInfo.filter(p => p.year === selectedYear).map(p => p.month)}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
            disabled={loadingSheets || sheetInfo.length === 0}
            loading={loadingSheets}
          />
          {sheetId === '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374' && originalHeader.length > 0 && !loadingData && (
            <div className="mt-4 flex justify-end">
              <ColumnToggler
                columns={originalHeader}
                hiddenColumns={hiddenColumns}
                onToggle={handleToggleColumn}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 mt-8">
        {error && (
          <div className="max-w-3xl mx-auto bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-center">
            <p className="font-bold">Une erreur est survenue</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!error && (
          <SheetDisplay
            sheetId={sheetId}
            data={sheetData}
            loading={loadingData}
            sheetName={currentSheetName}
            hiddenColumns={hiddenColumns}
          />
        )}
      </div>
    </>
  );
};

export default SheetAnalysis;
