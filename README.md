# THE_CHRONICLER

Application web personnelle pour organiser une collection de vinyles.

## Version incluse dans cette archive

Cette sauvegarde regroupe la V3 desktop actuelle avec :

- connexion / création de compte via Supabase Auth ;
- tableau de bord ;
- collection ;
- ajout d'un vinyle via Discogs ;
- liste d'envies ;
- fiche détaillée d'un vinyle ;
- pages placeholder Communauté, Profil et Paramètres.

## Lancer le projet

Ouvre le dossier dans VS Code, puis lance `index.html` ou `connexion.html` avec **Live Server**.

Exemple :

```text
http://127.0.0.1:5500/
```

Évite d'ouvrir les pages avec `file:///...`, car Supabase Auth et le stockage navigateur sont plus fiables avec un serveur local.

## Organisation

```text
The_Chronicler/
├── index.html
├── connexion.html
├── ajouter.html
├── accueil.html
├── dashboard.html
├── wishlist.html
├── vinyl.html
├── communaute.html
├── profil.html
├── parametres.html
├── Css/
│   ├── v3.css
│   ├── auth.css
│   └── ajouter.css
└── js/
    ├── lookup.js
    ├── auth.js
    ├── session-guard.js
    ├── ajouter.js
    ├── accueil.js
    ├── dashboard.js
    ├── wishlist.js
    └── vinyl.js
```

## Données

L'authentification utilise Supabase. La collection et la wishlist utilisent encore `localStorage` (`vv_items` et `vv_wishlist`) dans cette version. La migration complète des vinyles vers Supabase reste à faire.

## Branche de travail

`design-v3-desktop`
