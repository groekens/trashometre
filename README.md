# Trashometre · Rixensart 2026

PWA de suivi des déchets ménagers pour la commune de Rixensart.  
Calcul automatique de la taxe proportionnelle (barème 2026) — conteneurs à puce.

## Fonctionnalités

- Enregistrement de chaque levée (conteneur noir / vert) avec poids optionnel
- Suivi en temps réel vs quotas annuels inclus dans la taxe forfaitaire
- Calcul du surcoût proportionnel selon le barème officiel 2026
- Projection de fin d'année basée sur le rythme actuel
- Persistance locale (localStorage) ou cloud (Firebase Firestore)
- Authentification Google optionnelle pour sync multi-appareils
- Installable comme application (PWA)

## Déploiement sur GitHub Pages

1. Créez un repo GitHub (ex. `poubelles-rixensart`)
2. Déposez tous les fichiers à la racine
3. Dans Settings > Pages, choisissez **Branch: main / root**
4. Accédez à `https://[votre-username].github.io/poubelles-rixensart/`

## Configuration Firebase (optionnel)

Sans Firebase, l'app fonctionne entièrement en local via `localStorage`.  
Pour activer la sync cloud :

1. Allez sur [console.firebase.google.com](https://console.firebase.google.com)
2. Créez un projet (ex. `poubelles-rixensart`)
3. Activez **Authentication > Google**
4. Activez **Firestore Database** (mode production, région `europe-west1`)
5. Copiez votre config dans `index.html` :

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};
```

### Règles Firestore

Dans la console Firebase > Firestore > Règles :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Icônes PWA

Créez un dossier `icons/` avec :
- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

Ou générez-les sur [maskable.app](https://maskable.app/editor).

## Barème 2026 implémenté

### Taxe forfaitaire
| Ménage | Forfait |
|--------|---------|
| 1 pers | 70 €/an |
| 2 pers | 105 €/an |
| 3 pers | 140 €/an |
| 4+ pers | 181 €/an |

### Service minimum inclus
| | Conteneur noir | Conteneur vert |
|--|--|--|
| Levées | 8/ménage | 20/ménage |
| Poids | 15 kg/pers (1p) / 12 kg/pers (2p+) | 35 kg/pers |

### Tarifs proportionnels
**Conteneur noir — levées supplémentaires**
- 1,60 €/levée (9e à 12e)
- 2,00 €/levée (13e et au-delà)

**Conteneur noir — kg supplémentaires**
- 0,60 €/kg jusqu'à 50 kg/pers/an
- 1,00 €/kg de 51 à 90 kg/pers/an
- 2,00 €/kg au-delà de 90 kg/pers/an

**Conteneur vert — levées supplémentaires**
- 1,00 €/levée

**Conteneur vert — kg supplémentaires**
- 0,20 €/kg/habitant/an
