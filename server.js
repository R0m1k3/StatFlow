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
