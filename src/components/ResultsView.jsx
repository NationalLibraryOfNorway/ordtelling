import React, { useState, useMemo } from 'react';
import { Download, Table, FileSpreadsheet, ChevronLeft, ChevronRight, List, Grid } from 'lucide-react';
import { exportToExcel, exportToCsv } from '../utils/fileParser';
import { pivotResults } from '../utils/pivot';

export default function ResultsView({ results, queryName }) {
  const [page, setPage] = useState(0);
  const [isPivoted, setIsPivoted] = useState(false);
  const rowsPerPage = 50;

  // Derive data based on pivot mode
  const activeData = useMemo(() => {
    if (isPivoted) {
      return pivotResults(results);
    }
    return results;
  }, [results, isPivoted]);

  // Compute pagination
  const totalPages = Math.ceil(activeData.length / rowsPerPage);
  const displayData = useMemo(() => {
    return activeData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [activeData, page]);

  // Handle page resets when switching modes
  const handleTogglePivot = () => {
    setIsPivoted(prev => !prev);
    setPage(0);
  };

  // Extract headers (columns) dynamically from the first result object
  const headers = useMemo(() => {
    if (activeData.length === 0) return [];
    const allKeys = Object.keys(activeData[0]);
    
    if (isPivoted) {
      // In pivoted mode, 'word' comes first, then dhlabids
      return ['word', ...allKeys.filter(k => k !== 'word')];
    } else {
      // In long mode, prioritize standard columns, then metadata
      const prioritized = ['dhlabid', 'word', 'freq', 'total_words'];
      const others = allKeys.filter(k => !prioritized.includes(k));
      return [...prioritized, ...others];
    }
  }, [activeData, isPivoted]);

  const handleExportExcel = () => {
    const formatName = isPivoted ? 'krysstabell' : 'langformat';
    exportToExcel(activeData, `korpus_${formatName}_${queryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.xlsx`);
  };

  const handleExportCsv = () => {
    const formatName = isPivoted ? 'krysstabell' : 'langformat';
    exportToCsv(activeData, `korpus_${formatName}_${queryName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-700">
            <Table className="mr-2 h-5 w-5 text-blue-500" />
            <span className="font-medium">Fant {activeData.length.toLocaleString('no-NO')} datarader</span>
          </div>
          
          <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
          
          {/* Toggle Button */}
          <button
            onClick={handleTogglePivot}
            className="flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
          >
            {isPivoted ? (
              <>
                <List className="mr-2 h-4 w-4" />
                Vis Langt Format
              </>
            ) : (
              <>
                <Grid className="mr-2 h-4 w-4" />
                Vis som Krysstabell (Pivot)
              </>
            )}
          </button>
        </div>
        
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={handleExportCsv}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="mr-2 h-4 w-4 text-gray-500" />
            Last ned CSV
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Last ned Excel
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
                  <th key={header} className="px-6 py-3 uppercase tracking-wider whitespace-nowrap">
                    {header}
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
              Viser {page * rowsPerPage + 1} til {Math.min((page + 1) * rowsPerPage, activeData.length)} av {activeData.length} resultater
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
