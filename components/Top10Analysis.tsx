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

// Stores defined by the sheets in the provided Google Doc
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
        // Fetch the raw matrix data for the selected store (tab name)
        const rawData = await getRawSheetData(sheetId, selectedStore);

        if (!rawData || rawData.length === 0) {
          throw new Error("Aucune donnée trouvée.");
        }

        // 1. Extract Period (First line usually)
        let foundPeriod = '';
        if (rawData[0] && rawData[0].length > 0) {
          foundPeriod = rawData[0][0];
        }
        setPeriod(foundPeriod);

        console.log('[DEBUG TOP10] Total rows:', rawData.length);
        console.log('[DEBUG TOP10] First 5 rows:', rawData.slice(0, 5));
        console.log('[DEBUG TOP10] Sample row 10-15:', rawData.slice(10, 15));

        // 2. Parse the multiple tables
        const parsedGroups: NomenclatureGroup[] = [];
        let currentGroup: NomenclatureGroup | null = null;
        let currentTableType: 'qty' | 'amount' | null = null;
        let currentHeaders: string[] = [];
        let collectingRows = false;

        for (let i = 0; i < rawData.length; i++) {
          const row = rawData[i];
          // Skip totally empty rows
          if (row.every(c => !c || c.trim() === '')) {
            collectingRows = false;
            continue;
          }

          const firstCell = row[0] ? row[0].trim() : '';
          const fullRowString = row.join(' ').toLowerCase();

          // A. Detect Start of a Nomenclature Section (e.g. "Nomenclature 01...")
          if (firstCell.toLowerCase().startsWith('nomenclature')) {
            // Save previous group if exists
            if (currentGroup) {
              parsedGroups.push(currentGroup);
            }
            // Start new group
            currentGroup = {
              name: firstCell,
            };
            currentTableType = null;
            collectingRows = false;
            continue;
          }

          // B. Detect Table Type (Quantité vs Montant) based on row content
          if (fullRowString.includes('quantite') || fullRowString.includes('quantité')) {
            currentTableType = 'qty';
            collectingRows = false; // Next line will be headers
            continue;
          } else if (fullRowString.includes('montant') || fullRowString.includes('valeur') || fullRowString.includes('ca ')) {
            currentTableType = 'amount';
            collectingRows = false; // Next line will be headers
            continue;
          }

          // C. Process Data inside a Group
          if (currentGroup && currentTableType) {
            // Heuristic: Headers usually contain "Rang", "Code", "Libellé"
            // If we are not collecting rows yet, this line must be headers
            if (!collectingRows && (fullRowString.includes('rang') || fullRowString.includes('code') || fullRowString.includes('libell'))) {
              currentHeaders = row.map(c => c.trim()).filter(c => c !== '');
              collectingRows = true;
              // Init the table in the group
              if (currentTableType === 'qty') {
                currentGroup.qtyTable = { headers: currentHeaders, rows: [] };
              } else {
                currentGroup.amountTable = { headers: currentHeaders, rows: [] };
              }
              continue;
            }

            // Collect Data Rows
            if (collectingRows) {
              // Clean row data
              const cleanRow = row.map(c => c.trim());

              // Only add if it looks like data (e.g. starts with a number for Rank/Code, or at least isn't empty)
              // We accept rows where at least the first column is a digit (Rank)
              if (/^\d+$/.test(cleanRow[0])) {
                if (currentTableType === 'qty' && currentGroup.qtyTable) {
                  currentGroup.qtyTable.rows.push(cleanRow);
                } else if (currentTableType === 'amount' && currentGroup.amountTable) {
                  currentGroup.amountTable.rows.push(cleanRow);
                }
              } else {
                // If we encounter a row that doesn't look like data (and isn't empty), stop collecting
                collectingRows = false;
              }
            }
          }
        }
        // Push the last group
        if (currentGroup) {
          parsedGroups.push(currentGroup);
        }

        console.log('[DEBUG TOP10] Parsed groups:', parsedGroups.length);
        parsedGroups.forEach((g, idx) => {
          console.log(`[DEBUG TOP10] Group ${idx}:`, g.name,
            'Qty rows:', g.qtyTable?.rows.length || 0,
            'Amount rows:', g.amountTable?.rows.length || 0);
        });

        setGroups(parsedGroups);

      } catch (err) {
        console.error("Erreur parsing Top 10:", err);
        setError("Impossible de charger les données Top 10. Vérifiez que la feuille est accessible.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sheetId, selectedStore]);

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
          {STORES.map((store) => (
            <button
              key={store}
              onClick={() => setSelectedStore(store)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedStore === store
                  ? 'bg-white text-sky-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
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

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-center">
          {error}
        </div>
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
                {/* Quantity Table */}
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

                {/* Amount Table */}
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
  // Heuristic to find the best columns to display
  // 1. Rank (usually first col or named "Rang")
  // 2. Designation (named "Libellé", "Désignation", "Article")
  // 3. Value (named "Quantité", "Montant", "CA")

  const libelleIdx = headers.findIndex(h => {
    const t = h.toLowerCase();
    return t.includes('libell') || t.includes('désignation') || t.includes('designation') || t.includes('produit');
  });

  const valIdx = headers.findIndex(h => {
    const t = h.toLowerCase();
    if (type === 'qty') {
      return t.includes('qt') || t.includes('quant') || t.includes('nombre');
    } else {
      return t.includes('montant') || t.includes('valeur') || t === 'ca' || t === 'c.a.' || t.includes('chiffre');
    }
  });

  // Fallback indices if we can't find smart matches
  // Default: 0 (Rank), 2 (Libelle often), 4 (Value often) or just 0,1,2
  const indicesToShow = (libelleIdx !== -1 && valIdx !== -1)
    ? [0, libelleIdx, valIdx]
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