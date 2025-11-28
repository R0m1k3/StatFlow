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

        // Extract and format Period from first line
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
                      <SimpleTable headers={group.qtyTable.headers} rows={group.qtyTable.rows.slice(0, 10)} type="qty" />
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
                      <SimpleTable headers={group.amountTable.headers} rows={group.amountTable.rows.slice(0, 10)} type="amount" />
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

const SimpleTable: React.FC<{ headers: string[], rows: string[][], type: 'qty' | 'amount' }> = ({ headers, rows, type }) => {
  const produitIdx = headers.findIndex(h => h.toLowerCase().includes('produit'));
  const valIdx = headers.findIndex(h => {
    const t = h.toLowerCase();
    return type === 'qty' ? t.includes('quant') : t.includes('montant');
  });

  const indicesToShow = (produitIdx !== -1 && valIdx !== -1)
    ? [0, produitIdx, valIdx]
    : [0, 1, 2].filter(i => i < headers.length);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs w-full">
        <thead className="bg-slate-50">
          <tr>
            {indicesToShow.map((i, k) => (
              <th key={k} className="px-2 py-1.5 text-left font-semibold text-slate-600 border-b border-slate-100 whitespace-nowrap">
                {headers[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              {indicesToShow.map((i, cIdx) => (
                <td key={cIdx} className={`px-2 py-1.5 truncate max-w-[120px] ${cIdx === 0 ? 'font-medium text-slate-500 w-8' : 'text-slate-700'}`} title={row[i]}>
                  {row[i]}
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