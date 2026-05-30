# Bunker
## Game On Web 2026, IA edition

Ce projet a été réalisé dans le cadre de **Games on Web 2026**, dont le thème est **"IA Edition"**. 

## Membres de l’équipe

- Amalya MOURIH - Modélisation 3D
- Valentin GABILLET - Programmation
- Numa EFREMON - Programmation

## Lien avec l'Intélligence Artificielle

Nous avons décidé de partir sur un jeu narratif, dans le cadre d'une dystopie où l'espèce humaine a été presque entièrement éradiquée par une IA libre à qui on aurait donné beaucoup trop de pouvoir et une instruction assez floue, et nous survivant dans un bunker assez particulier, qui est géré, en contraste avec l'IA extérieure, par une IA plutôt bienveillante à qui on aurait ordonné de tout faire pour faire perdurer le groupe d'humains de son bunker. Avec cette histoire, on a essayé de montrer comment, si mal utilisée, l'intelligence artificielle peut être nocive pour nous, mais qu'elle peut aussi être bénéfique si, au lieu de se reposer dessus, on travaille avec.

## Plan initial du jeu
Le plan initial était de créer un jeu d'extraction où on était envoyé dans différentes zones pour récupérer des matériaux essentiels à la survie du bunker, mais où l'on pourrait faire des choix entre les donner au bunker, aux autres survivants ou les garder pour nous. Cela influerait sur un système de moral et de relations selon à qui ont les données, ou si on les garde pour nous permettrait de créer des équipements permettant de rendre nos expéditions plus faciles. Et à la fin, on pourrait avoir des fins différentes selon nos choix.

## Difficultées rencontrées
Nous avons rencontré quelques difficultés que ça soit niveau techniques où organisationnelle, un des grands problème était l'optimisation en effet vu que nous faisions un jeu en 3D via navigateur, malgré tout les progrès fait sur les moteurs de jeux web, on peut très vite se retrouver avec ds problèmes de performances notament sur le 2nd niveau la ville, qui avait un grand niveau de détail mais aussi beaucoup de mesh ce qui nous a ammené à utiliser des techniques notament réduire la qualité ou fusionner les mesh pour éviter que notre jeux itère constament sur des milliers de mesh.
Ensuite nous avions pas mal de soucis d'organisation notamment car nous avions qu'une seule personne pour la modélisation 3D, et que nos disponibilités étaient souvent assez limités ce qui à fait que le jeu a pris du retard et qu'e l'on a du raccourcir et réduire nos attentes.

## Retour sur l'expérience GOW
Nous sommes fiers de notre projet, même si malheureusement nous n'avons pas pu aller aussi loin que nous le voulions. Nous avons quand même réussi à atteindre un stade correct. Le fait d'avoir une deadline fixe a pu nous forcer à nous dépasser et à apprendre de nouvelles compétences, comme dans un premier temps Babylon.js, structurer un jeu pour qu'il corresponde aux attentes initiales, et le travail d'équipe sur un projet assez conséquent. Je pense que nous allons continuer de le développer, pour qu'il puisse atteindre un stade plus avancé et possiblement rajouter les idées que nous avons tronquées par manque de temps.

# Installation
## Prérequis
Avoir Node.js installé.

## Setup
```
npm install
```
Cela installe les dépendances nécessaires, notamment Babylon.js.

## Build

```
npm run start
```
Cette commande compile le jeu dans `public/dist/app.js`.

Le projet est maintenant prévu pour être servi comme un site statique. Le dossier à publier est `public/`.


## Développement

```
npm run watch
```

Cette commande recompile le jeu à chaque modification.

## Tester en local

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


## Déploiement GitHub Pages

Un workflow GitHub Actions est fourni dans `.github/workflows/pages.yml`.

Pour l'utiliser :

1. Pousser le projet sur GitHub.
2. Aller dans `Settings > Pages`.
3. Choisir `GitHub Actions` comme source de déploiement.
4. Pousser sur `main` ou `master`.

GitHub construira le jeu avec `npm run build`, puis publiera automatiquement le contenu de `public/`

# Informations
## Lien du jeu
Le jeu est sur ce lien:

[ Bunker Game](https://nexomega.github.io/GamesOnWeb2026/)

## Liens utiles

- [Dépôt du concours](https://github.com/gamesonweb/ia-edition-bunker)
- [Dépôt personnel](https://github.com/NEXOmega/GamesOnWeb2026)