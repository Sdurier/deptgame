# Atlas des Départements

Application web interactive en React permettant d'apprendre et de tester ses connaissances sur les **101 départements français** (96 départements de France métropolitaine et 5 DROM).

---

## Prompt initial

> application web (en react) affichant une carte des départements de France (y compris les Droms mis à gauche de la carte sur l'océan atlantique. le principe de l'application est de faire deviner soit où se trouve un département quand on donne son nom ou son code (l'utilisateur doit cliquer sur la carte) ; soit donner le nom du département ou son code si un département est mis en surbrillance sur la carte (zone de texte pour répondre)

---

## Fonctionnalités

- **Cliquer sur la carte** : un nom et/ou un numéro de département est affiché (`Nom+N°`, `Nom` seul ou `N°` seul) et l'utilisateur doit le localiser sur la carte (3 essais maximum, indices progressifs région/préfecture, flash immédiat indiquant le département cliqué en cas d'erreur).
- **Nommer par texte** : un département est mis en surbrillance sur la carte avec un repère visuel et l'utilisateur saisit son nom ou son code officiel dans une zone de texte.
- **Mode Explorateur** : consultation libre de la carte avec recherche par nom, code, préfecture ou région, et affichage optionnel des numéros.
- **Périmètre modulable** : Tout (`101`), Métropole (`96`) ou DROM (`5`), par séries de `10`, `20` ou tous les départements, avec révision ciblée des erreurs en fin de série.
- **Ergonomie cartographique** : encarts DROM positionnés à gauche sur l'océan Atlantique, loupe dédiée pour la Petite Couronne (`75`, `92`, `93`, `94`) en haut à droite, zoom/panoramique souris et tactile.

---

## Origine des données et traitements

### 1. Source des contours géographiques

Les géométries vectorielles proviennent du dépôt open-source **`france-geojson`** (Grégoire David), construit à partir des données officielles **IGN / Admin Express** et OpenStreetMap (Licence Ouverte) :

- `departements-version-simplifiee.geojson` : contours des **96 départements de France métropolitaine** (`01` à `95`, incluant `2A` Corse-du-Sud et `2B` Haute-Corse).
- `departements-avec-outre-mer.geojson` : extraction des **5 DROM** (`971` Guadeloupe, `972` Martinique, `973` Guyane, `974` La Réunion, `976` Mayotte).

### 2. Traitements cartographiques (`src/data/franceMapData.json`)

Les fichiers GeoJSON bruts (~4,1 Mo au total) ont été transformés en un fichier JSON prêt pour le rendu SVG (`viewBox="0 0 1000 840"`, environ 162 Ko) via les étapes suivantes :

1. **Projections adaptées par zone** :
   - **Métropole** : projection **conique conforme de Lambert** centrée sur `46,5° N / 2,35° E` avec parallèles standards à `44° N` et `49° N`, cadrée dans la zone principale droite (`x: 210..965`, `y: 30..810`).
   - **DROM (Atlantique)** : projection de **Mercator** centrée individuellement dans 5 encarts empilés à gauche de la carte (`x: 24..156`), afin de respecter les proportions de chaque territoire d'outre-mer sans chevauchement avec la Bretagne.
   - **Loupe Petite Couronne** : re-projection Lambert agrandie des départements `75`, `92`, `93` et `94` dans un encart en haut à droite (`x: 836..982`, `y: 24..170`) relié à Paris par un trait de rappel, afin de rendre ces petits départements facilement cliquables sur ordinateur comme sur smartphone.
2. **Simplification et nettoyage géométrique** :
   - Simplification des tracés par l'algorithme de **Douglas-Peucker** (tolérance `0,45 px` pour la métropole et les DROM, `0,35 px` pour la loupe Petite Couronne) afin de réduire le poids tout en gardant des frontières nettes et jointives.
   - Filtrage des micro-îlots inférieurs à `1,2 px²` en métropole (`0,8 px²` pour les DROM, `0,5 px²` en Petite Couronne) lorsque le département comporte plusieurs polygones.
   - Arrondi des coordonnées SVG au dixième de pixel (`toFixed(1)`).
3. **Pré-calcul des métriques spatiales** :
   - Calcul pour chaque département de sa boîte englobante (`bbox`), de son aire projetée (`area`, utilisée pour trier le rendu SVG et garder les petits départements comme Paris cliquables au premier plan) et de son centroïde (`cx`, `cy`, utilisé pour les repères animés et les étiquettes).
   - Contrôle automatique des 101 entrées et de l'absence de chevauchement entre les encarts (DROM / Finistère et Petite Couronne / Grand Est).

*Note : les collectivités d'outre-mer qui ne sont pas des DROM (Saint-Barthélemy, Saint-Martin, Saint-Pierre-et-Miquelon, Polynésie française, Wallis-et-Futuna, Nouvelle-Calédonie) ne font pas partie des 101 départements et ne sont donc pas incluses.*

### 3. Métadonnées et validation des réponses (`src/data/departmentsMeta.ts`)

- **Référentiel administratif** : fiche complète pour chacun des 101 départements (code officiel, nom exact, préfecture actuelle — dont *Évry-Courcouronnes* — et région administrative en vigueur).
- **Moteur de correspondance tolérant** (`checkDepartmentAnswer`) :
  - **Codes** : accepte les codes avec ou sans zéro initial (`1` → `01`), la Corse (`2A`, `2B` insensibles à la casse) et les codes DROM à 3 chiffres (`971` à `976`).
  - **Noms** : normalisation Unicode `NFD` (suppression des accents et cédilles), suppression de la ponctuation (`-`, `'`, espaces), acceptation des formes sans article (`reunion` pour *La Réunion*), de variantes courantes (`belfort`, `cote dor`, `val doise`) et tolérance aux fautes de frappe via distance de Levenshtein (1 erreur à partir de 6 caractères, 2 à partir de 10 caractères).

---

## Développement, export et déploiement

### Prérequis
- Node.js 22+ (ou 20+)

### Commandes locales

```bash
npm install --legacy-peer-deps
npm run dev       # Serveur local sur http://localhost:3000
npm run lint      # Vérification TypeScript
npm run build     # Génère un fichier autonome dist/index.html (via vite-plugin-singlefile)
```

### Déploiement automatique (GitHub Pages)
Le workflow `.github/workflows/deploy.yml` compile et publie automatiquement le site sur **GitHub Pages** à chaque push sur `main` ou `master` (après activation de **Settings → Pages → Source : GitHub Actions**).
