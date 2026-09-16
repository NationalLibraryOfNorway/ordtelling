/**
 * Pivots the flat results array into a Document-Term Matrix style format.
 * Rows = words, Columns = dhlabid, Cells = frequency.
 * 
 * @param {Array<Object>} results - The flat results from getFrequencies
 * @returns {Array<Object>} The pivoted results
 */
export const pivotResults = (results) => {
  if (!results || results.length === 0) return [];

  const wordMap = new Map();
  const dhlabids = new Set();

  results.forEach(row => {
    if (!row.word || !row.dhlabid) return;
    
    const word = String(row.word);
    const dhlabid = String(row.dhlabid);
    const freq = Number(row.freq) || 0;

    dhlabids.add(dhlabid);

    if (!wordMap.has(word)) {
      wordMap.set(word, { word: word });
    }
    
    // Add the frequency for this specific dhlabid
    wordMap.get(word)[dhlabid] = freq;
  });

  // Convert the map to an array of objects
  const pivoted = Array.from(wordMap.values());
  
  // Optional: fill missing dhlabids with 0 for each word, so the structure is uniform
  // (Not strictly necessary for rendering/exporting if the components handle undefined,
  // but it's cleaner for CSV export).
  const allIds = Array.from(dhlabids);
  pivoted.forEach(row => {
    allIds.forEach(id => {
      if (row[id] === undefined) {
        row[id] = 0;
      }
    });
  });

  // Sort alphabetically by word
  pivoted.sort((a, b) => a.word.localeCompare(b.word));

  return pivoted;
};
