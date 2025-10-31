
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
  console.log(`[LOG] Tentative de récupération de l'index des feuilles depuis : ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorMsg = `Impossible de récupérer la liste des feuilles (index). Statut HTTP : ${response.status}. Vérifiez l'ID de la feuille, l'existence de la feuille 'index' et les permissions de partage.`;
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    const csvText = await response.text();
    const parsed = parseCSV(csvText);
    console.log(`[SUCCESS] Index des feuilles récupéré et parsé pour ${sheetId}.`);
    return parsed.map(row => Object.values(row)[0]).filter(Boolean);
  } catch (error) {
    const errorMsg = `Erreur réseau ou inattendue lors de la récupération de l'index pour ${sheetId}.`;
    console.error(`[FATAL] ${errorMsg}`, error);
    throw new Error(`${errorMsg} Voir la console pour plus de détails.`);
  }
};

export const getSheetData = async (sheetId: string, sheetName: string): Promise<Record<string, string>[]> => {
  const url = `${BASE_URL}${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  console.log(`[LOG] Tentative de récupération des données pour la feuille "${sheetName}" depuis : ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorMsg = `Impossible de récupérer les données pour la feuille "${sheetName}". Statut HTTP : ${response.status}.`;
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    const csvText = await response.text();
    console.log(`[SUCCESS] Données pour la feuille "${sheetName}" récupérées et parsées.`);
    return parseCSV(csvText);
  } catch (error) {
    const errorMsg = `Erreur réseau ou inattendue lors de la récupération des données de la feuille "${sheetName}".`;
    console.error(`[FATAL] ${errorMsg}`, error);
    throw new Error(`${errorMsg} Voir la console pour plus de détails.`);
  }
};