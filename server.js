import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 8081;

// Puisque nous utilisons des modules ES, __dirname n'est pas disponible directement.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utiliser morgan pour la journalisation. Le format 'combined' fournit des logs détaillés.
app.use(morgan('combined'));

// Proxy API pour contourner les problèmes de CORS avec Google Sheets
// Updated to handle path-based sheet names: /api/sheets/:sheetId/:sheetName
app.get('/api/sheets/:sheetId/:sheetName?', async (req, res) => {
  const { sheetId, sheetName } = req.params;

  // Utilisation de l'API Google Visualization (gviz) qui est souvent plus fiable pour l'export CSV
  // que le endpoint /export standard.
  let googleSheetsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  if (sheetName && sheetName !== 'index') {
    googleSheetsUrl += `&sheet=${encodeURIComponent(decodeURIComponent(sheetName))}`;
  }

  try {
    console.log(`[PROXY] Tentative de fetch : ${googleSheetsUrl}`);
    const fetchResponse = await fetch(googleSheetsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/csv;charset=UTF-8'
      }
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error(`[PROXY] Erreur de Google Sheets. Statut : ${fetchResponse.status}. Réponse : ${errorText}`);
      return res.status(fetchResponse.status).send(`Erreur Google Sheets (${fetchResponse.status})`);
    }

    const csvData = await fetchResponse.text();
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.send(csvData);
    console.log(`[PROXY] Succès pour la feuille : ${sheetName || 'défaut'}`);
  } catch (error) {
    console.error('[PROXY] Erreur inattendue du proxy :', error);
    res.status(500).send({ error: 'Erreur interne du serveur proxy.' });
  }
});


// Servir les fichiers statiques depuis le répertoire 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback pour les SPA : pour toute requête qui ne correspond pas à un fichier statique,
// renvoyer le fichier index.html.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[SERVER] Le serveur écoute sur le port ${port}`);
  console.log(`[SERVER] Sert les fichiers statiques depuis : ${path.join(__dirname, 'dist')}`);
});