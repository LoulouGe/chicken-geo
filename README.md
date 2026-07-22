# Chicken Geo

Un jeu pour apprendre la géographie en s'amusant ! Choisis un globe 3D ou une carte plate, puis clique sur la bonne réponse.

Jouer en ligne : https://loulouge.github.io/chicken-geo/

## Fonctionnalités

- **2 plateaux** : Globe 3D interactif (rotation tactile et souris) ou Carte plate 2D
- **3 modes de jeu** : Continent et Océans (trouver un continent ou un océan), Pays (trouver le pays), Capitales (trouver le pays d'une capitale)
- **Zones** : Monde entier ou un continent précis (pour Pays / Capitales)
- **Style cartoon** pensé pour les CM1/CM2 : couleurs vives, contours épais, vagues dessinées sur les océans
- **3 langues** : Français, English, Español
- **168 pays** du monde entier
- **Réponse au clic** : clique directement sur le pays sur le globe ou la carte
- **Feedback simple** : teinte verte + confettis si c'est juste, teinte rouge + secousse + révélation de la bonne réponse si c'est faux
- **Confettis** en cas de bonne réponse
- **Recentrage automatique** sur le bon pays (globe) en cas de mauvaise réponse
- **Pourcentage de réussite** et bouton **Rejoue tes erreurs** en fin de partie pour retravailler uniquement ce qui a été raté

## Comment jouer

1. Choisis ta langue, puis le Globe 3D ou la Carte
2. Choisis un mode : Continent et Océans, Pays ou Capitale
3. Pour Pays / Capitale, choisis Monde ou un continent précis
4. Un pays, un continent ou une capitale s'affiche à l'écran
5. Clique sur la bonne réponse, sur le globe ou la carte
6. À la fin de la partie, retrouve ton pourcentage de réussite et rejoue tes erreurs si besoin

### Contrôles

- **Glisser (souris / un doigt)** sur le globe — faire tourner le globe pour explorer
- **Deux doigts (rotation)** sur le globe — incliner le globe (libre aux pôles)
- **Clic / tap** sur le globe ou la carte — valider ta réponse

## Lancer le projet

Ouvre `index.html` dans ton navigateur, ou lance un serveur local :

```bash
python3 -m http.server 8080
```

Puis ouvre `http://localhost:8080`.

## Technologies

- HTML, CSS, JavaScript (vanilla, aucune dépendance npm)
- [Three.js r128](https://threejs.org/) (CDN) pour le rendu 3D du globe
- Canvas 2D pour la carte plate
- Google Fonts (Playfair Display, Poppins)
- Déployé via GitHub Pages depuis la branche `main`
