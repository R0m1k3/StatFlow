
import React, { useState, useMemo, useEffect } from 'react';
import { SearchIcon, SortAscIcon, SortDescIcon, SortIcon } from './Icons';

interface SheetDisplayProps {
  data: Record<string, string>[];
  priorityColumns?: string[];
}

type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    window.addEventListener('resize', listener);
    return () => window.removeEventListener('resize', listener);
  }, [matches, query]);
  return matches;
};

// Utility helper for cleaning and parsing numbers (handles "1 000,00 %", "120 €" and non-breaking spaces)
const parseFrenchNumber = (value: string): number => {
  if (!value) return 0;
  // Remove spaces, non-breaking spaces, % and currency symbols
  const clean = value.replace(/[\s\u00A0%€$]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};

const formatValue = (value: string, header: string) => {
  if (!value || value.trim() === '') return <span className="text-slate-400">-</span>;

  const h = header.toLowerCase();

  if (h.includes('évolution')) {
    const num = parseFrenchNumber(value);
    // Check if it looks like a number to apply color
    if (/[0-9]/.test(value)) {
      const isPositive = num > 0;
      // If strictly 0, usually neutral, but let's keep it simple
      const isZero = num === 0;
      let colorClass = 'text-slate-600';
      if (!isZero) colorClass = isPositive ? 'text-green-600' : 'text-red-600';

      return (
        <span className={`flex items-center gap-1.5 font-medium ${colorClass}`}>
          {!isZero && (isPositive ? '▲' : '▼')}
          {value}
        </span>
      );
    }
    return value;
  }
  if (h.includes('codein')) {
    return value.padStart(7, '0');
  }
  // Auto-format percentages if they are raw numbers < 1 and header suggests %
  if ((header.includes('%') || h.includes('part')) && !value.includes('%')) {
    const num = parseFrenchNumber(value);
    if (!isNaN(num) && Math.abs(num) <= 1) {
      return `${(num * 100).toFixed(2)} %`;
    }
  }
  return value;
};


const SheetDisplay: React.FC<SheetDisplayProps> = ({ data, priorityColumns = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const headers = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  // Trouve les colonnes prioritaires qui existent dans les données (case-insensitive)
  const matchedPriorityColumns = useMemo(() => {
    return priorityColumns
      .map(pc => headers.find(h => h.toLowerCase() === pc.toLowerCase()))
      .filter((h): h is string => h !== undefined);
  }, [headers, priorityColumns]);

  const primaryKeyHeader = useMemo(() => {
    // Si on a des colonnes prioritaires, on ne cherche pas de primaryKey supplémentaire
    if (matchedPriorityColumns.length > 0) return undefined;
    return headers.find(h => ['nomenclature', 'fournisseur', 'famille', 'libelle', 'libellé'].includes(h.toLowerCase()));
  }, [headers, matchedPriorityColumns]);

  const reorderedHeaders = useMemo(() => {
    // Colonnes prioritaires en premier
    if (matchedPriorityColumns.length > 0) {
      const remaining = headers.filter(h => !matchedPriorityColumns.includes(h));
      return [...matchedPriorityColumns, ...remaining];
    }
    // Sinon, comportement par défaut avec primaryKeyHeader
    if (!primaryKeyHeader) return headers;
    return [primaryKeyHeader, ...headers.filter(h => h !== primaryKeyHeader)];
  }, [headers, matchedPriorityColumns, primaryKeyHeader]);

  const processedData = useMemo(() => {
    let filteredData = [...data];

    if (searchTerm) {
      filteredData = filteredData.filter(row =>
        Object.values(row).some(value =>
          typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        const aNum = parseFrenchNumber(aVal);
        const bNum = parseFrenchNumber(bVal);

        // Check if both values act as numbers
        const aHasDigits = /[0-9]/.test(aVal);
        const bHasDigits = /[0-9]/.test(bVal);

        // We consider them numbers if parseFrenchNumber returned a valid number AND they contain digits
        // exception: "0" is valid.
        const aIsNum = !isNaN(aNum) && aHasDigits;
        const bIsNum = !isNaN(bNum) && bHasDigits;

        let comparison = 0;
        if (aIsNum && bIsNum) {
          comparison = aNum - bNum;
        } else {
          comparison = (aVal || '').localeCompare(bVal || '', 'fr', { numeric: true });
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return filteredData;
  }, [data, searchTerm, sortConfig]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const columnGroups = useMemo(() => {
    const groups: { name: string; colspan: number; keys: string[] }[] = [];
    const groupedKeys = new Set<string>();

    const houdemontKeys = headers.filter(h => h.toLowerCase().includes('houdemont'));
    if (houdemontKeys.length > 0) {
      groups.push({ name: 'Houdemont', colspan: houdemontKeys.length, keys: houdemontKeys });
      houdemontKeys.forEach(k => groupedKeys.add(k));
    }

    const frouardKeys = headers.filter(h => h.toLowerCase().includes('frouard'));
    if (frouardKeys.length > 0) {
      groups.push({ name: 'Frouard', colspan: frouardKeys.length, keys: frouardKeys });
      frouardKeys.forEach(k => groupedKeys.add(k));
    }

    // Consolidé/Global : often contains CA, Marge, etc without specific location
    // We filter out keys already grouped
    const autresKeys = headers.filter(h => !groupedKeys.has(h) && (h.startsWith('CA') || h.startsWith('Marge') || h.includes('%') || h.includes('Qte') || h.includes('Evolution')));

    // Only create a "Global" group if we have location groups to contrast with
    if ((houdemontKeys.length > 0 || frouardKeys.length > 0) && autresKeys.length > 0) {
      groups.push({ name: 'Global', colspan: autresKeys.length, keys: autresKeys });
      autresKeys.forEach(k => groupedKeys.add(k));
    }

    return groups;
  }, [headers]);

  const getGroupHeaderStyle = (groupName: string) => {
    switch (groupName.toLowerCase()) {
      case 'houdemont':
        return 'text-teal-800 border-teal-200 bg-teal-100/75';
      case 'frouard':
        return 'text-indigo-800 border-indigo-200 bg-indigo-100/75';
      default:
        return 'text-sky-800 border-sky-200 bg-sky-100/75';
    }
  };

  const allGroupedKeysSet = useMemo(() => new Set(columnGroups.flatMap(g => g.keys)), [columnGroups]);
  const nonGroupedHeaders = useMemo(() => reorderedHeaders.filter(h => !allGroupedKeysSet.has(h)), [reorderedHeaders, allGroupedKeysSet]);
  const primaryKeyIsNonGrouped = !!(primaryKeyHeader && nonGroupedHeaders.includes(primaryKeyHeader));
  const otherNonGroupedHeaders = useMemo(() => {
    if (primaryKeyIsNonGrouped) {
      return nonGroupedHeaders.filter(h => h !== primaryKeyHeader);
    }
    return nonGroupedHeaders;
  }, [nonGroupedHeaders, primaryKeyHeader, primaryKeyIsNonGrouped]);


  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-10 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 bg-white"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-slate-400" />
          </div>
        </div>
        <div className="space-y-4">
          {processedData.map((row, index) => (
            <div key={index} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
              {displayedHeaders(columnGroups, reorderedHeaders, primaryKeyHeader, primaryKeyIsNonGrouped, nonGroupedHeaders, otherNonGroupedHeaders, matchedPriorityColumns).map((header, index) => (
                <div key={header} className={`grid grid-cols-2 gap-2 border-b border-slate-100 py-2.5 last:border-b-0 ${index === 0 ? 'sticky top-0 bg-white z-10' : ''}`}>
                  <span className="font-medium text-slate-600 text-sm break-words">{header}</span>
                  <span className="text-right text-sm text-slate-800 break-words">{formatValue(row[header], header)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Rechercher dans le tableau..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/3 p-2 pl-10 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-slate-400" />
        </div>
      </div>
      <div className="overflow-auto max-h-[70vh]">
        <table className="min-w-full divide-y divide-slate-200 border-separate border-spacing-0">
          <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm">
            {columnGroups.length > 0 ? (
              <>
                <tr>
                  {/* Colonnes prioritaires non groupées (AVANT les groupes) */}
                  {matchedPriorityColumns.filter(h => otherNonGroupedHeaders.includes(h)).map((h, index) => (
                    <th key={h} rowSpan={2} className={`px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 align-bottom bg-slate-50 ${index === 0 ? 'sticky left-0 z-30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}>
                      <button onClick={() => requestSort(h)} className="flex items-center gap-1.5 group">
                        {h}
                        <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === h ? (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon />}
                        </span>
                      </button>
                    </th>
                  ))}

                  {primaryKeyIsNonGrouped && primaryKeyHeader && (
                    <th rowSpan={2} className={`px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 align-bottom bg-slate-50 ${matchedPriorityColumns.length === 0 ? 'sticky left-0 z-30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}>
                      <button onClick={() => requestSort(primaryKeyHeader)} className="flex items-center gap-1.5 group">
                        {primaryKeyHeader}
                        <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === primaryKeyHeader ? (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon />}
                        </span>
                      </button>
                    </th>
                  )}
                  {columnGroups.map(group => <th key={group.name} colSpan={group.colspan} className={`px-6 py-2 text-center text-sm font-bold uppercase border-b ${getGroupHeaderStyle(group.name)}`}>{group.name}</th>)}

                  {/* Autres colonnes non groupées (APRÈS les groupes) */}
                  {otherNonGroupedHeaders.filter(h => !matchedPriorityColumns.includes(h)).map(h =>
                    <th key={h} rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 align-bottom bg-slate-50">
                      <button onClick={() => requestSort(h)} className="flex items-center gap-1.5 group">
                        {h}
                        <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === h ? (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon />}
                        </span>
                      </button>
                    </th>
                  )}
                </tr>
                <tr>
                  {columnGroups.flatMap(g => g.keys).map(header => (
                    <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-200">
                      <button onClick={() => requestSort(header)} className="flex items-center gap-1.5 group">
                        <span>{header}</span>
                        <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === header ? (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon />}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </>
            ) : (
              <tr>
                {reorderedHeaders.map((header, index) => (
                  <th key={header} scope="col" className={`px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 bg-slate-50 ${index === 0 ? 'sticky left-0 z-30 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}>
                    <button onClick={() => requestSort(header)} className="flex items-center gap-1.5 group">
                      <span>{header}</span>
                      <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === header ? (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon />}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {processedData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/75 transition-colors">
                {displayedHeaders(columnGroups, reorderedHeaders, primaryKeyHeader, primaryKeyIsNonGrouped, nonGroupedHeaders, otherNonGroupedHeaders, matchedPriorityColumns).map((header, index) => (
                  <td key={header} className={`px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${index === 0 ? 'sticky left-0 z-10 bg-white border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}`}>
                    {formatValue(row[header], header)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function displayedHeaders(
  columnGroups: { keys: string[] }[],
  reorderedHeaders: string[],
  primaryKeyHeader: string | undefined,
  primaryKeyIsNonGrouped: boolean | undefined,
  nonGroupedHeaders: string[],
  otherNonGroupedHeaders: string[],
  priorityColumns: string[] = []
) {
  // Si on a des colonnes prioritaires, les mettre en premier
  if (priorityColumns.length > 0) {
    const remaining = reorderedHeaders.filter(h => !priorityColumns.includes(h));
    return [...priorityColumns, ...remaining];
  }

  if (columnGroups.length > 0) {
    const ordered: string[] = [];
    if (primaryKeyIsNonGrouped && primaryKeyHeader) {
      ordered.push(primaryKeyHeader);
      ordered.push(...columnGroups.flatMap(g => g.keys));
      ordered.push(...otherNonGroupedHeaders);
    } else {
      ordered.push(...columnGroups.flatMap(g => g.keys));
      ordered.push(...nonGroupedHeaders);
    }
    return ordered;
  }
  return reorderedHeaders;
}

export default SheetDisplay;
