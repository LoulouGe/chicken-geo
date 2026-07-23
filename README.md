# Geo Quiz

Un clone fidèle de Seterra pour apprendre la géographie en s'amusant, avec un globe 3D en plus ! Choisis un globe 3D ou une carte plate, puis clique sur la bonne réponse — tu restes sur la question jusqu'à trouver la bonne réponse.

Jouer en ligne : https://loulouge.github.io/chicken-geo/

## Fonctionnalités

- **2 plateaux** : Globe 3D interactif (rotation tactile et souris) ou Carte plate 2D
- **3 modes de jeu** : Continent et Océans (trouver un continent ou un océan), Pays (trouver le pays), Capitales (trouver le pays d'une capitale)
- **Zones** : Monde entier ou un continent précis (pour Pays / Capitales)
- **Style Seterra** : fond de carte vert uni, océan bleu-gris uni, fines frontières blanches, typographie grasse italique
- **3 langues** : Français, English, Español
- **168 pays** du monde entier
- **Reste sur la question** : un clic faux affiche juste une pastille d'indice ("Clique sur ...") et ne fait pas avancer la partie ; seul un clic juste ou le bouton **Passer** fait avancer
- **Chronomètre** qui compte le temps écoulé (pas de compte à rebours ni d'échec automatique)
- **Pourcentage de réussite** et bouton **Rejoue tes erreurs** en fin de partie pour retravailler uniquement ce qui a été raté (raté = passé, pas juste une erreur de clic)

## Comment jouer

1. Choisis ta langue, puis le Globe 3D ou la Carte
2. Choisis un mode : Continent et Océans, Pays ou Capitale
3. Pour Pays / Capitale, choisis Monde ou un continent précis
4. Un pays, un continent ou une capitale s'affiche à l'écran
5. Clique sur la bonne réponse, sur le globe ou la carte — si tu te trompes, réessaie ; utilise Passer si tu ne trouves pas
6. À la fin du quiz (tous les éléments passés en revue), retrouve ton pourcentage de réussite et rejoue tes erreurs si besoin

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
- Google Fonts (Poppins)
- Déployé via GitHub Pages depuis la branche `main`
