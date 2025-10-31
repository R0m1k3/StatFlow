import React, { useMemo, useState, useEffect } from 'react';
import Spinner from './Spinner';
import { SortIcon, ArrowUpIcon, ArrowDownIcon, SearchIcon } from './Icons';

interface SheetDisplayProps {
  data: string[][] | null;
  loading: boolean;
  sheetName: string;
  sheetId: string;
  hiddenColumns?: string[];
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


const SheetDisplay: React.FC<SheetDisplayProps> = ({ data, loading, sheetName, sheetId, hiddenColumns }) => {
  const [sortConfig, setSortConfig] = useState<{ key: number; direction: 'ascending' | 'descending' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    // Reset sort and search when sheet changes
    setSortConfig(null);
    setSearchTerm('');
  }, [sheetName]);

  const processedData = useMemo(() => {
    if (!data || data.length < 1) {
      return null;
    }

    let dataToProcess = data;
    if (sheetId === '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374' && hiddenColumns && hiddenColumns.length > 0) {
        const header = data[0];
        const columnsToRemove = hiddenColumns.map(c => c.toLowerCase().trim());
        const indicesToRemove = header.reduce((acc: number[], col, index) => {
            if (columnsToRemove.includes(col.toLowerCase().trim())) {
                acc.push(index);
            }
            return acc;
        }, []);

        if (indicesToRemove.length > 0) {
            dataToProcess = data.map(row => 
                row.filter((_, index) => !indicesToRemove.includes(index))
            );
        }
    }

    const originalHeader = dataToProcess[0] || [];
    let primaryColumnIndex: number | null = null;
    const houdemontIndices: number[] = [];
    const frouardIndices: number[] = [];
    const otherIndices: number[] = [];
    
    let primaryColumnName = 'nomenclature'; // default
    if (sheetId === '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374') {
        primaryColumnName = 'libelle1';
    } else if (sheetId === '1m92J7LubktT6U91gq9bFhNmuYZxY0yw9jgSFMze9lY4') {
        primaryColumnName = 'fournisseur';
    }

    originalHeader.forEach((header, index) => {
      const lowerHeader = header.toLowerCase().trim();
      if (lowerHeader === primaryColumnName) {
        primaryColumnIndex = index;
      } else if (lowerHeader.includes('houdemont')) {
        houdemontIndices.push(index);
      } else if (lowerHeader.includes('frouard')) {
        frouardIndices.push(index);
      } else {
        otherIndices.push(index);
      }
    });

    const newOrder: number[] = [];
    if (primaryColumnIndex !== null) {
      newOrder.push(primaryColumnIndex);
    }
    const otherCols = [...houdemontIndices, ...frouardIndices, ...otherIndices].filter(i => i !== primaryColumnIndex);
    newOrder.push(...otherCols);
    
    const reorderedData = dataToProcess.map(row => {
      const fullRow = [...row];
      while (fullRow.length < originalHeader.length) {
          fullRow.push('');
      }
      return newOrder.map(index => fullRow[index] ?? '');
    });

    return {
      reorderedData,
      primaryColumnExists: primaryColumnIndex !== null,
      houdemontCount: houdemontIndices.length,
      frouardCount: frouardIndices.length,
      otherCount: otherIndices.length,
    };
  }, [data, sheetId, hiddenColumns]);

  const handleSortClick = (columnIndex: number) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === columnIndex && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key: columnIndex, direction });
  };
  
  const filteredAndSortedRows = useMemo(() => {
    const rowsToProcess = processedData?.reorderedData.slice(1) || [];
    
    const filteredRows = searchTerm
      ? rowsToProcess.filter(row =>
          row.some(cell =>
            cell.toString().toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      : rowsToProcess;

    if (!sortConfig && !isMobile) {
      return filteredRows;
    }

    const dataToSort = [...filteredRows];
    
    if (sortConfig) {
        dataToSort.sort((a, b) => {
          const aVal = a[sortConfig.key];
          const bVal = b[sortConfig.key];
          
          const isNumeric = (val: string) => !isNaN(parseFloat(val)) && isFinite(val as any);
    
          if (isNumeric(aVal) && isNumeric(bVal)) {
            return sortConfig.direction === 'ascending' ? parseFloat(aVal) - parseFloat(bVal) : parseFloat(bVal) - parseFloat(aVal);
          }
    
          const aValClean = aVal ? aVal.toString().trim() : '';
          const bValClean = bVal ? bVal.toString().trim() : '';
    
          if (aValClean < bValClean) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (aValClean > bValClean) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
    }

    return dataToSort;
  }, [processedData, sortConfig, isMobile, searchTerm]);


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Spinner />
        <p className="mt-4 text-lg">Chargement des données pour "{sheetName}"...</p>
      </div>
    );
  }

  if (!processedData) {
    return (
      <div className="text-center h-64 flex items-center justify-center bg-white rounded-lg border border-gray-200">
        <p className="text-gray-500">
            {sheetName ? `Aucune donnée à afficher pour "${sheetName}".` : 'Veuillez sélectionner une feuille pour afficher les données.'}
        </p>
      </div>
    );
  }

  const { reorderedData, primaryColumnExists, houdemontCount, frouardCount, otherCount } = processedData;
  const header = reorderedData[0] || [];
  
  const searchBar = (
    <div className="mb-6">
      <label htmlFor="table-search" className="sr-only">Rechercher</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="search"
          id="table-search"
          className="w-full appearance-none bg-white border border-gray-300 text-gray-900 py-3 px-4 pl-11 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all duration-200"
          placeholder="Rechercher dans les données..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Rechercher dans les données"
        />
      </div>
    </div>
  );

  // Mobile Card View
  if (isMobile) {
    return (
      <div>
        {searchBar}
        <div className="space-y-4">
          {filteredAndSortedRows.map((row, rowIndex) => (
            <div key={rowIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              {row.map((cell, cellIndex) => {
                const columnHeader = header[cellIndex]?.toLowerCase().trim();
                let formattedCell = cell;

                if (columnHeader === 'codein' && cell && /^\d+$/.test(cell)) {
                  formattedCell = cell.padStart(6, '0');
                } else if (
                  sheetId === '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374' &&
                  columnHeader === 'taux de marge %'
                ) {
                  const numValue = parseFloat(cell);
                  if (!isNaN(numValue)) {
                    formattedCell = `${(numValue * 100).toFixed(2)}%`;
                  }
                }

                if (!header[cellIndex] || !formattedCell || formattedCell.trim() === '') {
                  return null;
                }

                const isEvolutionColumn = header[cellIndex]?.trim().includes('Évolution');
                let cellContent: React.ReactNode = formattedCell;

                if (isEvolutionColumn) {
                  const numValue = parseFloat(String(formattedCell).replace(/[\s%€$]/g, '').replace(',', '.'));
                  if (!isNaN(numValue)) {
                    if (numValue > 0) {
                      cellContent = (
                        <span className="flex items-center justify-end font-semibold text-green-600">
                          <ArrowUpIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>{formattedCell}</span>
                        </span>
                      );
                    } else if (numValue < 0) {
                      cellContent = (
                        <span className="flex items-center justify-end font-semibold text-red-600">
                          <ArrowDownIcon className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>{formattedCell}</span>
                        </span>
                      );
                    }
                  }
                }

                return (
                  <div key={cellIndex} className={`flex justify-between items-start text-sm py-2 ${cellIndex < row.length -1 ? 'border-b border-gray-200' : ''}`}>
                    <span className="font-medium text-gray-500 capitalize flex-shrink-0 pr-4">{header[cellIndex]}:</span>
                    <div className="text-gray-900 text-right">{cellContent}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {filteredAndSortedRows.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200">
              {searchTerm 
                ? `Aucun résultat trouvé pour "${searchTerm}".`
                : `Aucune donnée disponible dans cette feuille.`
              }
            </div>
          )}
        </div>
      </div>
    );
  }


  // Desktop Table View
  const showGroupHeaders = houdemontCount > 0 || frouardCount > 0;
  return (
    <div>
      {searchBar}
      <div className="w-full overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {showGroupHeaders && (
              <tr className="border-b border-gray-200">
                {primaryColumnExists && (
                  <th 
                      colSpan={1} 
                      scope="colgroup"
                      className="px-6 py-2 text-center text-sm font-semibold text-gray-800 bg-gray-100"
                  >
                    Détails
                  </th>
                )}
                {houdemontCount > 0 && (
                  <th 
                      colSpan={houdemontCount} 
                      scope="colgroup"
                      className="px-6 py-2 text-center text-sm font-semibold text-sky-900 bg-sky-100"
                  >
                    Houdemont
                  </th>
                )}
                {frouardCount > 0 && (
                  <th 
                      colSpan={frouardCount}
                      scope="colgroup"
                      className="px-6 py-2 text-center text-sm font-semibold text-indigo-900 bg-indigo-100"
                  >
                    Frouard
                  </th>
                )}
                {otherCount > 0 && (
                  <th 
                      colSpan={otherCount} 
                      scope="colgroup"
                      className="px-6 py-2 text-center text-sm font-semibold text-gray-800 bg-gray-100"
                  >
                    Autres
                  </th>
                )}
              </tr>
            )}
            <tr>
              {header.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer group transition-colors duration-200 hover:bg-gray-100"
                  onClick={() => handleSortClick(index)}
                >
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    <SortIcon
                      sortDirection={sortConfig?.key === index ? sortConfig.direction : 'none'}
                      className={`h-4 w-4 ml-2 transition-all duration-200 ${
                          sortConfig?.key === index 
                          ? 'text-sky-600 opacity-100' 
                          : 'text-gray-400 opacity-0 group-hover:opacity-100'
                      }`}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                {row.map((cell, cellIndex) => {
                  const columnHeader = header[cellIndex]?.toLowerCase().trim();
                  let formattedCell = cell;

                  if (columnHeader === 'codein' && cell && /^\d+$/.test(cell)) {
                    formattedCell = cell.padStart(6, '0');
                  } else if (
                    sheetId === '1BZD599SY1q3OoZWjlAPUYysMEbWgwsOH8IZrchDx374' &&
                    columnHeader === 'taux de marge %'
                  ) {
                    const numValue = parseFloat(cell);
                    if (!isNaN(numValue)) {
                      formattedCell = `${(numValue * 100).toFixed(2)}%`;
                    }
                  }

                  return (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {(() => {
                          const isEvolutionColumn = header[cellIndex]?.trim().includes('Évolution');
                          if (!isEvolutionColumn) return formattedCell;
                          
                          const numValue = parseFloat(String(formattedCell).replace(/[\s%€$]/g, '').replace(',', '.'));
                          if (isNaN(numValue)) return formattedCell;

                          if (numValue > 0) {
                            return (
                              <span className="flex items-center font-semibold text-green-600">
                                <ArrowUpIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                <span>{formattedCell}</span>
                              </span>
                            );
                          }
                          if (numValue < 0) {
                            return (
                              <span className="flex items-center font-semibold text-red-600">
                                <ArrowDownIcon className="h-4 w-4 mr-1.5 flex-shrink-0" />
                                <span>{formattedCell}</span>
                              </span>
                            );
                          }
                          return formattedCell;
                        })()}
                      </td>
                  );
                })}
              </tr>
            ))}
            {filteredAndSortedRows.length === 0 && (
              <tr>
                  <td colSpan={header.length} className="text-center py-10 text-gray-500">
                    {searchTerm 
                      ? `Aucun résultat trouvé pour "${searchTerm}".`
                      : `Aucune donnée disponible dans cette feuille.`
                    }
                  </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SheetDisplay;
