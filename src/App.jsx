import React, { useState } from 'react';
import { FileText, Search, BarChart3, CheckCircle, ArrowLeft } from 'lucide-react';
import FileUploader from './components/FileUploader';
import { WordlistForm, AllWordsForm } from './components/ActionForms';

function App() {
  const [corpus, setCorpus] = useState(null);
  const [results, setResults] = useState(null);
  const [queryName, setQueryName] = useState("");

  const handleCorpusLoaded = (corpusData) => {
    setCorpus(corpusData);
    setResults(null);
  };

  const handleReset = () => {
    setCorpus(null);
    setResults(null);
  };

  const handleResults = (data, name) => {
    setResults(data);
    setQueryName(name);
  };

  const handleBackToSearch = () => {
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChart3 className="text-blue-600 h-6 w-6" />
            <h1 className="text-xl font-bold text-gray-900">Tell-Korpus</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {!corpus && <FileUploader onCorpusLoaded={handleCorpusLoaded} />}

        {corpus && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex justify-between items-center shadow-sm">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-3 h-6 w-6" />
              <div>
                <h2 className="text-green-800 font-medium">Korpus lastet inn: {corpus.filename}</h2>
                <p className="text-green-600 text-sm">{corpus.size} dokumenter (URN-er) funnet.</p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-sm text-green-700 hover:text-green-900 underline font-medium"
            >
              Bytt fil
            </button>
          </div>
        )}

        {corpus && !results && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6 flex flex-col">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Search className="mr-2 h-5 w-5 text-blue-500" />
                Søk med ordliste
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Søk etter spesifikke ord i korpuset. Du kan laste opp mange ord og vi teller frekvensen deres i dokumentene.
              </p>
              <div className="flex-grow">
                <WordlistForm corpus={corpus} onResult={handleResults} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 flex flex-col">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-amber-500" />
                Hent alle ord
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Tell opp <i>alle</i> ord i korpuset. 
                {corpus.size > 2000 && <span className="text-amber-600 ml-1 font-medium">Ned-sampling aktiveres.</span>}
              </p>
              <div className="flex-grow">
                <AllWordsForm corpus={corpus} onResult={handleResults} />
              </div>
            </div>
          </div>
        )}

        {results && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Resultater: {queryName}</h3>
              <button 
                onClick={handleBackToSearch}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Tilbake til søk
              </button>
            </div>
            
            <div className="p-8 bg-gray-50 border border-gray-200 rounded-md text-center text-gray-500 italic">
              <p className="mb-2">Fant {results.length} datarader.</p>
              <p>Visualisering og eksport av resultatene kommer her (Steg 4).</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
