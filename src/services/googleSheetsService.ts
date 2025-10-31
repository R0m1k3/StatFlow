/**
 * A simple CSV parser. It handles values quoted with double quotes.
 * @param csv The CSV string to parse.
 * @returns A 2D array of strings.
 */
const parseCSV = (csv: string): string[][] => {
  const lines = csv.trim().replace(/\r/g, '').split('\n');
  return lines.map(line => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' && line[i+1] !== '"') {
        inQuotes = !inQuotes;
        continue;
      }
      
      if (char === '"' && line[i+1] === '"') {
        current += '"';
        i++; // Skip next quote
        continue;
      }

      if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  });
};


/**
 * Fetches a sheet from Google Sheets as a CSV string.
 * @param sheetId The ID of the Google Sheet document.
 * @param sheetName The name of the sheet to fetch.
 * @returns A promise that resolves to the CSV string.
 */
const fetchSheetAsCsv = async (sheetId: string, sheetName: string): Promise<string> => {
  const BASE_URL = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=`;
  const encodedSheetName = encodeURIComponent(sheetName);
  const url = `${BASE_URL}${encodedSheetName}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet: ${response.statusText}`);
  }
  return response.text();
};

/**
 * Fetches the list of sheet names from the 'index' sheet of a given document.
 * Assumes sheet names are in the first column.
 * @param sheetId The ID of the Google Sheet document.
 * @returns A promise that resolves to an array of sheet names.
 */
export const getSheetNames = async (sheetId: string): Promise<string[]> => {
  const csv = await fetchSheetAsCsv(sheetId, 'index');
  const data = parseCSV(csv);
  // Skip header row (index 0) and get the first column
  return data.slice(1).map(row => row[0]).filter(name => name);
};

/**
 * Fetches and parses the data for a specific sheet.
 * @param sheetId The ID of the Google Sheet document.
 * @param sheetName The name of the sheet.
 * @returns A promise that resolves to a 2D array of the sheet data.
 */
export const getSheetData = async (sheetId: string, sheetName: string): Promise<string[][]> => {
  const csv = await fetchSheetAsCsv(sheetId, sheetName);
  return parseCSV(csv);
};
