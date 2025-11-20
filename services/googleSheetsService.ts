
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
  // Tentative 1 : Récupérer la feuille nommée "index"
  let url = `/api/sheets/${sheetId}?sheet=index`;
  console.log(`[LOG] Tentative de récupération de l'index des feuilles via le proxy : ${url}`);
  
  try {
    let response = await fetch(url);
    
    // Si la feuille "index" n'existe pas (400 ou 404), on tente de récupérer la feuille par défaut
    if (!response.ok) {
      console.warn(`[WARN] La feuille 'index' n'est pas accessible (Statut ${response.status}). Tentative de récupération de la feuille par défaut...`);
      url = `/api/sheets/${sheetId}`; // Pas de paramètre sheet, le serveur chargera la première feuille
      response = await fetch(url);
    }

    if (!response.ok) {
      const errorMsg = `Impossible de récupérer la liste des feuilles via le proxy. Statut HTTP : ${response.status}. Vérifiez l'ID de la feuille et qu'elle est bien partagée ("Tous les utilisateurs disposant du lien").`;
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    const csvText = await response.text();
    const parsed = parseCSV(csvText);
    console.log(`[SUCCESS] Index des feuilles récupéré et parsé pour ${sheetId}.`);
    
    // On suppose que la première colonne contient les noms des feuilles
    // Le format gviz peut parfois renvoyer des données vides si la feuille est vide, d'où le filter
    return parsed.map(row => Object.values(row)[0]).filter(Boolean);
  } catch (error) {
    const errorMsg = `Erreur lors de la récupération de l'index (${sheetId}).`;
    console.error(`[FATAL] ${errorMsg}`, error);
    if (error instanceof Error && error.message.includes('Statut HTTP')) {
      throw error;
    }
    throw new Error(`${errorMsg} Assurez-vous que le serveur est en cours d'exécution et que le proxy est correctement configuré.`);
  }
};

export const getSheetData = async (sheetId: string, sheetName: string): Promise<Record<string, string>[]> => {
  const url = `/api/sheets/${sheetId}?sheet=${encodeURIComponent(sheetName)}`;
  console.log(`[LOG] Tentative de récupération des données pour la feuille "${sheetName}" via le proxy : ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorMsg = `Impossible de récupérer les données pour la feuille "${sheetName}" via le proxy. Statut HTTP : ${response.status}.`;
      console.error(`[ERROR] ${errorMsg}`);
      throw new Error(errorMsg);
    }
    const csvText = await response.text();
    console.log(`[SUCCESS] Données pour la feuille "${sheetName}" récupérées et parsées.`);
    return parseCSV(csvText);
  } catch (error) {
    const errorMsg = `Erreur réseau ou inattendue lors de la communication avec le proxy pour récupérer les données de la feuille "${sheetName}".`;
    console.error(`[FATAL] ${errorMsg}`, error);
    if (error instanceof Error && error.message.includes('Statut HTTP')) {
        throw error;
    }
    throw new Error(`${errorMsg} Voir la console pour plus de détails.`);
  }
};