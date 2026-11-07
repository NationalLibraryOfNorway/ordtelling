import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Search, 
  ListPlus, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  BookOpen,
  Sliders,
  Sparkles
} from 'lucide-react';
import { parseCorpusFile, validateCorpusData, hasUrnColumn, extractUrnsFromText } from '../utils/fileParser';
import { buildCorpusFromApi, getMetadataForUrns } from '../utils/dhlabApi';

export default function CorpusBuilder({ onCorpusLoaded }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'search', 'urns'
  
  // Upload tab state
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [missingDhlabidData, setMissingDhlabidData] = useState(null); // { filename, urns }
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);

  // Search tab state
  const [subject, setSubject] = useState('historie');
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [doctype, setDoctype] = useState('digibok');
  const [fromYear, setFromYear] = useState('1850');
  const [toYear, setToYear] = useState('2024');
  const [limit, setLimit] = useState('100');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // URNs tab state
  const [rawUrnText, setRawUrnText] = useState('');
  const urnFileInputRef = useRef(null);
  const [urnLoading, setUrnLoading] = useState(false);
  const [urnProgress, setUrnProgress] = useState(0);
  const [urnError, setUrnError] = useState(null);

  // Derived count of detected URNs in text area
  const detectedUrns = extractUrnsFromText(rawUrnText);

  // --- Handlers: Upload File ---
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);
    setMissingDhlabidData(null);

    try {
      const data = await parseCorpusFile(file);
      if (validateCorpusData(data)) {
        onCorpusLoaded({
          filename: file.name,
          data: data,
          size: data.length
        });
      } else if (hasUrnColumn(data)) {
        // Has URN column, but lacks dhlabid
        const urns = Array.from(new Set(
          data
            .map(row => row[Object.keys(row).find(k => k.toLowerCase() === 'urn')])
            .filter(Boolean)
        ));
        setMissingDhlabidData({
          filename: file.name,
          urns: urns,
          originalRows: data
        });
      } else {
        setUploadError("Filen må inneholde kolonnen 'urn' (og helst 'dhlabid').");
      }
    } catch (err) {
      setUploadError(err.message || "Det oppstod en feil under lesing av filen.");
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEnrichMissingDhlabid = async () => {
    if (!missingDhlabidData) return;
    setEnriching(true);
    setUploadError(null);
    setEnrichProgress(0);

    try {
      const enrichedRows = await getMetadataForUrns(missingDhlabidData.urns, setEnrichProgress);
      if (enrichedRows.length === 0) {
        throw new Error("Fant ingen metadata i Nasjonalbiblioteket for URN-ene i filen.");
      }
      onCorpusLoaded({
        filename: `${missingDhlabidData.filename} (beriket fra NB)`,
        data: enrichedRows,
        size: enrichedRows.length
      });
    } catch (err) {
      setUploadError(err.message || "Kunne ikke hente metadata fra DHLab API.");
    } finally {
      setEnriching(false);
    }
  };

  // --- Handlers: Search NB API ---
  const handleSearchCorpus = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchError(null);

    try {
      const params = {
        doctype: doctype || undefined,
        subject: subject || undefined,
        author: author || undefined,
        title: title || undefined,
        from_year: fromYear ? parseInt(fromYear, 10) : undefined,
        to_year: toYear ? parseInt(toYear, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : 100
      };

      const rows = await buildCorpusFromApi(params);
      if (!rows || rows.length === 0) {
        setSearchError("Ingen dokumenter funnet med disse søkekriteriene. Prøv å utvide årstallene eller endre søkeord.");
        return;
      }

      const descTerms = [subject, author, title].filter(Boolean).join(', ') || 'utvalg';
      const label = `NB API: ${descTerms} (${rows.length} dok, ${fromYear || '?'}-${toYear || '?'})`;

      onCorpusLoaded({
        filename: label,
        data: rows,
        size: rows.length
      });
    } catch (err) {
      setSearchError(err.message || "Kunne ikke bygge korpus fra Nasjonalbiblioteket.");
    } finally {
      setSearchLoading(false);
    }
  };

  // --- Handlers: URNs List ---
  const handleUrnFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const extracted = extractUrnsFromText(text);
      if (extracted.length > 0) {
        setRawUrnText(prev => {
          const combined = prev ? `${prev}\n${extracted.join('\n')}` : extracted.join('\n');
          return Array.from(new Set(extractUrnsFromText(combined))).join('\n');
        });
      } else {
        setUrnError("Fant ingen gjenkjennbare URN-er i filen (format: URN:NBN:no-nb_...).");
      }
    } catch {
      setUrnError("Kunne ikke lese tekstfilen.");
    } finally {
      if (urnFileInputRef.current) urnFileInputRef.current.value = '';
    }
  };

  const handleFetchMetadataForUrns = async () => {
    if (detectedUrns.length === 0) return;
    setUrnLoading(true);
    setUrnError(null);
    setUrnProgress(0);

    try {
      const rows = await getMetadataForUrns(detectedUrns, setUrnProgress);
      if (!rows || rows.length === 0) {
        setUrnError("Fant ingen metadata hos Nasjonalbiblioteket for de oppgitte URN-ene.");
        return;
      }

      onCorpusLoaded({
        filename: `URN-liste (${rows.length} av ${detectedUrns.length} funnet)`,
        data: rows,
        size: rows.length
      });
    } catch (err) {
      setUrnError(err.message || "Feil under henting av metadata for URN-listen.");
    } finally {
      setUrnLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      {/* Tab Switcher Header */}
      <div className="flex border-b border-gray-200 bg-gray-50/75 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all flex-1 cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-blue-600 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
        >
          <Upload className="h-4 w-4" />
          <span>Last opp korpusfil</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all flex-1 cursor-pointer ${
            activeTab === 'search'
              ? 'bg-white text-blue-600 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Bygg fra søk (NB API)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('urns')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all flex-1 cursor-pointer ${
            activeTab === 'urns'
              ? 'bg-white text-blue-600 shadow-xs border border-gray-200/80'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
          }`}
        >
          <ListPlus className="h-4 w-4" />
          <span>Hent fra URN-liste</span>
        </button>
      </div>

      {/* Tab 1: Upload File */}
      {activeTab === 'upload' && (
        <div className="p-8 text-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className="hidden"
          />

          {uploadLoading ? (
            <div className="py-8 flex flex-col items-center">
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-3" />
              <p className="text-gray-700 font-medium">Leser korpusfil...</p>
            </div>
          ) : missingDhlabidData ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-lg mx-auto text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-900">Filen mangler kolonnen 'dhlabid'</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Vi fant <strong>{missingDhlabidData.urns.length}</strong> URN-er i filen <em>«{missingDhlabidData.filename}»</em>. 
                    For å telle ord i DH-lab trenger vi både URN og dhlabid.
                  </p>
                  <p className="text-sm text-amber-800 mt-2 font-medium">
                    Vil du hente metadata og dhlabid automatisk fra Nasjonalbiblioteket?
                  </p>
                  
                  {enriching && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-amber-800 font-medium mb-1">
                        <span>Henter metadata fra api.nb.no...</span>
                        <span>{enrichProgress}%</span>
                      </div>
                      <div className="w-full bg-amber-200 rounded-full h-2">
                        <div
                          className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${enrichProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      disabled={enriching}
                      onClick={handleEnrichMissingDhlabid}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-medium rounded-md shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      {enriching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      Hent metadata automatisk
                    </button>
                    <button
                      type="button"
                      disabled={enriching}
                      onClick={() => setMissingDhlabidData(null)}
                      className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md cursor-pointer"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto py-6">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Last opp eksisterende korpus</h2>
              <p className="text-gray-500 text-sm mb-5">
                Velg en CSV- eller Excel-fil med URN-er (og helst dhlabid).
              </p>
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                Velg CSV eller Excel-fil
              </button>
            </div>
          )}

          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg max-w-lg mx-auto flex items-center justify-center text-sm">
              <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Build from Search */}
      {activeTab === 'search' && (
        <form onSubmit={handleSearchCorpus} className="p-6">
          <div className="flex items-center gap-2 text-gray-700 mb-4 font-medium text-sm">
            <Sliders className="h-4 w-4 text-blue-600" />
            <span>Angi søkekriterier for å bygge et korpus fra Nasjonalbiblioteket:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Emne / Nøkkelord (subject)
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="f.eks. historie, klima, friluftsliv"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Forfatter (author)
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="f.eks. Ibsen, Hamsun, Sars"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Tittel inneholder (title)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="f.eks. Norge, eventyr, skrifter"
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Dokumenttype
              </label>
              <select
                value={doctype}
                onChange={(e) => setDoctype(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="digibok">Bøker (digibok)</option>
                <option value="digitidsskrift">Tidsskrift (digitidsskrift)</option>
                <option value="">Alle dokumenttyper</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Fra år
                </label>
                <input
                  type="number"
                  value={fromYear}
                  onChange={(e) => setFromYear(e.target.value)}
                  placeholder="1850"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Til år
                </label>
                <input
                  type="number"
                  value={toYear}
                  onChange={(e) => setToYear(e.target.value)}
                  placeholder="2024"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Antall dokumenter (limit)
              </label>
              <input
                type="number"
                min="5"
                max="500"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {searchError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
              <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={searchLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-6 rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2 text-sm"
            >
              {searchLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Søker i Nasjonalbiblioteket...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Bygg korpus fra Nasjonalbiblioteket
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Paste / Upload URNs */}
      {activeTab === 'urns' && (
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Lim inn eller last opp URN-er</h3>
              <p className="text-xs text-gray-500">
                Appen henter automatisk tittel, forfatter, år, emneord og dhlabid for hver URN.
              </p>
            </div>

            <div>
              <input
                type="file"
                ref={urnFileInputRef}
                onChange={handleUrnFileUpload}
                accept=".txt, .csv, .tsv"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => urnFileInputRef.current?.click()}
                className="text-xs bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-3 py-1.5 rounded-md cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Last opp .txt / .csv med URN-er
              </button>
            </div>
          </div>

          <textarea
            rows={5}
            value={rawUrnText}
            onChange={(e) => setRawUrnText(e.target.value)}
            placeholder="Lim inn URN-er her (f.eks. URN:NBN:no-nb_digibok_2011100408194 ... en per linje, kommadelt eller fra ren tekst)..."
            className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-mono text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-3 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm">
              {detectedUrns.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Fant {detectedUrns.length} unike URN-er
                </span>
              ) : (
                <span className="text-gray-400 text-xs">
                  Ingen URN-er oppdaget enda (forventet format: <code>URN:NBN:no-nb_...</code>)
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={detectedUrns.length === 0 || urnLoading}
              onClick={handleFetchMetadataForUrns}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-5 rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-2 text-sm"
            >
              {urnLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Henter metadata ({urnProgress}%)...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Hent metadata & bygg korpus
                </>
              )}
            </button>
          </div>

          {urnLoading && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${urnProgress}%` }}
                />
              </div>
            </div>
          )}

          {urnError && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center text-sm">
              <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
              <span>{urnError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
