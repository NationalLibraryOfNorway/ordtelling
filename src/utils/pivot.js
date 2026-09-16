/**
 * Pivots the flat results array into a Document-Term Matrix style format (Words as Rows).
 * Rows = words, Columns = dhlabid, Cells = frequency.
 */
export const pivotWordsAsRows = (results) => {
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
    
    wordMap.get(word)[dhlabid] = freq;
  });

  const pivoted = Array.from(wordMap.values());
  const allIds = Array.from(dhlabids);
  
  pivoted.forEach(row => {
    allIds.forEach(id => {
      if (row[id] === undefined) row[id] = 0;
    });
  });

  pivoted.sort((a, b) => a.word.localeCompare(b.word));
  return pivoted;
};

/**
 * Pivots the flat results array into a Document-Term Matrix style format (Documents as Rows).
 * Rows = dhlabid, Columns = words, Cells = frequency.
 */
export const pivotDocsAsRows = (results, metadataMap = null) => {
  if (!results || results.length === 0) return [];

  const docMap = new Map();
  const allWords = new Set();

  results.forEach(row => {
    if (!row.word || !row.dhlabid) return;
    
    const word = String(row.word);
    const dhlabid = String(row.dhlabid);
    const freq = Number(row.freq) || 0;

    allWords.add(word);

    if (!docMap.has(dhlabid)) {
      // Keep metadata if it exists in the row
      const baseObj = { dhlabid };
      // Copy over metadata fields by ignoring the standard word/freq/total fields
      Object.keys(row).forEach(k => {
        if (!['word', 'freq', 'total_words'].includes(k)) {
          baseObj[k] = row[k];
        }
      });
      docMap.set(dhlabid, baseObj);
    }
    
    docMap.get(dhlabid)[word] = freq;
  });

  const pivoted = Array.from(docMap.values());
  const wordsArray = Array.from(allWords);

  pivoted.forEach(row => {
    wordsArray.forEach(word => {
      if (row[word] === undefined) row[word] = 0;
    });
  });

  return pivoted;
};

/**
 * Aggregates all frequencies across the entire corpus (Grand Total).
 * Returns [{ word, total_freq, docs_count, total_words_in_docs }]
 */
export const aggregateGrandTotal = (results) => {
  if (!results || results.length === 0) return [];

  const wordMap = new Map();

  results.forEach(row => {
    if (!row.word) return;
    
    const word = String(row.word);
    const freq = Number(row.freq) || 0;
    
    // Some documents might not have total_words if it's missing from API
    const totalWords = Number(row.total_words) || 0; 

    if (!wordMap.has(word)) {
      wordMap.set(word, { word, total_freq: 0, docs_count: 0 });
    }
    
    const obj = wordMap.get(word);
    obj.total_freq += freq;
    obj.docs_count += 1;
  });

  const aggregated = Array.from(wordMap.values());
  aggregated.sort((a, b) => b.total_freq - a.total_freq); // Sort by highest frequency

  return aggregated;
};
