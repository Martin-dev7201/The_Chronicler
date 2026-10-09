# 💿 THE_CHRONICLER

**THE_CHRONICLER** est une application web permettant de créer, organiser et explorer sa collection de vinyles.

L'objectif du projet est d'aller plus loin qu'une simple liste de disques : chaque vinyle doit disposer de sa propre fiche avec ses informations, son édition, sa tracklist, ses écoutes et, à terme, des informations complémentaires sur l'album et l'artiste.

Le projet est actuellement en développement.

---

## 🎯 Objectif

THE_CHRONICLER doit permettre de centraliser sa collection de vinyles dans une interface simple, sombre et pensée autour des pochettes d'albums.

L'application s'articule autour de plusieurs espaces :

- 📊 Tableau de bord
- 💿 Collection
- ♡ Liste d'envies
- 👥 Communauté
- 👤 Profil
- ⚙️ Paramètres

Une fiche détaillée est également prévue pour chaque vinyle.

---

# 🖥️ Interface

La nouvelle interface V3 est actuellement développée en priorité pour ordinateur.

Elle utilise une navigation latérale fixe avec :

- Tableau de bord
- Collection
- Liste d'envies
- Communauté
- Profil
- Paramètres

Une barre de recherche générale est également présente en haut de l'application.

Le design repose sur une interface :

- sombre ;
- minimaliste ;
- centrée sur les pochettes ;
- avec des accents bordeaux ;
- adaptée à une utilisation sur ordinateur.

L'adaptation mobile sera réalisée dans une étape ultérieure.

---

# 📊 Tableau de bord

Le tableau de bord donne un aperçu rapide de la collection.

Il peut actuellement afficher notamment :

- le nombre de vinyles ;
- le nombre d'artistes différents ;
- le nombre de genres représentés ;
- le nombre total d'écoutes enregistrées ;
- les derniers vinyles ajoutés ;
- les artistes les plus présents ;
- une répartition des genres ;
- un aperçu de la liste d'envies.

Les statistiques sont calculées automatiquement à partir des données de la collection.

---

# 💿 Collection

La page Collection permet d'afficher les vinyles sous forme de grille.

Chaque carte peut contenir :

- la pochette ;
- le titre ;
- l'artiste ;
- l'année ;
- le genre.

La collection peut être :

- recherchée ;
- filtrée ;
- triée.

Les données de la V3 utilisent encore temporairement le stockage local du navigateur (`localStorage`).

Une migration complète vers Supabase est prévue.

---

# ♡ Liste d'envies

La Liste d'envies permet de conserver les albums que l'utilisateur souhaite trouver ou acheter.

Il est actuellement possible de renseigner :

- l'artiste ;
- le titre de l'album ;
- l'année ;
- le genre ;
- la pochette ;
- une note personnelle.

Un vinyle peut ensuite être transféré de la Liste d'envies vers la Collection lorsqu'il est acheté.

La recherche Discogs sera également intégrée à cette partie afin d'éviter de saisir manuellement toutes les informations.

---

# 🎵 Fiche vinyle

La fiche détaillée d'un vinyle est en cours de développement.

L'objectif est d'y retrouver :

### Présentation

- pochette ;
- représentation du disque ;
- couleur correspondant à l'édition ;
- titre ;
- artiste ou groupe ;
- logo de l'artiste ou du groupe ;
- année ;
- genre et styles ;
- label ;
- informations sur l'édition.

### Contenu

La fiche pourra également contenir :

- une présentation ou histoire de l'album ;
- des notes personnelles ;
- le nombre d'écoutes.

### Tracklist

Les morceaux seront organisés par :

- disque ;
- face A / B ;
- position ;
- titre ;
- durée.

### Streaming

L'objectif est également de proposer des raccourcis vers différents services de streaming, par exemple :

- YouTube ;
- Spotify ;
- Apple Music ;
- Deezer.

### Suggestions

La fiche pourra proposer d'autres albums selon plusieurs critères :

- même groupe ou artiste ;
- même style ;
- projets liés aux membres du groupe ;
- autres recommandations.

---

# 🔎 Discogs

THE_CHRONICLER utilise l'API Discogs pour rechercher des vinyles.

La recherche passe par une **Supabase Edge Function**.

Cela permet notamment de ne pas exposer le token privé Discogs directement dans le navigateur.

La recherche Discogs sert à récupérer les informations nécessaires lors de l'ajout d'un vinyle.

---

# 🔐 Authentification

L'authentification est gérée avec **Supabase Auth**.

Le projet prend en charge la connexion par :

- adresse e-mail ;
- mot de passe.

L'interface peut également afficher l'état de connexion de l'utilisateur dans la barre latérale.

Chaque compte aura à terme sa propre collection synchronisée.

---

# ☁️ Supabase

Supabase est utilisé pour le backend du projet.

Il est prévu pour gérer :

- l'authentification ;
- la base de données ;
- les collections ;
- les listes d'envies ;
- la synchronisation entre appareils ;
- les Edge Functions.

La table `vinyls` utilise Row Level Security (RLS) afin que chaque utilisateur puisse uniquement accéder à ses propres vinyles.

---

# 🗂️ Structure du projet

La structure évolue progressivement vers :

```text
The_Chronicler/
│
├── index.html
│
├── accueil.html
├── dashboard.html
├── wishlist.html
├── vinyl.html
├── communaute.html
├── profil.html
├── parametres.html
│
├── Css/
│   ├── style.css
│   └── v3.css
│
└── js/
    ├── auth.js
    ├── lookup.js
    ├── nav.js
    ├── accueil.js
    ├── dashboard.js
    ├── wishlist.js
    └── vinyl.js
