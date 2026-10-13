import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Table, FileSpreadsheet, ChevronLeft, ChevronRight, Settings2, SlidersHorizontal, Split } from 'lucide-react';
import { exportToExcel, exportToCsv } from '../utils/fileParser';
import { 
  pivotWordsAsRows, 
  pivotDocsAsRows, 
  aggregateGrandTotal, 
  pivotWordsByMetadata, 
  pivotMetadataByWords 
} from '../utils/pivot';

export default function ResultsView({ results, queryName }) {
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('grand_total'); // 'grand_total', 'long', 'pivot_meta_words', 'pivot_meta_docs', 'pivot_words', 'pivot_docs'
  const [userSelectedMetaCol, setUserSelectedMetaCol] = useState('');
  const [explodeSlash, setExplodeSlash] = useState(true);
  const [sortConfig, setSortConfig] = useState(null);
  const rowsPerPage = 50;

  // Extract all available metadata columns from the corpus data
  const availableMetaColumns = useMemo(() => {
    if (!results || results.length === 0) return [];
    const nonMeta = new Set(['word', 'freq', 'total_words', 'dhlabid']);
    const sample = results[0];
    return Object.keys(sample).filter(k => !nonMeta.has(k));
  }, [results]);

  // Set a smart default metadata column (prioritize year/år, then subject/emne, etc.)
  const selectedMetaCol = useMemo(() => {
    if (userSelectedMetaCol && availableMetaColumns.includes(userSelectedMetaCol)) {
      return userSelectedMetaCol;
    }
    if (availableMetaColumns.length > 0) {
      const yearCol = availableMetaColumns.find(c => /year|år/i.test(c));
      const subjectCol = availableMetaColumns.find(c => /subject|emne|sjanger|genre/i.test(c));
      return yearCol || subjectCol || availableMetaColumns[0];
    }
    return '';
  }, [availableMetaColumns, userSelectedMetaCol]);

  // Derive metadata pivot results if in metadata mode
  const metaPivotResult = useMemo(() => {
    if (viewMode === 'pivot_meta_words') {
      return pivotWordsByMetadata(results, selectedMetaCol, explodeSlash);
    }
    if (viewMode === 'pivot_meta_docs') {
      return pivotMetadataByWords(results, selectedMetaCol, explodeSlash);
    }
    return null;
  }, [results, viewMode, selectedMetaCol, explodeSlash]);

  // Derive data based on view mode
  const activeData = useMemo(() => {
    switch (viewMode) {
      case 'grand_total':
        return aggregateGrandTotal(results);
      case 'pivot_meta_words':
        return metaPivotResult?.data || [];
      case 'pivot_meta_docs':
        return metaPivotResult?.data || [];
      case 'pivot_words':
        return pivotWordsAsRows(results);
      case 'pivot_docs':
        return pivotDocsAsRows(results);
      case 'long':
      default:
        return results;
    }
  }, [results, viewMode, metaPivotResult]);

  // Handle mode change
  const handleModeChange = (e) => {
    setViewMode(e.target.value);
    setSortConfig(null);
    setPage(0);
  };

  const handleMetaColChange = (e) => {
    setUserSelectedMetaCol(e.target.value);
    setSortConfig(null);
    setPage(0);
  };

  const handleExplodeToggle = () => {
    setExplodeSlash(prev => !prev);
    setSortConfig(null);
    setPage(0);
  };

  // Extract headers dynamically
  const headers = useMemo(() => {
    if (activeData.length === 0) return [];

    if (viewMode === 'pivot_meta_words') {
      return ['word', ...(metaPivotResult?.columns || [])];
    } else if (viewMode === 'pivot_meta_docs') {
      return [selectedMetaCol, ...(metaPivotResult?.columns || [])];
    } else if (viewMode === 'pivot_words') {
      const allKeys = Object.keys(activeData[0]);
      return ['word', ...allKeys.filter(k => k !== 'word')];
    } else if (viewMode === 'pivot_docs') {
      const allKeys = Object.keys(activeData[0]);
      const metadata = ['dhlabid', 'urn', 'title', 'authors', 'year'];
      const availableMeta = metadata.filter(k => allKeys.includes(k));
      const otherMeta = allKeys.filter(k => !metadata.includes(k) && isNaN(activeData[0][k]) && k !== 'dhlabid');
      const words = allKeys.filter(k => !availableMeta.includes(k) && !otherMeta.includes(k));
      return [...availableMeta, ...otherMeta, ...words];
    } else if (viewMode === 'grand_total') {
      return ['word', 'total_freq', 'docs_count'];
    } else {
      // Long mode
      const allKeys = Object.keys(activeData[0]);
      const prioritized = ['dhlabid', 'word', 'freq', 'total_words'];
      const others = allKeys.filter(k => !prioritized.includes(k));
      return [...prioritized, ...others];
    }
  }, [activeData, viewMode, selectedMetaCol, metaPivotResult]);

  const numericColumns = useMemo(() => {
    return headers.reduce((acc, header) => {
      const values = activeData
        .map((row) => row[header])
        .filter((value) => value !== null && value !== undefined && value !== '');

      acc[header] = values.length > 0 && values.every((value) => !Number.isNaN(Number(value)));
      return acc;
    }, {});
  }, [activeData, headers]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return activeData;

    const { key, direction } = sortConfig;
    const sortMultiplier = direction === 'asc' ? 1 : -1;

    return [...activeData].sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined || aValue === '') return 1;
      if (bValue === null || bValue === undefined || bValue === '') return -1;

      if (numericColumns[key]) {
        return (Number(aValue) - Number(bValue)) * sortMultiplier;
      }

      return String(aValue).localeCompare(String(bValue), 'no') * sortMultiplier;
    });
  }, [activeData, numericColumns, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const currentPage = totalPages > 0 ? Math.min(page, totalPages - 1) : 0;
  const displayData = useMemo(() => {
    return sortedData.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);
  }, [currentPage, sortedData]);

  const handleSort = (header) => {
    setSortConfig((currentSort) => {
      if (currentSort?.key === header) {
        return {
          key: header,
          direction: currentSort.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key: header,
        direction: numericColumns[header] ? 'desc' : 'asc',
      };
    });
    setPage(0);
  };

  const getNextSortDirection = (header) => {
    if (sortConfig?.key === header) {
      return sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }

    return numericColumns[header] ? 'desc' : 'asc';
  };

  const getSortActionLabel = (header) => {
    const nextDirection = getNextSortDirection(header) === 'asc' ? 'stigende' : 'synkende';
    return `Sorter etter ${header} ${nextDirection}`;
  };

  const isMetaMode = viewMode === 'pivot_meta_words' || viewMode === 'pivot_meta_docs';

  const handleExportExcel = () => {
    const metaSuffix = isMetaMode ? `_${selectedMetaCol}` : '';
    exportToExcel(sortedData, `korpus_${viewMode}${metaSuffix}_${queryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
  };

  const handleExportCsv = () => {
    const metaSuffix = isMetaMode ? `_${selectedMetaCol}` : '';
    exportToCsv(sortedData, `korpus_${viewMode}${metaSuffix}_${queryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Action bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center text-gray-700">
              <Table className="mr-2 h-5 w-5 text-blue-500" />
              <span className="font-medium">Fant {activeData.length.toLocaleString('no-NO')} rader</span>
            </div>
            
            <div className="h-5 w-px bg-gray-300 hidden sm:block"></div>
            
            {/* View Mode Selector */}
            <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 px-2 py-1">
              <Settings2 className="h-4 w-4 text-gray-500 mr-2" />
              <select 
                value={viewMode} 
                onChange={handleModeChange}
                className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none pr-6"
              >
                <option value="grand_total">Totalfrekvens (Grand Total)</option>
                <option value="pivot_meta_words">Krysstabell (Ord x Metadata)</option>
                <option value="pivot_meta_docs">Krysstabell (Metadata x Ord)</option>
                <option value="pivot_words">Krysstabell (Ord x Dokument)</option>
                <option value="pivot_docs">Krysstabell (Dokument x Ord)</option>
                <option value="long">Standard (Langformat)</option>
              </select>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleExportCsv}
              className="flex items-center px-3.5 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Download className="mr-1.5 h-4 w-4 text-gray-500" />
              CSV
            </button>
            <button 
              onClick={handleExportExcel}
              className="flex items-center px-3.5 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Metadata Configuration Bar when in Metadata Cross-tabulation mode */}
        {isMetaMode && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100 text-sm bg-blue-50/50 -mx-4 -mb-4 p-4 rounded-b-lg">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-gray-700">Metadatakolonne:</span>
              <select
                value={selectedMetaCol}
                onChange={handleMetaColChange}
                className="bg-white border border-gray-300 rounded-md px-3 py-1 font-medium text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {availableMetaColumns.length === 0 ? (
                  <option value="">Ingen metadatakolonner funnet</option>
                ) : (
                  availableMetaColumns.map(col => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))
                )}
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-700 hover:text-gray-900">
              <input
                type="checkbox"
                checked={explodeSlash}
                onChange={handleExplodeToggle}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
              />
              <span className="flex items-center gap-1 text-sm font-medium">
                <Split className="h-3.5 w-3.5 text-gray-500" />
                Eksploder flerverdier skilt med <code className="bg-gray-200 px-1 py-0.5 rounded text-xs text-gray-800">/</code> (f.eks. emneord)
              </span>
            </label>
          </div>
        )}

      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold">
              <tr>
                {headers.map(header => (
                  <th
                    key={header}
                    className="px-6 py-3 uppercase tracking-wider whitespace-nowrap"
                    aria-sort={sortConfig?.key === header ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(header)}
                      aria-label={getSortActionLabel(header)}
                      className="flex items-center gap-2 cursor-pointer font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      <span>{header}</span>
                      {sortConfig?.key === header ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-blue-600" aria-hidden="true" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                      )}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {headers.map(header => (
                    <td key={header} className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {row[header] !== null && row[header] !== undefined ? row[header].toString() : ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <span className="text-sm text-gray-700">
              Viser {currentPage * rowsPerPage + 1} til {Math.min((currentPage + 1) * rowsPerPage, sortedData.length)} av {sortedData.length} rader
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
                disabled={currentPage === totalPages - 1}
                className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
