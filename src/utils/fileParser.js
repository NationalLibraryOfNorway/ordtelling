import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Parses an uploaded file (CSV or Excel) and extracts data.
 * @param {File} file 
 * @returns {Promise<Array>} Array of objects representing the rows.
 */
export const parseCorpusFile = (file) => {
  return new Promise((resolve, reject) => {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    } else if (['xlsx', 'xls'].includes(extension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error("Ugyldig filtype. Vennligst last opp en CSV eller Excel-fil."));
    }
  });
};

/**
 * Validates that the data contains the required columns 'urn' and 'dhlabid' (case-insensitive).
 * @param {Array} data 
 * @returns {boolean} True if valid, false otherwise.
 */
export const validateCorpusData = (data) => {
  if (!data || data.length === 0) return false;
  
  // Checking the keys of the first object (lowercase to be safe)
  const keys = Object.keys(data[0]).map(k => k.toLowerCase());
  return keys.includes('urn') && keys.includes('dhlabid');
};
