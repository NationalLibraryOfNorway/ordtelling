import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  BarChart3, 
  CheckCircle, 
  ArrowLeft, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import CorpusBuilder from './components/CorpusBuilder';
import { WordlistForm, AllWordsForm } from './components/ActionForms';
import ResultsView from './components/ResultsView';
import { exportToExcel, exportToCsv } from './utils/fileParser';

function App() {
  const [corpus, setCorpus] = useState(null);
  const [results, setResults] = useState(null);
  const [queryName, setQueryName] = useState("");
  const [showMetadataPreview, setShowMetadataPreview] = useState(false);

  const handleCorpusLoaded = (corpusData) => {
    setCorpus(corpusData);
    setResults(null);
    setShowMetadataPreview(false);
  };

  const handleReset = () => {
    setCorpus(null);
    setResults(null);
    setShowMetadataPreview(false);
  };

  const handleResults = (data, name) => {
    setResults(data);
    setQueryName(name);
  };

  const handleBackToSearch = () => {
    setResults(null);
  };

  const handleDownloadCorpusExcel = () => {
    if (!corpus?.data) return;
    const safeName = (corpus.filename || 'korpus').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    exportToExcel(corpus.data, `${safeName}.xlsx`);
  };

  const handleDownloadCorpusCsv = () => {
    if (!corpus?.data) return;
    const safeName = (corpus.filename || 'korpus').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    exportToCsv(corpus.data, `${safeName}.csv`);
  };

  // Preview headers from the first row of corpus data
  const previewHeaders = corpus?.data?.length > 0
    ? Object.keys(corpus.data[0]).slice(0, 7)
    : [];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Tell-Korpus</h1>
              <p className="text-xs text-gray-500">Nasjonalbiblioteket · DH-lab</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {!corpus && (
          <CorpusBuilder onCorpusLoaded={handleCorpusLoaded} />
        )}

        {corpus && (
          <div className="bg-white border border-green-200 rounded-xl p-5 mb-8 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-full shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-gray-900 font-semibold text-base">
                    Aktivt korpus: <span className="text-green-800 font-medium">{corpus.filename}</span>
                  </h2>
                  <p className="text-gray-500 text-sm">
                    {corpus.size.toLocaleString('no-NO')} dokumenter (URN-er) klare for telling.
                  </p>
                </div>
              </div>

              {/* Action buttons: Export corpus & Switch corpus */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMetadataPreview(prev => !prev)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  {showMetadataPreview ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  <span>{showMetadataPreview ? 'Skjul korpus-tabell' : 'Forhåndsvis korpus'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCorpusCsv}
                  title="Last ned dette korpuset som CSV"
                  className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Download className="h-3.5 w-3.5 text-gray-500" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCorpusExcel}
                  title="Last ned dette korpuset som Excel"
                  className="px-3 py-1.5 bg-green-50 border border-green-300 hover:bg-green-100 text-green-800 text-xs font-medium rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-green-700" />
                  <span>Excel</span>
                </button>

                <button 
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Bytt korpus</span>
                </button>
              </div>
            </div>

            {/* Optional Collapsible Metadata Preview Table */}
            {showMetadataPreview && corpus.data?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Første 5 dokumenter i korpuset ({corpus.data.length} totalt):
                  </span>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                    <thead className="bg-gray-50 text-gray-700 font-semibold">
                      <tr>
                        {previewHeaders.map(col => (
                          <th key={col} className="px-3 py-2 whitespace-nowrap uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {corpus.data.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {previewHeaders.map(col => (
                            <td key={col} className="px-3 py-2 whitespace-nowrap text-gray-600 max-w-xs truncate">
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {corpus && !results && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Search className="mr-2 h-5 w-5 text-blue-600" />
                Søk med ordliste
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                Søk etter spesifikke ord i korpuset. Du kan skrive inn ord eller laste opp en ordliste, så teller vi frekvensen i alle dokumentene.
              </p>
              <div className="flex-grow">
                <WordlistForm corpus={corpus} onResult={handleResults} />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-amber-500" />
                Hent alle ord
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                Tell opp <i>alle</i> ord i korpuset. 
                {corpus.size > 500 && (
                  <span className="text-amber-700 font-medium ml-1">
                    (Korpus har over 500 tekster; ned-sampling til 500 aktiveres for å hindre overbelastning).
                  </span>
                )}
              </p>
              <div className="flex-grow">
                <AllWordsForm corpus={corpus} onResult={handleResults} />
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Resultater: {queryName}</h3>
              <button 
                type="button"
                onClick={handleBackToSearch}
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Tilbake til søk
              </button>
            </div>
            
            <ResultsView results={results} queryName={queryName} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
