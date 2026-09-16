import React, { useState } from 'react';
import { FileText, Search, BarChart3, CheckCircle } from 'lucide-react';
import FileUploader from './components/FileUploader';

function App() {
  const [corpus, setCorpus] = useState(null);

  const handleCorpusLoaded = (corpusData) => {
    setCorpus(corpusData);
  };

  const handleReset = () => {
    setCorpus(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChart3 className="text-blue-600 h-6 w-6" />
            <h1 className="text-xl font-bold text-gray-900">Tell-Korpus PWA</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!corpus ? (
          <FileUploader onCorpusLoaded={handleCorpusLoaded} />
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8 flex justify-between items-center">
            <div className="flex items-center">
              <CheckCircle className="text-green-500 mr-3 h-6 w-6" />
              <div>
                <h2 className="text-green-800 font-medium">Korpus lastet inn: {corpus.filename}</h2>
                <p className="text-green-600 text-sm">{corpus.size} dokumenter (URN-er) funnet.</p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-sm text-green-700 hover:text-green-900 underline"
            >
              Last opp ny fil
            </button>
          </div>
        )}

        {corpus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Search className="mr-2 h-5 w-5 text-blue-500" />
                Ordlister
              </h3>
              <p className="text-sm text-gray-600 mb-4">Søk etter spesifikke ord i korpuset. Du kan laste opp mange ord og vi teller frekvensen deres i dokumentene.</p>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center text-gray-500 italic">
                Søke-UI kommer her (Steg 3 og 4)
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                Alle ord
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Tell opp <i>alle</i> ord i korpuset. 
                {corpus.size > 2000 && <span className="text-amber-600 ml-1">Korpuset er stort ({corpus.size}), så forespørselen vil automatisk samles ned.</span>}
              </p>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center text-gray-500 italic">
                Frekvens-UI kommer her (Steg 3 og 4)
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
