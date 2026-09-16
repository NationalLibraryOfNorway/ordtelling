import React, { useRef, useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { parseCorpusFile, validateCorpusData } from '../utils/fileParser';

export default function FileUploader({ onCorpusLoaded }) {
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const data = await parseCorpusFile(file);
      if (validateCorpusData(data)) {
        onCorpusLoaded({
          filename: file.name,
          data: data,
          size: data.length
        });
      } else {
        setError("Filen mangler påkrevde kolonner: 'urn' og 'dhlabid'.");
      }
    } catch (err) {
      setError(err.message || "Det oppstod en feil under lesing av filen.");
    } finally {
      setLoading(false);
      // Reset input so the same file can be uploaded again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8 text-center border border-dashed border-gray-300">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
      />
      
      {loading ? (
        <div className="animate-pulse">
          <div className="mx-auto h-12 w-12 text-blue-400 mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            ...
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Leser fil...</h2>
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Last opp korpus</h2>
          <p className="text-gray-500 mb-4">Klikk for å bla gjennom og velge en CSV eller Excel-fil.</p>
          <p className="text-sm text-gray-400 mb-6">Filen må inneholde kolonnene "urn" og "dhlabid".</p>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors cursor-pointer"
          >
            Velg fil
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center justify-center text-sm">
          <AlertCircle className="mr-2 h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
