# StatFlow - Réorganisation Colonnes Hit Parade

## Changements effectués

### 1. `components/SheetDisplay.tsx`

- Ajout de la prop `priorityColumns` pour définir les colonnes à afficher en premier
- Logique de réordonnancement mise à jour pour utiliser les colonnes prioritaires avant les autres
- Correction du type `primaryKeyIsNonGrouped` pour éviter les erreurs TypeScript

### 2. `components/SheetAnalysis.tsx`  

- Passage de `priorityColumns` à `SheetDisplay` selon le `tabName`
- Pour **Hit Parade** : colonnes CODEIN, GTIN, NOM, LIBELLE1 en premier

## Prêt pour déploiement

```bash
git add .
git commit -m "feat: priorité colonnes CODEIN, GTIN, NOM, LIBELLE1 pour Hit Parade"
git push
```

Puis redéployer Docker sur le serveur.
