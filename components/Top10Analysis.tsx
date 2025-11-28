import React, { useState, useEffect } from 'react';
import { getRawSheetData } from '../services/googleSheetsService';
import Spinner from './Spinner';

interface Top10AnalysisProps {
  sheetId: string;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

interface NomenclatureGroup {
  name: string;
  qtyTable?: TableData;
  amountTable?: TableData;
}

const STORES = ['Houdemont', 'Nancy'];

const Top10Analysis: React.FC<Top10AnalysisProps> = ({ sheetId }) => {
  const [selectedStore, setSelectedStore] = useState(STORES[0]);
  const [period, setPeriod] = useState<string>('');
  const [groups, setGroups] = useState<NomenclatureGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setGroups([]);
      setPeriod('');

      try {
        const rawData = await getRawSheetData(sheetId, selectedStore);

        if (!rawData || rawData.length === 0) {
          throw new Error("Aucune donnée trouvée.");
        }

        // Extract and format Period
        let foundPeriod = '';
        if (rawData[0] && rawData[0].length > 0) {
          const firstLine = rawData[0][0];
          const periodMatch = firstLine.match(/période\s*:\s*(\d{4})-(\d{2})/i);
          if (periodMatch) {
            const year = periodMatch[1];
            const month = periodMatch[2];
            const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
              'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
            const monthName = months[parseInt(month) - 1];
            foundPeriod = `Période ${monthName} ${year}`;
          }
        }
        setPeriod(foundPeriod);

        console.log('[DEBUG TOP10] Total rows received:', rawData.length);

        // Parse ALL nomenclatures with their qty and amount tables
        const parsedGroups: NomenclatureGroup[] = [];
        let currentGroup: NomenclatureGroup | null = null;
        let currentTableType: 'qty' | 'amount' | null = null;
        let currentHeaders: string[] = [];

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          if (row.every(c => !c || c.trim() === '')) continue;

          const firstCell = row[0] ? row[0].trim() : '';
          const fullRowString = row.join(' ').toLowerCase();

          // Detect new Nomenclature
          if (firstCell.toLowerCase().startsWith('nomenclature')) {
            if (currentGroup) parsedGroups.push(currentGroup);
            currentGroup = { name: firstCell };
            currentTableType = null;
            continue;
          }

          // Detect table type (Quantité or Montant)
          if (fullRowString.includes('top 10')) {
            if (fullRowString.includes('quantité') || fullRowString.includes('quant')) {
              currentTableType = 'qty';
              continue;
            } else if (fullRowString.includes('montant')) {
              currentTableType = 'amount';
              continue;
            }
          }

          // If line starts with "Code", it's headers
          if (firstCell.toLowerCase() === 'code') {
            currentHeaders = row.map(c => c ? c.trim() : '').filter(c => c);
            if (currentGroup && currentTableType === 'qty') {
              currentGroup.qtyTable = { headers: currentHeaders, rows: [] };
            } else if (currentGroup && currentTableType === 'amount') {
              currentGroup.amountTable = { headers: currentHeaders, rows: [] };
            }
            continue;
          }

          // Collect data rows (starting with a number = product code)
          if (currentGroup && currentTableType && /^\d+$/.test(firstCell)) {
            const cleanRow = row.map(c => c ? c.trim() : '');
            if (currentTableType === 'qty' && currentGroup.qtyTable) {
              currentGroup.qtyTable.rows.push(cleanRow);
            } else if (currentTableType === 'amount' && currentGroup.amountTable) {
              currentGroup.amountTable.rows.push(cleanRow);
            }
          }
        }

        // Push last group
        if (currentGroup) parsedGroups.push(currentGroup);

        console.log('[DEBUG TOP10] Parsed groups:', parsedGroups.length);
        setGroups(parsedGroups);

      } catch (err) {
        console.error("Erreur parsing Top 10:", err);
        setError("Impossible de charger les données Top 10.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sheetId, selectedStore]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
          {STORES.map((store) => (
            <button
              key={store}
              onClick={() => setSelectedStore(store)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedStore === store ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Magasin {store}
            </button>
          ))}
        </div>
        <div className="text-slate-600 font-medium bg-slate-50 px-4 py-2 rounded border border-slate-200 whitespace-nowrap">
          {period || 'Période inconnue'}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Spinner /></div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">{error}</div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-slate-500">
          Aucune donnée "Top 10" trouvée pour ce magasin.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {groups.map((group, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                <h3 className="font-bold text-slate-700 text-sm sm:text-base">{group.name}</h3>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 grow">
                <div className="flex flex-col h-full">
                  <div className="text-xs font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-1.5 rounded-t mb-0 text-center uppercase tracking-wide">
                    Top 10 Quantité
                  </div>
                  <div className="border border-slate-200 rounded-b overflow-hidden grow">
                    {group.qtyTable && group.qtyTable.rows.length > 0 ? (
                      <SimpleTable headers={group.qtyTable.headers} rows={group.qtyTable.rows} />
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs">Aucune donnée</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col h-full">
                  <div className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1.5 rounded-t mb-0 text-center uppercase tracking-wide">
                    Top 10 Montant
                  </div>
                  <div className="border border-slate-200 rounded-b overflow-hidden grow">
                    {group.amountTable && group.amountTable.rows.length > 0 ? (
                      <SimpleTable headers={group.amountTable.headers} rows={group.amountTable.rows} />
                    ) : (
                      <div className="p-4 text-center text-slate-400 text-xs">Aucune donnée</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SimpleTable: React.FC<{ headers: string[], rows: string[][] }> = ({ headers, rows }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs w-full">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h, k) => (
              <th key={k} className="px-2 py-1.5 text-left font-semibold text-slate-600 border-b border-slate-100 whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-2 py-1.5 truncate max-w-[120px] text-slate-700" title={cell}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Top10Analysis;