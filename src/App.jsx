import React, { useState } from 'react';
import { Upload, FileText, Search, BarChart3, Download } from 'lucide-react';

function App() {
  const [corpus, setCorpus] = useState(null);

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
        <div className="bg-white rounded-lg shadow p-6 mb-8 text-center border border-dashed border-gray-300">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Last opp korpus</h2>
          <p className="text-gray-500 mb-4">Dra og slipp en CSV eller Excel-fil her, eller klikk for å bla gjennom.</p>
          <p className="text-sm text-gray-400 mb-6">Filen må inneholde kolonnene "urn" og "dhlabid".</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Velg fil
          </button>
        </div>

        {corpus && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Search className="mr-2 h-5 w-5 text-blue-500" />
                Ordlister
              </h3>
              <p className="text-sm text-gray-600 mb-4">Søk etter spesifikke ord i korpuset.</p>
              {/* Add form here */}
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-blue-500" />
                Alle ord
              </h3>
              <p className="text-sm text-gray-600 mb-4">Tell opp alle ord i korpuset (sampler ned automatisk hvis korpuset er veldig stort).</p>
              {/* Add form here */}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
