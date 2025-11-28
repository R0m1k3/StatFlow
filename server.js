import express from 'express';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 8081;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(morgan('combined'));

app.get('/api/sheets/:sheetId/:sheetName?', async (req, res) => {
  const { sheetId, sheetName } = req.params;

  // IMPORTANT: gviz API limite les résultats si on ne spécifie pas de range
  // On force une lecture large (A1:ZZ2000) pour éviter la troncature aux lignes vides
  let googleSheetsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  if (sheetName && sheetName !== 'index') {
    googleSheetsUrl += `&sheet=${encodeURIComponent(decodeURIComponent(sheetName))}&range=A1:ZZ2000`;
  }

  try {
    console.log(`[PROXY] Tentative de fetch : ${googleSheetsUrl}`);
    const fetchResponse = await fetch(googleSheetsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/csv;charset=UTF-8'
      }
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      console.error(`[PROXY] Erreur Google Sheets: ${fetchResponse.status}. ${errorText}`);
      return res.status(fetchResponse.status).send(`Erreur Google Sheets (${fetchResponse.status})`);
    }

    const csvData = await fetchResponse.text();
    const lineCount = csvData.split('\n').length;
    console.log(`[PROXY] CSV reçu: ${csvData.length} chars, ${lineCount} lignes`);

    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.send(csvData);
    console.log(`[PROXY] Succès pour: ${sheetName || 'défaut'}`);
  } catch (error) {
    console.error('[PROXY] Erreur:', error);
    res.status(500).send({ error: 'Erreur serveur proxy.' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[SERVER] Écoute sur le port ${port}`);
  console.log(`[SERVER] ATTENTION: gviz API limite à ~200 lignes par feuille`);
});