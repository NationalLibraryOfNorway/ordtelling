import React, { useState } from 'react';
import { Search, FileText, Loader2 } from 'lucide-react';
import { getFrequencies } from '../utils/dhlabApi';

export function WordlistForm({ corpus, onResult }) {
  const [wordInput, setWordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!wordInput.trim()) return;

    const words = wordInput.split(',').map(w => w.trim()).filter(w => w.length > 0);
    
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const results = await getFrequencies(corpus.data, words, setProgress);
      onResult(results, `Ordliste (${words.length} ord)`);
    } catch (err) {
      setError("Kunne ikke hente frekvenser. Prøv igjen med færre ord eller færre tekster.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <textarea
        value={wordInput}
        onChange={(e) => setWordInput(e.target.value)}
        placeholder="Skriv inn ord adskilt med komma (f.eks: bok, lese, bibliotek)"
        className="w-full h-32 p-3 border border-gray-300 rounded-md mb-4 focus:ring-blue-500 focus:border-blue-500"
        disabled={loading}
      />
      
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      <div className="mt-auto">
        <button
          type="submit"
          disabled={loading || !wordInput.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:bg-blue-300"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Henter data ({progress}%)
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Søk med ordliste
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export function AllWordsForm({ corpus, onResult }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFetchAll = async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Empty array signifies "all words"
      const results = await getFrequencies(corpus.data, [], setProgress);
      onResult(results, "Alle ord");
    } catch (err) {
      setError("Kunne ikke hente frekvenser. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-amber-50 p-4 rounded-md text-sm text-amber-800 mb-6 flex-grow">
        <strong>Viktig informasjon:</strong> Å hente alle ord tar tid og resulterer i store datamengder. 
        Dersom korpuset er veldig stort ({corpus.size} tekster), vil vi automatisk sample det ned til maksimalt 2000 tilfeldige tekster for å unngå krasj.
      </div>
      
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      <div className="mt-auto">
        <button
          onClick={handleFetchAll}
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center disabled:bg-amber-300"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Henter alle ord ({progress}%)
            </>
          ) : (
            <>
              <FileText className="mr-2 h-5 w-5" />
              Hent alle ord
            </>
          )}
        </button>
      </div>
    </div>
  );
}
