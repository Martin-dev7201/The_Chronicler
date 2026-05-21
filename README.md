# 🎧 The Chronicler (VinylHube) 🎸

[![Flutter](https://img.shields.io/badge/Flutter-Stable-02569B?logo=flutter&logoColor=white)](https://flutter.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com)
[![CI/CD](https://img.shields.io/badge/Codemagic-Pipeline-00E5FF?logo=codemagic&logoColor=black)](https://codemagic.io)

> *"Gimme fuel, gimme fire, gimme that which I desire!"* — Metallica.  
> **The Chronicler** est l'application ultime pour les passionnés de musique et les collectionneurs de vinyles, conçue pour répertorier, organiser et sublimer votre collection de galettes noires directement depuis votre smartphone.

---

## ⚡ Fonctionnalités majeures

- **🗃️ Gestion de Collection en Temps Réel** : Ajoutez vos albums et consultez leurs détails à la vitesse de l'éclair grâce à une synchronisation parfaite avec **Firebase Cloud Firestore**.
- **🎨 Palette de Couleurs Dynamique** : Grâce à l'intégration de `palette_generator`, l'application extrait automatiquement les couleurs dominantes de la pochette du vinyle pour adapter l'interface de manière unique sur chaque écran de détail.
- **🚀 Prêt pour le Sideloading (AltStore / SideStore)** : Pipeline CI/CD automatisé avec Codemagic pour compiler des fichiers `.ipa` non signés, prêts à être balancés sur votre iPhone sans compte développeur payant.

---

## 🛠️ Stack Technique

* **Framework :** [Flutter](https://flutter.dev) (Dart)
* **Base de données :** [Firebase Firestore](https://firebase.google.com/)
* **CI/CD / Distribution :** [Codemagic](https://codemagic.io)
* **Packages clés :** `palette_generator`, `firebase_core`, `cloud_firestore`, `flutter_hooks`.

---

## 🚀 Démarrage Rapide (Local)

Pour lancer les balances sur votre machine locale, assurez-vous d'avoir installé le SDK Flutter, puis suivez la feuille de route :

1. **Cloner le dépôt :**
   ```bash
   git clone [https://github.com/VOTRE_NOM_UTILISATEUR/the_chronicler.git](https://github.com/VOTRE_NOM_UTILISATEUR/the_chronicler.git)
   cd the_chronicler
