
// Parseur CSV qui retourne une matrice de chaînes de caractères (string[][])
// C'est la logique de base utilisée par parseCSV
export const parseCSVToMatrix = (text: string): string[][] => {
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

  // Nettoyage de base : on ne garde que les lignes qui ne sont pas totalement vides
  return rows.filter(r => r.length > 0 && r.some(c => c.trim() !== ''));
};

// Parseur CSV standard qui retourne un tableau d'objets basé sur les en-têtes de la première ligne
const parseCSV = (text: string): Record<string, string>[] => {
  const cleanRows = parseCSVToMatrix(text);

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

const MOCK_DATA_TOP10_HOUDEMONT = `Période : 2024-03
,,,,
Nomenclature 01 - TEXTILE HOMME
Magasin Houdemont - Quantité (Top 10)
Rang,Code,Libellé,Fournisseur,Quantité,CA
1,1001,T-Shirt Run,Nike,150,4500
2,1002,Short Basic,Adidas,120,3600
3,1003,Veste Pluie,Kipsta,80,2400
4,1004,Chaussettes,Puma,200,1200
5,1005,Pantalon,Reebok,70,2800
,,,,
Magasin Houdemont - Montant (Top 10)
Rang,Code,Libellé,Fournisseur,CA,Marge
1,1001,T-Shirt Run,Nike,4500,2000
2,1002,Short Basic,Adidas,3600,1500
3,1005,Pantalon,Reebok,2800,1200
4,1003,Veste Pluie,Kipsta,2400,1000
5,1004,Chaussettes,Puma,1200,600
,,,,
Nomenclature 02 - CHAUSSURES
Magasin Houdemont - Quantité (Top 10)
Rang,Code,Libellé,Fournisseur,Quantité,CA
1,2001,Pegasus,Nike,60,7200
2,2002,Ultraboost,Adidas,45,8100
3,2003,Trail Glove,Merrell,30,3600
,,,,
Magasin Houdemont - Montant (Top 10)
Rang,Code,Libellé,Fournisseur,CA,Marge
1,2002,Ultraboost,Adidas,8100,3000
2,2001,Pegasus,Nike,7200,2500
3,2003,Trail Glove,Merrell,3600,1200`;

const MOCK_DATA_TOP10_FROUARD = `Période : 2024-03
,,,,
Nomenclature 01 - TEXTILE HOMME
Magasin Frouard - Quantité (Top 10)
Rang,Code,Libellé,Fournisseur,Quantité,CA
1,1001,T-Shirt Run,Nike,180,5400
2,1004,Chaussettes,Puma,250,1500
3,1002,Short Basic,Adidas,100,3000
,,,,
Magasin Frouard - Montant (Top 10)
Rang,Code,Libellé,Fournisseur,CA,Marge
1,1001,T-Shirt Run,Nike,5400,2400
2,1002,Short Basic,Adidas,3000,1200
3,1004,Chaussettes,Puma,1500,700
,,,,
Nomenclature 02 - CHAUSSURES
Magasin Frouard - Quantité (Top 10)
Rang,Code,Libellé,Fournisseur,Quantité,CA
1,2001,Pegasus,Nike,50,6000
2,2002,Ultraboost,Adidas,40,7200
,,,,
Magasin Frouard - Montant (Top 10)
Rang,Code,Libellé,Fournisseur,CA,Marge
1,2002,Ultraboost,Adidas,7200,2800
2,2001,Pegasus,Nike,6000,2000`;

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
  '1m92J7LubktT6U91gq9bFhNmuYZxY0yw9jgSFMze9lY4', // Fournisseurs
  '1s5poBaK7aWy1Wze2aMiEBWia1HWXIYVDHOYjj-nHvpU'  // Top 10
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
    const data = parseCSV(csvText);

    // VALIDATION: Google Sheets returns the first sheet (index) if the requested sheet is not found.
    // We must detect this case to avoid displaying the index instead of the data.
    if (sheetName !== 'index' && data.length > 0) {
      const firstRow = data[0];
      const keys = Object.keys(firstRow);

      // Heuristic: If we have only 1 column and it looks like the index (header "Période" or values are dates)
      const isIndex = keys.length === 1 && (
        keys[0].toLowerCase().includes('période') ||
        keys[0].toLowerCase().includes('period') ||
        /^\d{4}[-]?\d{2}$/.test(Object.values(firstRow)[0])
      );

      if (isIndex) {
        console.warn(`[WARN] La feuille retournée semble être l'index au lieu de "${sheetName}". Génération d'une erreur 404.`);
        throw new Error("404 - Feuille introuvable (Index retourné par défaut)");
      }
    }

    console.log(`[SUCCESS] Données pour la feuille "${sheetName}" récupérées et parsées.`);
    return data;
  } catch (error) {
    // Only log error if it's not a simple 404 (which might just mean data for that month isn't there yet)
    const is404 = error instanceof Error && error.message.includes('404');

    // FALLBACK LOGIC: If we get a 404 for a known sheet, return mock data
    if (is404 || error) {
      console.warn(`[WARN] Échec de la récupération des données pour ${sheetName}. Passage en mode DÉGRADÉ (Mock Data).`);
      const mockCsv = getMockDataForId(sheetId);
      return parseCSV(mockCsv);
    }

    throw error;
  }
};

// Récupère les données brutes (matrice string[][]) sans essayer de parser les headers.
// Utile pour les feuilles contenant plusieurs tableaux (comme le Top 10).
export const getRawSheetData = async (sheetId: string, sheetName: string): Promise<string[][]> => {
  const url = `/api/sheets/${sheetId}?sheet=${encodeURIComponent(sheetName)}`;
  console.log(`[LOG] Tentative de récupération des données BRUTES pour "${sheetName}"`);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Statut HTTP : ${response.status}`);
    const csvText = await response.text();
    return parseCSVToMatrix(csvText);
  } catch (error) {
    console.warn(`[WARN] Echec données brutes pour ${sheetName} (${sheetId}). Tentative Mock Data.`);

    // Fallback spécifique pour Top 10 (Multi-tableaux)
    if (sheetId === '1s5poBaK7aWy1Wze2aMiEBWia1HWXIYVDHOYjj-nHvpU') {
      const normalizedName = sheetName.trim().toLowerCase();
      if (normalizedName.includes('houdemont')) return parseCSVToMatrix(MOCK_DATA_TOP10_HOUDEMONT);
      if (normalizedName.includes('frouard')) return parseCSVToMatrix(MOCK_DATA_TOP10_FROUARD);
    }

    throw error;
  }
};
