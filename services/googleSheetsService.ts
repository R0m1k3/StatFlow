
// Parseur CSV robuste qui gère correctement les guillemets et les retours à la ligne
const parseCSV = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Double quote inside quotes escapes the quote
          currentCell += '"';
          i++; 
        } else {
          inQuotes = false;
        }
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentCell = '';
        currentRow = [];
        // Handle CRLF
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
      } else {
        currentCell += char;
      }
    }
  }
  
  // Push last cell/row if exists
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  // Nettoyage : filtrer les lignes vides et les cellules vides parasites
  const cleanRows = rows.filter(r => r.length > 0 && r.some(c => c.trim() !== ''));

  if (cleanRows.length < 2) return [];

  // Trim headers specifically
  const headers = cleanRows[0].map(h => h.trim());

  return cleanRows.slice(1).map(values => {
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      // Trim values as well for cleaner data
      row[header] = values[index] ? values[index].trim() : '';
    });
    return row;
  });
};

// --- DONNÉES DE SECOURS (MOCK DATA) ---
// Utilisées si l'API Google Sheets retourne une erreur 404 (feuilles privées ou supprimées)
const MOCK_DATA_FAMILLE = `Famille,CA N,CA N-1,Evolution,Marge N,Marge %
Accessoires,15200,12500,21.60 %,5100,33.55 %
Textile,45300,46100,-1.74 %,15200,33.55 %
Chaussures,32100,28400,13.03 %,11800,36.76 %
Equipement,8500,7900,7.59 %,2800,32.94 %
Nutrition,4200,3800,10.53 %,1400,33.33 %`;

const MOCK_DATA_HIT_PARADE = `Code,Libelle,Fournisseur,CA N,Qte N,Evolution
1001,T-Shirt Run,Nike,5200,260,12.5%
1002,Short Basic,Adidas,4800,240,5.2%
1003,Chaussettes x3,Puma,1500,300,-2.0%
1004,Veste Pluie,Kipsta,3200,80,15.0%
1005,Baskets City,Reebok,6500,110,8.4%`;

const MOCK_DATA_FOURNISSEURS = `Fournisseur,CA N,CA N-1,Evolution,Part %
Nike,58000,52000,11.54 %,35.0 %
Adidas,42000,43500,-3.45 %,25.4 %
Puma,25000,22000,13.64 %,15.1 %
Asics,18000,15000,20.00 %,10.9 %
Autres,22500,21000,7.14 %,13.6 %`;

const getMockDataForId = (sheetId: string): string => {
    if (sheetId === '1tFCeunQtTq-v3OTOM6EraSBLCUlgkhajSEjwdKfSQj4') return MOCK_DATA_FAMILLE;
    if (sheetId === '10OyLQE6xj4chSW2uF-xM-CEpvs3NPkb4') return MOCK_DATA_HIT_PARADE;
    if (sheetId === '1m92J7LubktT6U91gq9bFhNmuYZxY0yw9jgSFMze9lY4') return MOCK_DATA_FOURNISSEURS;
    return MOCK_DATA_FAMILLE;
};

// Generate a list of recent periods (Current month back to 2023)
// This acts as a "Virtual Index" when a real index sheet is missing.
const generateRecentPeriods = (): string[] => {
  const periods: string[] = [];
  const today = new Date();
  // Générer les 24 derniers mois
  for (let i = 0; i < 24; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    periods.push(`${year}-${month}`);
  }
  return periods;
};

// Known sheets that use YYYY-MM tabs but do NOT have an 'index' tab.
// We skip the index fetch for these to avoid 404 errors.
const KNOWN_NO_INDEX_SHEETS = [
  '1tFCeunQtTq-v3OTOM6EraSBLCUlgkhajSEjwdKfSQj4', // Famille
  '10OyLQE6xj4chSW2uF-xM-CEpvs3NPkb4',            // Hit Parade
  '1m92J7LubktT6U91gq9bFhNmuYZxY0yw9jgSFMze9lY4'  // Fournisseurs
];

export const getSheetNames = async (sheetId: string): Promise<string[]> => {
  // Strategy 1: For known sheets without an index, return generated periods immediately.
  if (KNOWN_NO_INDEX_SHEETS.includes(sheetId)) {
    console.log(`[LOG] Utilisation de l'index virtuel pour la feuille connue : ${sheetId}`);
    return generateRecentPeriods();
  }

  // Strategy 2: Try to fetch the 'index' sheet.
  let url = `/api/sheets/${sheetId}?sheet=index`;
  console.log(`[LOG] Tentative de récupération de l'index des feuilles via le proxy : ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (response.ok) {
      const csvText = await response.text();
      const parsed = parseCSV(csvText);
      const names = parsed.map(row => Object.values(row)[0]).filter(Boolean);
      
      // Validate that it looks like an index (contains dates)
      const hasDates = names.some(n => /^\d{4}[-]?\d{2}$/.test(n));
      if (hasDates) {
         console.log(`[SUCCESS] Index des feuilles récupéré et parsé pour ${sheetId}.`);
         return names;
      }
    }
    
    // If 'index' fetch failed or returned non-date data, fall back to generated periods
    // instead of trying to fetch the default sheet (which we know contains data, not an index).
    console.warn(`[WARN] Index introuvable ou invalide pour ${sheetId}. Utilisation de l'index virtuel.`);
    return generateRecentPeriods();

  } catch (error) {
    console.error(`[ERROR] Échec de la récupération de l'index (${sheetId}). Passage en mode DÉGRADÉ (Index Virtuel).`, error);
    return generateRecentPeriods();
  }
};

export const getSheetData = async (sheetId: string, sheetName: string): Promise<Record<string, string>[]> => {
  const url = `/api/sheets/${sheetId}?sheet=${encodeURIComponent(sheetName)}`;
  console.log(`[LOG] Tentative de récupération des données pour la feuille "${sheetName}" via le proxy : ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Statut HTTP : ${response.status}`);
    }
    const csvText = await response.text();
    console.log(`[SUCCESS] Données pour la feuille "${sheetName}" récupérées et parsées.`);
    return parseCSV(csvText);
  } catch (error) {
    // Only log error if it's not a simple 404 (which might just mean data for that month isn't there yet)
    const is404 = error instanceof Error && error.message.includes('404');
    if (!is404) {
      console.error(`[ERROR] Échec de la récupération des données pour ${sheetName}.`, error);
    } else {
      console.warn(`[WARN] Données non trouvées pour ${sheetName} (404).`);
    }
    
    // Propagate error so UI can show "No data" instead of showing mock data for real missing months
    throw error;
  }
};
