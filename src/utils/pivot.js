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
export const pivotDocsAsRows = (results) => {
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

/**
 * Extracts and explodes metadata values (e.g. split by '/')
 * @param {*} rawVal 
 * @param {boolean} explode 
 * @returns {Array<string>}
 */
const extractMetadataValues = (rawVal, explode = true) => {
  if (rawVal === null || rawVal === undefined || String(rawVal).trim() === '') {
    return ['(Uten verdi)'];
  }
  const strVal = String(rawVal).trim();
  if (explode && strVal.includes('/')) {
    const parts = strVal.split('/').map(s => s.trim()).filter(Boolean);
    return parts.length > 0 ? Array.from(new Set(parts)) : ['(Uten verdi)'];
  }
  return [strVal];
};

/**
 * Pivots results by a chosen metadata column (Words as Rows, Metadata values as Columns).
 * Rows = words, Columns = metadata values, Cells = sum of frequencies.
 * @param {Array<Object>} results 
 * @param {string} metaColumn 
 * @param {boolean} explode 
 * @returns {{ data: Array<Object>, columns: Array<string> }}
 */
export const pivotWordsByMetadata = (results, metaColumn, explode = true) => {
  if (!results || results.length === 0 || !metaColumn) {
    return { data: [], columns: [] };
  }

  const wordMap = new Map();
  const metaValues = new Set();

  results.forEach(row => {
    if (!row.word) return;
    const word = String(row.word);
    const freq = Number(row.freq) || 0;
    const values = extractMetadataValues(row[metaColumn], explode);

    if (!wordMap.has(word)) {
      wordMap.set(word, { word });
    }
    const entry = wordMap.get(word);

    values.forEach(val => {
      metaValues.add(val);
      entry[val] = (entry[val] || 0) + freq;
    });
  });

  const allMetaVals = Array.from(metaValues);
  const allNumeric = allMetaVals.every(v => v !== '(Uten verdi)' && !isNaN(Number(v)));
  allMetaVals.sort((a, b) => {
    if (a === '(Uten verdi)') return 1;
    if (b === '(Uten verdi)') return -1;
    if (allNumeric) {
      return Number(a) - Number(b);
    }
    return a.localeCompare(b, 'no');
  });

  const pivoted = Array.from(wordMap.values());
  pivoted.forEach(row => {
    allMetaVals.forEach(val => {
      if (row[val] === undefined) row[val] = 0;
    });
  });

  pivoted.sort((a, b) => a.word.localeCompare(b.word, 'no'));

  return { data: pivoted, columns: allMetaVals };
};

/**
 * Pivots results by a chosen metadata column (Metadata values as Rows, Words as Columns).
 * Rows = metadata values, Columns = words, Cells = sum of frequencies.
 * @param {Array<Object>} results 
 * @param {string} metaColumn 
 * @param {boolean} explode 
 * @returns {{ data: Array<Object>, columns: Array<string> }}
 */
export const pivotMetadataByWords = (results, metaColumn, explode = true) => {
  if (!results || results.length === 0 || !metaColumn) {
    return { data: [], columns: [] };
  }

  const metaMap = new Map();
  const allWords = new Set();

  results.forEach(row => {
    if (!row.word) return;
    const word = String(row.word);
    const freq = Number(row.freq) || 0;
    allWords.add(word);

    const values = extractMetadataValues(row[metaColumn], explode);

    values.forEach(val => {
      if (!metaMap.has(val)) {
        metaMap.set(val, { [metaColumn]: val });
      }
      const entry = metaMap.get(val);
      entry[word] = (entry[word] || 0) + freq;
    });
  });

  const wordsArray = Array.from(allWords).sort((a, b) => a.localeCompare(b, 'no'));
  const pivoted = Array.from(metaMap.values());

  pivoted.forEach(row => {
    wordsArray.forEach(word => {
      if (row[word] === undefined) row[word] = 0;
    });
  });

  const allNumeric = pivoted.every(r => r[metaColumn] !== '(Uten verdi)' && !isNaN(Number(r[metaColumn])));
  pivoted.sort((a, b) => {
    const aVal = a[metaColumn];
    const bVal = b[metaColumn];
    if (aVal === '(Uten verdi)') return 1;
    if (bVal === '(Uten verdi)') return -1;
    if (allNumeric) return Number(aVal) - Number(bVal);
    return String(aVal).localeCompare(String(bVal), 'no');
  });

  return { data: pivoted, columns: wordsArray };
};
