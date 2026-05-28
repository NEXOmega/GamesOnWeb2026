# Prérequis
Avoir Node.js installé.

# Setup
```
npm install
```
Cela installe les dépendances nécessaires, notamment Babylon.js.

# Build

```
npm run start
```
Cette commande compile le jeu dans `public/dist/app.js`.

Le projet est maintenant prévu pour être servi comme un site statique. Le dossier à publier est `public/`.


# Développement

```
npm run watch
```

Cette commande recompile le jeu à chaque modification.

# Qualité de code

```
npm run lint
npm run lint:fix
```

`lint` vérifie le code TypeScript. `lint:fix` trie les imports et supprime les imports inutilisés automatiquement.

```
npm run format
npm run format:check
```

`format` applique Prettier sur les fichiers du projet. `format:check` vérifie le format sans modifier les fichiers.

# Tester en local

Via npx

```
npm run build
npx serve public
```

Via python

```
npm run build
cd public
python3 -m http.server 3000
```


# Déploiement GitHub Pages

Un workflow GitHub Actions est fourni dans `.github/workflows/pages.yml`.

Pour l'utiliser :

1. Pousser le projet sur GitHub.
2. Aller dans `Settings > Pages`.
3. Choisir `GitHub Actions` comme source de déploiement.
4. Pousser sur `main` ou `master`.

GitHub vérifiera le lint, construira le jeu avec `npm run build`, puis publiera automatiquement le contenu de `public/`.
