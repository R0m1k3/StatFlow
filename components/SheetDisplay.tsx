import React, { useState, useMemo, useEffect } from 'react';
import { SearchIcon, SortAscIcon, SortDescIcon, SortIcon } from './Icons';

interface SheetDisplayProps {
  data: Record<string, string>[];
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

const formatValue = (value: string, header: string) => {
    if (!value || value.trim() === '') return <span className="text-slate-400">-</span>;

    if (header.toLowerCase().includes('évolution')) {
        const num = parseFloat(value.replace(',', '.'));
        if (isNaN(num)) return value;
        const isPositive = num > 0;
        return (
            <span className={`flex items-center gap-1.5 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '▲' : '▼'}
                {value}
            </span>
        );
    }
    if (header.toLowerCase().includes('codein')) {
        return value.padStart(7, '0');
    }
    if (header.includes('%') || header.toLowerCase().includes('part')) {
        const num = parseFloat(value.replace(',', '.'));
        if (isNaN(num)) return value;
        return `${(num * 100).toFixed(2)}%`;
    }
    return value;
};


const SheetDisplay: React.FC<SheetDisplayProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const headers = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  const primaryKeyHeader = useMemo(() => {
      return headers.find(h => ['nomenclature', 'fournisseur', 'famille', 'libelle1'].includes(h.toLowerCase()));
  }, [headers]);

  const reorderedHeaders = useMemo(() => {
    if (!primaryKeyHeader) return headers;
    return [primaryKeyHeader, ...headers.filter(h => h !== primaryKeyHeader)];
  }, [headers, primaryKeyHeader]);

  const processedData = useMemo(() => {
    let filteredData = [...data];

    if (searchTerm) {
      filteredData = filteredData.filter(row =>
        Object.values(row).some(value =>
          // FIX: Check if value is a string before calling toLowerCase
          typeof value === 'string' && value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig !== null) {
      filteredData.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        const aNum = parseFloat(aVal?.replace(',', '.'));
        const bNum = parseFloat(bVal?.replace(',', '.'));

        let comparison = 0;
        if (aVal && bVal && !isNaN(aNum) && !isNaN(bNum)) {
            comparison = aNum > bNum ? 1 : -1;
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

    const autresKeys = headers.filter(h => !groupedKeys.has(h) && (h.includes('CA') || h.includes('%') || h.includes('QTE')));
    if (autresKeys.length > 0) {
      groups.push({ name: 'Consolidé', colspan: autresKeys.length, keys: autresKeys });
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
  const primaryKeyIsNonGrouped = primaryKeyHeader && nonGroupedHeaders.includes(primaryKeyHeader);
  const otherNonGroupedHeaders = useMemo(() => {
      if (primaryKeyIsNonGrouped) {
          return nonGroupedHeaders.filter(h => h !== primaryKeyHeader);
      }
      return nonGroupedHeaders;
  }, [nonGroupedHeaders, primaryKeyHeader, primaryKeyIsNonGrouped]);


  const displayedHeaders = useMemo(() => {
    if (columnGroups.length > 0) {
        const ordered: string[] = [];
        if (primaryKeyIsNonGrouped && primaryKeyHeader) {
            ordered.push(primaryKeyHeader);
            ordered.push(...columnGroups.flatMap(g => g.keys));
            ordered.push(...otherNonGroupedHeaders);
        } else {
            // Comportement précédent si pas de clé primaire ou si la clé primaire est groupée
            ordered.push(...nonGroupedHeaders);
            ordered.push(...columnGroups.flatMap(g => g.keys));
        }
        return ordered;
    }
    return reorderedHeaders;
  }, [columnGroups, reorderedHeaders, primaryKeyHeader, primaryKeyIsNonGrouped, nonGroupedHeaders, otherNonGroupedHeaders]);


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
              {displayedHeaders.map(header => (
                <div key={header} className="grid grid-cols-2 gap-2 border-b border-slate-100 py-2.5 last:border-b-0">
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
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            {columnGroups.length > 0 ? (
              <>
                 <tr>
                    {primaryKeyIsNonGrouped && primaryKeyHeader && (
                        <th rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 align-bottom">
                           <button onClick={() => requestSort(primaryKeyHeader)} className="flex items-center gap-1.5 group">
                             {primaryKeyHeader}
                             <span className="opacity-30 group-hover:opacity-100 transition-opacity">
                                {sortConfig?.key === primaryKeyHeader ? (sortConfig.direction === 'ascending' ? <SortAscIcon /> : <SortDescIcon />) : <SortIcon />}
                             </span>
                           </button>
                        </th>
                    )}
                    {columnGroups.map(group => <th key={group.name} colSpan={group.colspan} className={`px-6 py-2 text-center text-sm font-bold uppercase border-b ${getGroupHeaderStyle(group.name)}`}>{group.name}</th>)}
                    {otherNonGroupedHeaders.map(h => 
                        <th key={h} rowSpan={2} className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200 align-bottom">
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
                        <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                    {reorderedHeaders.map(header => (
                        <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
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
                {displayedHeaders.map(header => (
                  <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
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

export default SheetDisplay;