import React, { useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Table, FileSpreadsheet, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { exportToExcel, exportToCsv } from '../utils/fileParser';
import { pivotWordsAsRows, pivotDocsAsRows, aggregateGrandTotal } from '../utils/pivot';

export default function ResultsView({ results, queryName }) {
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState('grand_total'); // 'long', 'grand_total', 'pivot_words', 'pivot_docs'
  const [sortConfig, setSortConfig] = useState(null);
  const rowsPerPage = 50;

  // Derive data based on view mode
  const activeData = useMemo(() => {
    switch (viewMode) {
      case 'grand_total':
        return aggregateGrandTotal(results);
      case 'pivot_words':
        return pivotWordsAsRows(results);
      case 'pivot_docs':
        return pivotDocsAsRows(results);
      case 'long':
      default:
        return results;
    }
  }, [results, viewMode]);

  // Handle mode change
  const handleModeChange = (e) => {
    setViewMode(e.target.value);
    setSortConfig(null);
    setPage(0);
  };

  // Extract headers dynamically
  const headers = useMemo(() => {
    if (activeData.length === 0) return [];
    const allKeys = Object.keys(activeData[0]);
    
    if (viewMode === 'pivot_words') {
      return ['word', ...allKeys.filter(k => k !== 'word')];
    } else if (viewMode === 'pivot_docs') {
      // Prioritize dhlabid and metadata, then words
      const metadata = ['dhlabid', 'urn', 'title', 'authors', 'year']; // Common metadata fields
      const availableMeta = metadata.filter(k => allKeys.includes(k));
      const otherMeta = allKeys.filter(k => !metadata.includes(k) && isNaN(activeData[0][k]) && k !== 'dhlabid');
      const words = allKeys.filter(k => !availableMeta.includes(k) && !otherMeta.includes(k));
      return [...availableMeta, ...otherMeta, ...words];
    } else if (viewMode === 'grand_total') {
      return ['word', 'total_freq', 'docs_count'];
    } else {
      // Long mode
      const prioritized = ['dhlabid', 'word', 'freq', 'total_words'];
      const others = allKeys.filter(k => !prioritized.includes(k));
      return [...prioritized, ...others];
    }
  }, [activeData, viewMode]);

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
  const displayData = useMemo(() => {
    return sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [page, sortedData]);

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

  const handleExportExcel = () => {
    exportToExcel(sortedData, `korpus_${viewMode}_${queryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
  };

  const handleExportCsv = () => {
    exportToCsv(sortedData, `korpus_${viewMode}_${queryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <div className="flex items-center text-gray-700">
            <Table className="mr-2 h-5 w-5 text-blue-500" />
            <span className="font-medium">Fant {activeData.length.toLocaleString('no-NO')} rader</span>
          </div>
          
          <div className="h-6 w-px bg-gray-300 mx-1 hidden sm:block"></div>
          
          {/* View Mode Selector */}
          <div className="flex items-center bg-gray-50 rounded-md border border-gray-200 p-1">
            <Settings2 className="h-4 w-4 text-gray-500 ml-2 mr-1" />
            <select 
              value={viewMode} 
              onChange={handleModeChange}
              className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none py-1 pr-8"
            >
              <option value="grand_total">Totalfrekvens (Grand Total)</option>
              <option value="long">Standard (Langformat)</option>
              <option value="pivot_words">Krysstabell (Ord som rader)</option>
              <option value="pivot_docs">Krysstabell (Bøker som rader)</option>
            </select>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={handleExportCsv}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="mr-2 h-4 w-4 text-gray-500" />
            CSV
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-6 py-3 uppercase tracking-wider whitespace-nowrap" aria-sort={sortConfig?.key === header ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button
                      type="button"
                      onClick={() => handleSort(header)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span>{header}</span>
                      {sortConfig?.key === header ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 text-gray-400" />
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
              Viser {page * rowsPerPage + 1} til {Math.min((page + 1) * rowsPerPage, activeData.length)} av {activeData.length} rader
            </span>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="p-2 border border-gray-300 rounded-md bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
