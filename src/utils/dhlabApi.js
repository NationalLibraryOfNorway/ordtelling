const DHLAB_API_URL = "https://api.nb.no/dhlab/frequencies";

/**
 * Samples a random subset of URNs if the corpus is too large.
 * @param {Array<string>} urns 
 * @param {number} maxLimit 
 * @returns {Array<string>} Sampled URNs
 */
const sampleUrns = (urns, maxLimit = 2000) => {
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
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
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
  // We make sure to find the urn key regardless of case, although we validated it as lowercase earlier
  const getUrn = (row) => row[Object.keys(row).find(k => k.toLowerCase() === 'urn')];
  const getDhlabId = (row) => row[Object.keys(row).find(k => k.toLowerCase() === 'dhlabid')];

  // Create a fast lookup map for metadata based on dhlabid
  const metadataMap = new Map();
  const allUrns = [];

  corpusData.forEach(row => {
    const urn = getUrn(row);
    const dhlabid = getDhlabId(row);
    if (urn) {
      // In case dhlabid is numeric in API but string in CSV, we map by string
      metadataMap.set(String(dhlabid), row);
      allUrns.push(urn);
    }
  });

  const isAllWords = words.length === 0;
  
  // If fetching "all words" on a huge corpus, sample it down to avoid crashing the API/Browser
  const targetUrns = isAllWords ? sampleUrns(allUrns, 2000) : allUrns;

  // We batch URNs to not send overly large JSON payloads. 
  // For "all words", we might still batch if we want, but 2000 URNs in one go is usually fine.
  // For wordlists, we can process larger amounts by chunking.
  const BATCH_SIZE = 500; 
  const urnChunks = chunkArray(targetUrns, BATCH_SIZE);
  
  let allResults = [];
  
  for (let i = 0; i < urnChunks.length; i++) {
    const chunk = urnChunks[i];
    try {
      const batchResult = await fetchFrequenciesBatch(chunk, words);
      allResults = allResults.concat(batchResult);
    } catch (error) {
      console.error(`Feil ved henting av batch ${i + 1}:`, error);
      throw error; // Propagate error or handle gracefully
    }
    
    // Update progress
    onProgress(Math.round(((i + 1) / urnChunks.length) * 100));
  }

  // Combine the results with the metadata
  // batchResult format: [dhlabid, word, frequency, total_words]
  const combinedResults = allResults.map(apiRow => {
    const [dhlabid, word, freq, total] = apiRow;
    const meta = metadataMap.get(String(dhlabid)) || {};
    
    return {
      ...meta,
      dhlabid,
      word,
      freq,
      total_words: total
    };
  });

  return combinedResults;
};
