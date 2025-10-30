
const BASE_URL = 'https://docs.google.com/spreadsheets/d/';

const parseCSV = (text: string): Record<string, string>[] => {
  const lines = text.split(/\r\n|\n/);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data = lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const row: Record<string, string> = {};
    header.forEach((key, index) => {
      row[key] = values[index] ? values[index].replace(/"/g, '').trim() : '';
    });
    return row;
  }).filter(row => Object.values(row).some(val => val !== '')); // Filter out empty rows
  
  return data;
};

export const getSheetNames = async (sheetId: string): Promise<string[]> => {
  const url = `${BASE_URL}${sheetId}/gviz/tq?tqx=out:csv&sheet=index`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de récupérer la liste des feuilles (index). Erreur HTTP ${response.status}. Veuillez vérifier que l'ID de la feuille est correct, que la feuille 'index' existe et que le document est partagé publiquement.`);
  }
  const csvText = await response.text();
  const parsed = parseCSV(csvText);
  return parsed.map(row => Object.values(row)[0]).filter(Boolean);
};

export const getSheetData = async (sheetId: string, sheetName: string): Promise<Record<string, string>[]> => {
  const url = `${BASE_URL}${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Impossible de récupérer les données pour la feuille: "${sheetName}" (Erreur HTTP ${response.status}).`);
  }
  const csvText = await response.text();
  return parseCSV(csvText);
};
