/**
 * Demo catalogue — ported from the Claude Design prototype
 * "Power Apps Mobile.dc.html" (projet « Design hifi basé sur artefact »).
 *
 * TWO KINDS OF ROW
 * ----------------
 * `ready: true`  — the capability is really implemented, the row opens a screen
 *                  that actually calls the device. `route` is required.
 * `ready: false` — the capability is announced by the platform but the current
 *                  Private Preview template cannot do it yet. The row renders
 *                  greyed with a « Bientôt » pill and is not pressable. It has
 *                  no `route`: a page that fakes a capability has no place in a
 *                  demonstrator. `blockedBy` records *why*, so the day the
 *                  template ships the package the row can be promoted without
 *                  re-researching it.
 *
 * Copy is the prototype's, minus claims this app does not honour: no Dataverse
 * upload (the app is connector-only) and no haptic feedback (see `haptics`).
 */

import type { Ionicons } from '@expo/vector-icons';

export type DemoGroup = 'media' | 'sensors' | 'system';
export type TagTone = 'tint' | 'green' | 'amber' | 'blue';

export type DemoRoute =
  | '/photo'
  | '/qr-code'
  | '/voice'
  | '/geolocation'
  | '/swipe'
  | '/face-id'
  | '/toasts';

export type DemoTag = { label: string; tone: TagTone };

type DemoBase = {
  id: string;
  group: DemoGroup;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  /** Row title. */
  title: string;
  /** Row subtitle. */
  subtitle: string;
  /** Detail-screen lead paragraph. */
  long: string;
  tags: DemoTag[];
  bullets: string[];
};

export type ReadyDemo = DemoBase & {
  ready: true;
  route: DemoRoute;
  /** Placeholder caption shown in the dark hero panel before anything runs. */
  hero: string;
  /** Primary button, idle state. */
  cta: string;
  /** Primary button while the capability is running. */
  running: string;
  /** Title of the result card once the capability has produced something. */
  resultLabel: string;
};

export type UpcomingDemo = DemoBase & {
  ready: false;
  /** Why it cannot ship today. Shown nowhere; kept for the next maintainer. */
  blockedBy: string;
};

export type Demo = ReadyDemo | UpcomingDemo;

export const GROUP_LABELS: Record<DemoGroup, string> = {
  media: 'MÉDIA',
  sensors: 'CAPTEURS',
  system: 'SYSTÈME',
};

/** Segmented-control order, matching the prototype. */
export const GROUP_ORDER: DemoGroup[] = ['media', 'sensors', 'system'];

export const SEGMENTS: { key: 'all' | DemoGroup; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'media', label: 'Média' },
  { key: 'sensors', label: 'Capteurs' },
  { key: 'system', label: 'Système' },
];

export const DEMOS: Demo[] = [
  // ─── MÉDIA ────────────────────────────────────────────────────────────────
  {
    id: 'photo',
    ready: true,
    route: '/photo',
    group: 'media',
    icon: 'camera-outline',
    title: 'Prise de photo',
    subtitle: 'Caméra, galerie et recadrage',
    long: "Capturer une photo depuis l'appareil ou la choisir dans la galerie, la recadrer, et récupérer ses métadonnées.",
    hero: '[Aperçu caméra]',
    cta: 'Prendre une photo',
    running: 'Capture…',
    tags: [
      { label: 'Caméra', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
      { label: 'Autorisation requise', tone: 'amber' },
    ],
    bullets: [
      "Demande d'autorisation native",
      'Capture caméra ou sélection galerie',
      'Recadrage à la capture',
      'Annulation et refus gérés explicitement',
    ],
    resultLabel: 'Photo capturée',
  },
  {
    id: 'qr',
    ready: true,
    route: '/qr-code',
    group: 'media',
    icon: 'qr-code-outline',
    title: 'Lecture de QR code',
    subtitle: 'QR, EAN-13 et Code 128',
    long: "Scanner un code et renvoyer la valeur dans l'écran, sans quitter la page.",
    hero: '[Aperçu caméra — viseur]',
    cta: 'Lancer le scan',
    running: 'Scan…',
    tags: [
      { label: 'Caméra', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
      { label: 'Autorisation requise', tone: 'amber' },
    ],
    bullets: [
      "Demande d'autorisation native",
      'Décodage QR, EAN-13 et Code 128',
      'Verrou anti double-lecture',
      "Valeur renvoyée à l'écran appelant",
    ],
    resultLabel: 'Code détecté',
  },
  {
    id: 'voice',
    ready: true,
    route: '/voice',
    group: 'media',
    icon: 'mic-outline',
    title: 'Mémo vocal',
    subtitle: 'Enregistrement et lecture audio',
    long: 'Enregistrer une note audio, la réécouter, et récupérer sa durée et son fichier.',
    hero: "[Forme d'onde audio]",
    cta: 'Enregistrer',
    running: 'Enregistrement…',
    tags: [
      { label: 'Micro', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
      { label: 'Autorisation requise', tone: 'amber' },
    ],
    bullets: [
      "Demande d'autorisation micro native",
      'Niveau sonore affiché pendant la prise',
      'Relecture avec progression',
      'Refus du micro géré explicitement',
    ],
    resultLabel: 'Mémo enregistré',
  },
  {
    id: 'sign',
    ready: false,
    group: 'media',
    icon: 'create-outline',
    title: 'Signature manuscrite',
    subtitle: 'Tracé tactile exporté en image',
    long: "Faire signer le client à l'écran et exporter le tracé en image.",
    tags: [
      { label: 'Tactile', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
    ],
    bullets: [
      'Tracé lissé au doigt ou au stylet',
      'Effacer et recommencer',
      'Export PNG horodaté',
    ],
    blockedBy:
      "@microsoft/power-apps-native-pen-input absent du template. Le plugin a pourtant un helper dédié (/add-native pen-input) : promouvoir la ligne dès que le package est livré.",
  },
  {
    id: 'ar',
    ready: false,
    group: 'media',
    icon: 'cube-outline',
    title: 'Réalité augmentée',
    subtitle: 'Superposition 3D sur la caméra',
    long: "Caler une procédure ou une cote directement sur l'équipement filmé.",
    tags: [
      { label: 'ARKit / ARCore', tone: 'tint' },
      { label: 'Caméra', tone: 'blue' },
    ],
    bullets: [
      'Ancrage sur surface détectée',
      'Mesure de distances à la caméra',
      "Projection d'un équipement à l'échelle",
    ],
    blockedBy:
      "Aucun package AR dans le template. Cité comme bénéfice du natif dans la doc produit, listé par /add-native parmi les capacités « until the template adds them ».",
  },

  // ─── CAPTEURS ─────────────────────────────────────────────────────────────
  {
    id: 'geo',
    ready: true,
    route: '/geolocation',
    group: 'sensors',
    icon: 'location-outline',
    title: 'Géolocalisation',
    subtitle: 'Position, précision et adresse',
    long: 'Relever la position courante, sa précision, et la convertir en adresse lisible.',
    hero: '[Relevé GPS]',
    cta: 'Relever ma position',
    running: 'Localisation…',
    tags: [
      { label: 'GPS', tone: 'tint' },
      { label: 'Autorisation requise', tone: 'amber' },
      { label: 'Premier plan', tone: 'blue' },
    ],
    bullets: [
      "Demande d'autorisation native",
      'Précision et horodatage affichés',
      'Géocodage inverse en adresse',
      'Services de localisation coupés détectés',
    ],
    resultLabel: 'Position relevée',
  },
  {
    id: 'swipe',
    ready: true,
    route: '/swipe',
    group: 'sensors',
    icon: 'swap-horizontal-outline',
    title: 'Swipe et appui long',
    subtitle: 'Actions sur cartes pleine largeur',
    long: 'Traiter une tournée au pouce : glisser une carte pour la terminer ou la reporter, appui long pour le menu contextuel.',
    hero: "[Cartes d'intervention]",
    cta: 'Réinitialiser les cartes',
    running: 'Réinitialisation…',
    tags: [
      { label: 'Tactile', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
    ],
    bullets: [
      'Seuil de validation à 90 px',
      'Rail coloré et libellé pendant le geste',
      'Appui long 0,5 s : le menu s’ouvre sans relâcher',
      'Vibration à l’ouverture du menu (sans expo-haptics)',
    ],
    resultLabel: 'Cartes réinitialisées',
  },
  {
    id: 'haptics',
    ready: false,
    group: 'sensors',
    icon: 'pulse-outline',
    title: 'Retour haptique',
    subtitle: 'Vibrations Taptic à la validation',
    long: 'Confirmer une action par une impulsion Taptic plutôt que par un message.',
    tags: [
      { label: 'Taptic Engine', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
    ],
    bullets: [
      'Impacts léger, moyen et fort',
      'Motifs succès, alerte et erreur',
      'Retour à la validation d’un geste',
    ],
    blockedBy:
      "expo-haptics est bien dans package.json (55.0.16) mais son module natif n'est PAS embarqué dans le binaire de rewrap : Haptics.impactAsync() throw au premier appel. Banni par agents/screen-builder.md:266. Il ne manque qu'un bundling côté binaire.",
  },

  // ─── SYSTÈME ──────────────────────────────────────────────────────────────
  {
    id: 'faceid',
    ready: true,
    route: '/face-id',
    group: 'system',
    icon: 'scan-outline',
    title: 'Face ID',
    subtitle: 'Déverrouillage biométrique',
    long: "Protéger l'accès par authentification biométrique, avec repli sur le code de l'appareil.",
    hero: '[Invite biométrique]',
    cta: 'Déverrouiller',
    running: 'Authentification…',
    tags: [
      { label: 'Biométrie', tone: 'tint' },
      { label: 'Autorisation requise', tone: 'amber' },
    ],
    bullets: [
      "Face ID ou Touch ID selon l'appareil",
      'Repli sur le code de verrouillage',
      'Absence de capteur ou de biométrie enrôlée détectée',
      'Aucun gabarit biométrique ne transite par l’app',
    ],
    resultLabel: 'Authentifié',
  },
  {
    id: 'toasts',
    ready: true,
    route: '/toasts',
    group: 'system',
    icon: 'chatbox-ellipses-outline',
    title: 'Toasts et alertes',
    subtitle: 'Messages système natifs',
    long: "Confirmer une action avec le toast ou l'alerte du système, plutôt qu'avec un bandeau dessiné par l'app.",
    hero: '[Toast système]',
    cta: 'Afficher le toast',
    running: 'Affichage…',
    tags: [
      { label: 'UI système', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
      { label: 'Complet sur iOS', tone: 'blue' },
    ],
    bullets: [
      'Toast discret en haut ou en bas (iOS)',
      'Alerte centrée : succès, erreur, favori',
      'Spinner pendant un envoi, puis confirmation',
      'Vibration jouée par le système (iOS), sans expo-haptics',
    ],
    resultLabel: 'Dernier message',
  },
  {
    id: 'offline',
    ready: false,
    group: 'system',
    icon: 'cloud-offline-outline',
    title: 'Mode hors-ligne',
    subtitle: "File d'attente et synchronisation",
    long: "Travailler sans réseau et rejouer la file d'attente dès la reconnexion.",
    tags: [
      { label: 'Dataverse', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
    ],
    bullets: [
      'Cache local chiffré',
      "File d'attente avec état par élément",
      'Reprise automatique au retour du réseau',
    ],
    blockedBy:
      '@microsoft/power-apps-native-offline EST installé (0.1.32), mais le mode hors-ligne repose sur un Mobile Offline Profile Dataverse. Cette app est connector-only et ne possède aucune table : il faut d’abord un modèle de données.',
  },
  {
    id: 'nfc',
    ready: false,
    group: 'system',
    icon: 'radio-outline',
    title: 'Lecture NFC',
    subtitle: 'Badge et tag sur iPhone',
    long: 'Lire un badge ou un tag NFC et pré-remplir la fiche équipement.',
    tags: [
      { label: 'NFC', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
      { label: 'iPhone 7+', tone: 'blue' },
    ],
    bullets: [
      'Lecture NDEF',
      'Identifiant équipement pré-rempli',
      'Saisie manuelle en repli',
    ],
    blockedBy:
      "Aucun package NFC dans le template. Explicitement cité comme bénéfice du natif dans la doc produit (learn.microsoft.com/power-apps/mobile/native-apps/overview) et listé par /add-native parmi les capacités « until the template adds them ».",
  },
  {
    id: 'ble',
    ready: false,
    group: 'system',
    icon: 'bluetooth-outline',
    title: 'Bluetooth LE',
    subtitle: 'Balises et capteurs appairés',
    long: 'Dialoguer avec une balise, un capteur industriel ou une imprimante portable.',
    tags: [
      { label: 'BLE', tone: 'tint' },
      { label: 'Fonctionne hors-ligne', tone: 'green' },
    ],
    bullets: [
      'Découverte des périphériques proches',
      'Localisation intérieure par balise',
      'Lecture de capteurs et impression étiquette',
    ],
    blockedBy:
      "Aucun package BLE dans le template. Cité comme bénéfice du natif dans la doc produit, listé par /add-native parmi les capacités « until the template adds them ».",
  },
  {
    id: 'push',
    ready: false,
    group: 'system',
    icon: 'notifications-outline',
    title: 'Notifications push',
    subtitle: 'Alertes hors application',
    long: "Alerter le technicien d'une intervention urgente, application fermée.",
    tags: [
      { label: 'Push', tone: 'tint' },
      { label: 'Autorisation requise', tone: 'amber' },
    ],
    bullets: [
      "Demande d'autorisation native",
      'Notification actionnable',
      'Ouverture directe sur la bonne fiche',
    ],
    blockedBy:
      "expo-notifications absent du template, et les notifications push sont explicitement listées dans la section Limitations de la doc produit — non supportées en Private Preview, pas seulement non livrées.",
  },
];

export const READY_DEMOS = DEMOS.filter((demo): demo is ReadyDemo => demo.ready);

export function findDemo(id: string): Demo | undefined {
  return DEMOS.find((demo) => demo.id === id);
}

/** Narrowed lookup for the detail screens, which only ever render ready demos. */
export function findReadyDemo(id: string): ReadyDemo | undefined {
  return READY_DEMOS.find((demo) => demo.id === id);
}
