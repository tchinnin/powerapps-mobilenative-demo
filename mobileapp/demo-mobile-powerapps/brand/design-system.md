# demo mobile powerapps — Design System
Generated: 2026-09-22 | Direction: iOS-native démonstrateur

## Brand
- Identity: démonstrateur des capacités natives de Power Apps Mobile — une page par capacité.
- Voice: factuel, court, en français. Le contenu décrit ce que la capacité démontre, sans marketing.
- References: Réglages iOS, App Store (listes groupées), Expo Go.
- Brand notes: extrait du canvas Claude Design « Power Apps Mobile — démonstrateur »
  (https://claude.ai/artifact/WSP9Pq7yjg4RrQqP86cgJw), design system `power-apps-mobile`.

## Palette
| Token | Hex | Usage |
|---|---|---|
| bg | `#f2f2f7` | fond d'écran groupé iOS |
| surface | `#ffffff` | cartes, lignes de liste |
| primary | `#742774` | violet Power Apps — CTA, liens, icônes actives |
| accent | `#f4ecf4` | primary à 10 % — devient `$accentSoft` (fond des pastilles d’icône). Ne jamais le remettre égal au primary : glyphe violet sur fond violet |
| text | `#000000` | texte primaire |
| textMuted | `#6c6c70` | sous-titres, légendes, en-têtes de section |
| border | `#c6c6c8` | séparateurs de liste (opaque, dérivé de `#3c3c434a`) |

## Status palette
| Token | Hex |
|---|---|
| statusSuccess | `#1d7a35` |
| statusWarning | `#9a5000` |
| statusDanger | `#c9252d` |
| statusInfo | `#0f6cbd` |

## Typography
Pile système (`-apple-system` / SF Pro sur iOS, Roboto sur Android) — aucune police web chargée.

| Role | Family | Size | Weight | Line | Tracking |
|---|---|---|---|---|---|
| Display | System | 34 | 700 | 41 | +0.37 |
| Heading | System | 22 | 700 | 28 | +0.35 |
| Title | System | 17 | 600 | 22 | −0.41 |
| Body | System | 17 | 400 | 22 | −0.41 |
| Body-sm | System | 15 | 400 | 20 | −0.24 |
| Caption | System | 13 | 400 | 18 | −0.08 |
| Mono | Menlo | 14 | 400 | 20 | 0 |

## Spacing
4 / 8 / 12 / 16 / 24 / 32 / 48 / 64

## Components
### Button — primary, secondary, tertiary, destructive
- Primary: hauteur 50, radius 10, fond `primary`, texte blanc 17/600, pleine largeur, ancré en bas avec 16 de marge latérale et 44 du bas.
- Secondary: même gabarit, fond `surface`, texte `primary`.
- Tertiary: pas de fond, texte `primary` 17, zone tactile 44 minimum.
- Destructive: texte `statusDanger`, réservé aux actions irréversibles (aucune dans ce démonstrateur).

### Card — surface, border, radius, padding, shadow policy
Fond `surface`, radius 14, aucun contour, **aucune ombre** (les groupes iOS se distinguent par le fond `bg`). Padding interne 12/16. Séparateurs internes 1 px `border` indentés de la largeur de l'icône + gouttière.

### Input — height, border style, focus treatment
Hauteur 44, radius 10, fond `#7878801f` (gris système translucide), pas de contour, placeholder `textMuted`. Focus: pas d'anneau, curseur `primary`.

### List row — style, height, status indicator, chevron policy
Ligne 56 min, icône 30×30 radius 8 sur fond `accent` à 10 % (`#f4ecf4`), titre Title, sous-titre Body-sm `textMuted`, chevron 13 px `#3c3c434d` à droite. Toute la ligne est tactile.

### Badge / Status pill — size, bg, text treatment
Pastille radius `full`, padding 5/12, Caption 12/16 weight 500. Quatre tons:
`accentSoft`/`accentDeep` (capacité), `statusCompleteBg`/`statusComplete` (hors-ligne),
`statusPendingBg`/`statusPending` (autorisation), `statusInProgressBg`/`statusInProgress` (info).

### Segmented control — track, pill, states
Piste hauteur 32, padding 2, radius 16 sur `surface3`. Segment actif: `surface1`, radius 12,
ombre `0 1px 2px rgba(0,0,0,.12)`, texte weight 600. Inactif: transparent, weight 400. Quatre
segments à largeur égale.

### Hero panel — media preview
Hauteur 196, radius 16, fond `mediaSurface` (sombre dans les deux thèmes). Contenu par défaut:
texture de bandes diagonales à 4%, icône 48 en `accentBase`, scanline 132×2 balayant ±58 px en
2,6 s ease-in-out, légende monospace 11/14 en `accentOnAccent` à 72% en bas à gauche. Le contenu
réel (aperçu caméra, photo capturée) remplace entièrement ce placeholder.

### Result card — success state
Fond `surface1`, radius 14, padding 14/16. Pastille ronde 28 `statusCompleteBg` + coche
`statusComplete`, libellé 16/21 weight 600, valeur en monospace 13/18 `textMuted`. Entrée en
fondu + 8 px de translation, 220 ms ease-out.

### Iconography — icon set, style (outlined/filled)
`@expo/vector-icons` → Ionicons **outline**, stroke 1.7–2.2, 18 px en ligne, 24 px en en-tête. Jamais d'emoji.

## Motion
- Durée par défaut 200 ms, easing `ease-out`.
- Les listes apparaissent sans animation d'entrée échelonnée.
- Interdit: parallaxe, rebond, transitions de page personnalisées, spinners plein écran.

## Negatives (HARD RULES for screen-builder)
- ✗ Pas de retour haptique — `expo-haptics` est banni au runtime par le plugin, même s'il figure dans le template. Retour visuel uniquement.
- ✗ Pas de dégradés, pas d'ombres portées sur les cartes, pas de bordure colorée à gauche.
- ✗ Pas d'emoji dans l'UI.
- ✗ Pas de fausse barre d'état ni de faux encoche/indicateur home — le vrai safe-area s'en charge.
- ✗ Pas de hex brut dans les écrans — uniquement les tokens Tamagui (`$accentBase`, `$surface1`, `$text0`…).
- ✗ Pas de texte blanc sur `statusWarning` ou sur un fond clair : contraste 4.5:1 minimum.
- ✗ **Jamais `$text3` sur `$mediaSurface`.** Les tokens `text*` sont calibrés pour fond clair ; sur
  le panneau héros sombre il faut `$accentOnAccent` (éventuellement atténué par `opacity`).
- ✗ Pas de `animation="quick"` — la prop Tamagui n'est pas typée dans ce template. Utiliser
  `react-native-reanimated`.

## Provenance
- Direction: iOS-native démonstrateur
- Industry: productivity / developer demo
- Brand notes: projet Claude Design `54857710-fa36-492f-9465-9ef6c74fb4ac`, fichier
  `Power Apps Mobile.dc.html`. Remplace le canvas `WSP9Pq7yjg4RrQqP86cgJw` (historique).
- Generator: mobile-app 0.3.3 — tokens transcrits depuis le prototype, pas de style picker exécuté
- Source: design-project
