const DHLAB_API_URL = "https://api.nb.no/dhlab/frequencies";
const DHLAB_BUILD_CORPUS_URL = "https://api.nb.no/dhlab/build_corpus";
const DHLAB_METADATA_URL = "https://api.nb.no/dhlab/get_metadata";

/**
 * Samples a random subset of URNs if the corpus is too large.
 * @param {Array<string>} urns 
 * @param {number} maxLimit 
 * @returns {Array<string>} Sampled URNs
 */
const sampleUrns = (urns, maxLimit = 500) => {
  if (urns.length <= maxLimit) return urns;
  
  // Create a copy to shuffle
  const shuffled = [...urns].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, maxLimit);
};

/**
 * Splits an array into chunks of a specific size.
 * @param {Array} array 
 * @param {number} size 
 * @returns {Array<Array>}
 */
export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Converts DHLab DataFrame-style JSON dictionary to an array of objects.
 * Format from DHLab: { colA: { "0": val, "1": val }, colB: { "0": val, "1": val } }
 * @param {Object} cJson 
 * @returns {Array<Object>}
 */
export const parseDhlabCorpusResponse = (cJson) => {
  if (!cJson || typeof cJson !== 'object') return [];
  
  // Identify key providing row indices (preferably 'urn' or 'dhlabid')
  const indexSource = cJson.urn || cJson.dhlabid || Object.values(cJson)[0];
  if (!indexSource || typeof indexSource !== 'object') return [];
  
  const rowIndices = Object.keys(indexSource);
  const columnNames = Object.keys(cJson);
  
  return rowIndices.map(idx => {
    const row = {};
    columnNames.forEach(col => {
      row[col] = cJson[col]?.[idx] ?? '';
    });
    return row;
  });
};

/**
 * Builds a corpus via the DHLab API (build_corpus).
 * @param {Object} params - Search criteria: { doctype, subject, author, title, from_year, to_year, limit }
 * @returns {Promise<Array<Object>>} List of corpus document objects
 */
export const buildCorpusFromApi = async (params = {}) => {
  const cleanParams = {};
  if (params.doctype) cleanParams.doctype = params.doctype;
  if (params.subject && params.subject.trim()) cleanParams.subject = params.subject.trim();
  if (params.author && params.author.trim()) cleanParams.author = params.author.trim();
  if (params.title && params.title.trim()) cleanParams.title = params.title.trim();
  if (params.from_year) cleanParams.from_year = Number(params.from_year);
  if (params.to_year) cleanParams.to_year = Number(params.to_year);
  if (params.limit) cleanParams.limit = Number(params.limit);

  const response = await fetch(DHLAB_BUILD_CORPUS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(cleanParams)
  });

  if (!response.ok) {
    throw new Error(`Feil ved oppslag mot DHLab build_corpus (status: ${response.status})`);
  }

  const cJson = await response.json();
  return parseDhlabCorpusResponse(cJson);
};

/**
 * Fetches metadata for a list of URNs via get_metadata.
 * Batches requests in chunks of 500 to keep payloads resilient.
 * @param {Array<string>} urns 
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Array<Object>>}
 */
export const getMetadataForUrns = async (urns, onProgress = () => {}) => {
  if (!urns || urns.length === 0) return [];
  
  const BATCH_SIZE = 500;
  const chunks = chunkArray(urns, BATCH_SIZE);
  let allRows = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const response = await fetch(DHLAB_METADATA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ urns: chunk })
    });

    if (!response.ok) {
      throw new Error(`Feil ved oppslag mot DHLab get_metadata (status: ${response.status})`);
    }

    const cJson = await response.json();
    const rows = parseDhlabCorpusResponse(cJson);
    allRows = allRows.concat(rows);
    onProgress(Math.round(((i + 1) / chunks.length) * 100));
  }

  return allRows;
};

/**
 * Perform a single POST request to the dhlab frequencies endpoint.
 * @param {Array<string>} urns 
 * @param {Array<string>} words 
 * @returns {Promise<Array>} API response data
 */
const fetchFrequenciesBatch = async (urns, words) => {
  const response = await fetch(DHLAB_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      urns: urns,
      words: words,
      cutoff: 0
    })
  });
  
  if (!response.ok) {
    throw new Error(`API kall feilet med status: ${response.status}`);
  }
  
  return await response.json();
};

/**
 * Fetch frequencies from DHLab. Merges results with the provided metadata.
 * Response format from API: [[dhlabid, word, frequency, total_words_in_doc], ...]
 * 
 * @param {Array<Object>} corpusData - The full metadata rows from the uploaded file
 * @param {Array<string>} words - Words to search for. Empty array means "all words".
 * @param {Function} onProgress - Callback for reporting progress (0-100)
 * @returns {Promise<Array>} Combined data: { dhlabid, word, frequency, total_words, ...metadata }
 */
export const getFrequencies = async (corpusData, words = [], onProgress = () => {}) => {
  if (!corpusData || corpusData.length === 0) return [];

  // Extract URNs from the corpus
  const getUrn = (row) => row[Object.keys(row).find(k => k.toLowerCase() === 'urn')];
  const getDhlabId = (row) => row[Object.keys(row).find(k => k.toLowerCase() === 'dhlabid')];

  // Create a fast lookup map for metadata based on dhlabid
  const metadataMap = new Map();
  const allUrns = [];

  corpusData.forEach(row => {
    const urn = getUrn(row);
    const dhlabid = getDhlabId(row);
    if (urn) {
      metadataMap.set(String(dhlabid), row);
      allUrns.push(urn);
    }
  });

  const isAllWords = words.length === 0;
  
  // If fetching "all words" on a huge corpus, sample it down to avoid crashing the API/Browser
  const targetUrns = isAllWords ? sampleUrns(allUrns, 500) : allUrns;

  const BATCH_SIZE = 500; 
  const urnChunks = chunkArray(targetUrns, BATCH_SIZE);
  
  let allResults = [];
  
  for (let i = 0; i < urnChunks.length; i++) {
    const chunk = urnChunks[i];
    try {
      let batchResult = await fetchFrequenciesBatch(chunk, words);
      
      if (isAllWords && Array.isArray(batchResult) && batchResult.length > 0) {
        batchResult = batchResult.flat();
      }
      
      allResults = allResults.concat(batchResult);
    } catch (error) {
      console.error(`Feil ved henting av batch ${i + 1}:`, error);
      throw error;
    }
    
    // Update progress
    onProgress(Math.round(((i + 1) / urnChunks.length) * 100));
  }

  // Combine the results with the metadata
  const combinedResults = allResults.map(apiRow => {
    if (!Array.isArray(apiRow)) return null;
    
    const [dhlabid, word, freq, total] = apiRow;
    const meta = metadataMap.get(String(dhlabid)) || {};
    
    return {
      ...meta,
      dhlabid,
      word,
      freq,
      total_words: total || ""
    };
  }).filter(Boolean);

  return combinedResults;
};
