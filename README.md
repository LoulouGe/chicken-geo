# Chicken Geo

Un jeu pour apprendre la géographie en s'amusant ! Une poule vole vers un globe 3D que tu peux faire tourner pour qu'elle atterrisse sur le bon pays.

Jouer en ligne : https://loulouge.github.io/chicken-geo/

## Fonctionnalités

- **3 modes de jeu** : Pays (trouver le pays), Drapeaux (identifier le pays d'un drapeau), Capitales (trouver le pays d'une capitale)
- **3 langues** : Français, English, Español
- **167 pays** du monde entier
- **Globe 3D** interactif avec rotation tactile et souris
- **Accélération progressive** : plus tu restes appuyé sur le bouton, plus la poule plonge vite !
- **Feedback animé** : poule contente si c'est juste, poule qui pointe le bon pays si c'est faux
- **Confettis** en cas de bonne réponse
- **Recentrage automatique** sur le bon pays en cas de mauvaise réponse

## Comment jouer

1. Choisis ta langue et ton mode de jeu sur l'écran d'accueil
2. Un pays, un drapeau ou une capitale s'affiche à l'écran
3. Fais tourner le globe pour positionner le bon pays sous le viseur
4. La poule plonge et atterrit — est-ce le bon pays ?
5. Appuie sur **Accélérer** pour aller plus vite si tu es sûr(e) de toi !

### Contrôles

- **Glisser (souris / un doigt)** — faire tourner le globe
- **Deux doigts (rotation)** — incliner le globe (libre aux pôles)
- **Bouton Accélérer** — accélère la descente de la poule (plus tu restes appuyé, plus ça accélère !)

## Lancer le projet

Ouvre `index.html` dans ton navigateur, ou lance un serveur local :

```bash
python3 -m http.server 8080
```

Puis ouvre `http://localhost:8080`.

## Technologies

- HTML, CSS, JavaScript (vanilla, aucune dépendance npm)
- [Three.js r128](https://threejs.org/) (CDN) pour le rendu 3D du globe
- Google Fonts (Playfair Display, Poppins)
- Déployé via GitHub Pages depuis la branche `main`
