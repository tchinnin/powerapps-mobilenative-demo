# Memory Bank — Power Apps Native Code App

This file is the per-project notebook the agent maintains across `/create-mobile-app`, `/add-*`, `/edit-app`, `/list-connections`, and `/deploy` invocations. Treat it as the single source of truth for "what has been done in this project so far."

> **For agents:** Read this file at the start of any skill invocation. Update the relevant section after any successful action. Never delete entries — append, mark superseded.

---

## Project facts

| Key | Value |
|---|---|
| Display name | demo mobile powerapps |
| Slug | demo-mobile-powerapps |
| Scheme | demo-mobile-powerapps |
| iOS bundle id | `tech.chinnin.demopowerapps1` (set 2026-09-23, matches the Wrap project) |
| Android bundle id | `tech.chinnin.demopowerapps1` (set 2026-09-23) |
| Working directory | `/Users/tchinnin/git/TCH/powerapps-mobilenative-demo/mobileapp/demo-mobile-powerapps` |
| Plugin version that created the project | mobile-app 0.3.3 |
| Created | 2026-09-22 |
| Mockups | **Projet Claude Design** https://claude.ai/design/p/54857710-fa36-492f-9465-9ef6c74fb4ac — fichier `Power Apps Mobile.dc.html` (prototype interactif, 612 lignes). Remplace l'artifact canvas `WSP9Pq7yjg4RrQqP86cgJw`, conservé comme historique. |
| visual_companion | no (previews rendered on request only) |
| Metro logs | `.powernative/metro-logs/` — sanitized source used by `/debug-app`; do not copy ephemeral values from log filenames into this file |
| Metro launch command | `npm run dev` |

## Power Platform context

| Key | Value |
|---|---|
| Active environment ID | d6b0b2cd-588d-4cb1-b657-6a8ad7951d40 |
| Active environment name | DEV (Sandbox) |
| Environment URL | https://chinnin-tech-dev.crm4.dynamics.com |
| Power Apps CLI identity | theophile@chin-nin.tech (tenant be91cf8c-1bdb-4e16-9c30-5276f42e7e8b) |
| App registration (Entra) | `cd78c035-9fed-464c-90cb-e82d95be65f6` — « TEMP - Demo Mobile Native », réutilisée le 2026-09-22 via /set-app-registration-native |
| Solution unique name | _n/a — connector-only app, no Dataverse metadata written_ |
| Publisher prefix | _n/a — connector-only_ |
| `playerConfig.ts` last modified by | _untouched_ |
| App ID | `5d960c86-11be-4f60-9460-af5a77f4c6b5` — minted by the first push 2026-09-23 |
| Current version | v1.0.0 |
| Last deployed | 2026-09-23 (DEV) |
| App URL | https://apps.powerapps.com/play/e/d6b0b2cd-588d-4cb1-b657-6a8ad7951d40/a/5d960c86-11be-4f60-9460-af5a77f4c6b5?tenantId=be91cf8c-1bdb-4e16-9c30-5276f42e7e8b |

> **az note:** the Dataverse helper scripts take their token from `az`, whose default context was the
> `aglgroup.com` tenant. Run `az account set --subscription 1a97b4ad-ea5c-4f4b-a9cb-c4bd6164742d`
> before any Dataverse call so `az` sits on tenant `be91cf8c` (chin-nin.tech).

## Data model

**connector-only — no Dataverse in this app (decided 2026-09-22).** The photo and QR demos keep
their result in component state; nothing is persisted. No `.datamodel-manifest.json`, no generated
services, no offline profile. Run `/add-dataverse` if a later demo needs persistence.

### Reused tables
_<table name — when added — generated service file>_

### Extended tables
_<table name — extension columns — when added>_

### Created tables (Tier order)
_<table name — Tier — MetadataId — solution — relationships — when added>_

> **Why MetadataId + solution are recorded:** the `/add-dataverse` Step 5a pre-flight check uses these to distinguish "we own this table" (idempotent skip) from "name collision with someone else's table" (stop and prompt). Without the MetadataId we can't tell the two apart on a re-run.

### Collision history
_<table name — collision type (foreign / tombstone / reserved) — resolution (renamed / adopted / waited / prefix-switched) — when>_

## Offline profile

_Populated by `/setup-offline-profile`. Step 1b reads this section on every run to detect resume state (in-progress profile from a prior interrupted session)._

```yaml
status: none           # none | in-progress | done
profileId:             # mobileofflineprofile GUID, captured at Step 5
profileName:           # human-readable name
mode:                  # create-new | extend
publishedOn:           # ISO8601 timestamp from Step 8 publish
gate1:                 # pending | approved | rejected   (table prereqs)
gate2:                 # pending | approved | rejected   (per-table row scope)
gate3:                 # pending | approved | rejected   (relationships + columns + sync)
tablesCount:           # number of mobileofflineprofileitem rows
associationsCount:     # number of mobileofflineprofileitemassociation rows
```

> **Resume contract:** if `status: in-progress` is left across sessions, `/setup-offline-profile` Step 1b asks the user to resume or start fresh. Never leave `in-progress` past a session unless deliberate.

## Native capabilities

| Capability | Module | Wrapper file | When added | Justification |
|---|---|---|---|---|
| camera / image-picker | `expo-image-picker` | `src/native/camera.ts` | 2026-09-22 | démo « Prise de photo » — capture + galerie |
| barcode-scanner / qr | `expo-camera` | `src/native/barcodeScanner.tsx` | 2026-09-22 | démo « Lecture de QR code » |

> `expo-haptics` reste banni au runtime : la maquette mentionne un retour haptique à la détection,
> il a été remplacé par un retour visuel (cadre + carte résultat).

## Connectors

| Connector kind | Service file | Connection ID | Owner | When added |
|---|---|---|---|---|
| `shared_office365users` | `src/generated/services/Office365UsersService.ts` | `0797fce6301e423b83f9c2457d41c44b` (existante, Connected) | theophile@chin-nin.tech | 2026-09-22 — /add-connector |

Opérations utilisées : `MyProfile_V2($select)` et `UserPhoto_V2(id)`, via `src/hooks/useMyProfile.ts`.
Connection reference écrite par le CLI dans `power.config.json` → `f1ebc50e-…`.

**Auth connecteur** : rien à coder. `PowerAppsProvider` → `PowerAppsHostProvider` résout les
connexions avec `useConnectionRefs` et, s'il en manque une, rend lui-même `ConnectionSetupScreen`
(consentement OAuth dans le navigateur système). Il passe aussi `msal.clientId` en `isvClientId`
pour accorder CanView au principal de l'app sur les connexions créées — d'où l'importance de la
registration câblée en amont.

## Screens (live inventory)

| Route | Archetype | Source of truth | Last built by | Notes |
|---|---|---|---|---|
| `app/index.tsx` | Auth redirect | template | — | do not modify |
| `app/login.tsx` | Auth | template | — | do not modify unless an explicit auth skill requires it |
| `app/oauth-callback.tsx` | Auth | template | — | do not modify |
| `app/(app)/_layout.tsx` | Layout (Stack) | template | — | navigation Stack, header masqué |
| `app/(app)/home.tsx` | Catalogue | `Power Apps Mobile.dc.html` | orchestrator | recherche + filtre segmenté 4 voies + sections groupées + état vide + verrou de navigation |
| `app/(app)/photo.tsx` | Demo detail | `Power Apps Mobile.dc.html` | orchestrator | chrome prototype + caméra/galerie réelles, métadonnées image |
| `app/(app)/qr-code.tsx` | Demo detail | `Power Apps Mobile.dc.html` | orchestrator | chrome prototype + scanner live dans le panneau héros |
| `app/(app)/gestures.tsx` | Demo detail | `native-app-plan.md` | orchestrator (inline) | pincer/pivoter/glisser simultanés (gesture-handler + reanimated), zoom focal, aimantation 90°, double-tap, zoom accessible |
| `app/(app)/toasts.tsx` | Demo detail | `native-app-plan.md` | orchestrator (inline) | toast/alerte burnt, presets, position iOS, spinner d'envoi, vibration native burnt (Swift), notices Android/web |
| `src/native/toast.ts` | Native wrapper | — | orchestrator (inline) | `burnt` chargé en `require` paresseux + try/catch → `unavailable` si module natif absent |
| `src/demos/catalog.ts` | Data | `Power Apps Mobile.dc.html` | orchestrator | catalogue typé : 2 démos sur les 12 du prototype |
| `src/components/DemoScreen.tsx` | Shared chrome | `Power Apps Mobile.dc.html` | orchestrator | back, titre, panneau héros sombre + scanline, pastilles 4 tons, checklist, carte résultat, CTA |
| `src/components/ProfileAvatar.tsx` | Header widget | — | orchestrator | photo O365 en haut à droite du titre ; repli initiales puis icône ; tap → menu Popover (nom complet) |
| `src/hooks/useMyProfile.ts` | Data hook | — | orchestrator | `MyProfile_V2` + `UserPhoto_V2`, TanStack Query, staleTime 15 min |

## Design system

| Aspect | Status |
|---|---|
| Tamagui config | `createPowerAppsTamaguiConfig` + tokens de marque importés depuis `brand/tokens.ts` |
| Brand tokens | `brand/tokens.ts` — violet `#742774`, fond `#f2f2f7`, surfaces blanches r14, pile système SF/Roboto |
| Source | canvas Claude Design `WSP9Pq7yjg4RrQqP86cgJw` — tokens transcrits, style picker non exécuté |
| Theme variants | light, dark (dark garde les surfaces v5 + accents de marque) |
| `PortalProvider` | wired in template |
| `PowerAppsProvider` | wired in template + `theme`/`darkTheme` de marque dans `app/_layout.tsx` |

## Seeded sample data

_Written by `/add-sample-data`. Tracks records inserted so re-runs are idempotent and the user can clean up later if needed._

| Date | Table | Records inserted | First GUID | Last GUID |
|---|---|---|---|---|
| | | | | |

## Build history

| When | What | Result |
|---|---|---|
| 2026-09-22 | template préparé + `npx power-apps init -t MobileApp` (env DEV) | `power.config.json` créé, `appId: null` (jamais poussé) |
| 2026-09-22 | wrappers natifs caméra + scanner, design system, 3 écrans | `tsc --noEmit` 0, `check-routes` 0, validateurs qualité/contraste 0 issue |
| 2026-09-22 | connecteur office365users + avatar O365 dans l'en-tête d'accueil | `generate-schemas` 1 connecteur, `tsc` 0, validateurs 0 issue |
| 2026-09-22 | test device via Power Apps Mobile Preview | bundle iOS OK (8,8 s / 2577 modules) ; appel connecteur office365users **200** confirmé dans le log Metro |
| 2026-09-22 | portage du prototype Claude Design (accueil + détail générique) | `tsc` 0, `check-routes` 0, qualité 0, contraste 0 après correction de 2 tokens |
| 2026-09-23 | v1.0.0 — /deploy cycle 1 (web + Hermes android/ios, appId vide) → push DEV | success — appId `5d960c86-…` minted |
| 2026-09-23 | v1.0.0 — /deploy cycle 2 (rebuild avec appId compilé, vérifié dans les 2 `.hbc`) → push DEV | success |


| Date | Platform | Result | Notes |
|---|---|---|---|
| | ios / android / web | success / fail | |

## Known issues / follow-ups

- ~~**Périmètre volontairement réduit face au prototype.** Décision du 2026-09-22 : seulement photo + QR, pas de barre d'onglets.~~ **SUPERSEDED le 2026-09-22** par la refonte glassmorphism : la maquette a été mise à jour (810 lignes), le catalogue passe à 13 entrées (6 prêtes, 7 grisées) et la barre d'onglets flottante Démos/Infos est implémentée. Voir l'entrée d'édition en bas de fichier.

- **Le prototype revendique des choses que l'app ne fait pas.** Ses puces mentionnent
  « Compression avant envoi Dataverse » (l'app est connector-only) et « Retour haptique à la
  détection » (`expo-haptics` banni). Les textes de `catalog.ts` ont été corrigés en conséquence —
  ne pas les recopier tels quels depuis la maquette.


- **La prop Tamagui `animation` n'est pas typée dans ce template.** Vérifié : l'erreur TS2322
  (`Property 'animation' does not exist`) tombe aussi bien avec la config de marque qu'avec la config
  stock `createPowerAppsTamaguiConfig({})` — ce n'est donc pas notre import de tokens. Les clés
  existent pourtant à l'exécution (`quick`, `bouncy`, `quickestLessBouncy`…). Conséquence : les
  animations passent par `react-native-reanimated` (déjà câblé, le plugin babel est ajouté en dernier
  par `createPowerAppsBabelConfig`), pas par `animation="quick"`. Cf. `ProfileAvatar.MenuCard`.


- **App registration réutilisée, pas dédiée.** `TEMP - Demo Mobile Native` (`cd78c035-…`) porte le
  redirect `msauth.com.microsoft.PreviewApp://auth`, donc le login marche dans le player Power Apps
  Mobile Preview (dev). Son nom « TEMP » suggère qu'elle est jetable : si elle disparaît, recréer une
  registration via la page Wrap de l'environnement DEV et remplacer `msal.clientId`.
- **Le wrap release exigera un redirect supplémentaire.** Le broker MSAL est actif en build release
  (`useBroker` = `!__DEV__`) et réclame `msauth.<bundleId>://auth` sur la registration. Le bundle id
  ~~est encore la valeur template `com.contoso.powerappsapp` (`app.config.js`) — à fixer avant tout wrap,
  puis ajouter le redirect correspondant.~~ **Résolu 2026-09-23** : bundle id `tech.chinnin.demopowerapps1`
  dans `app.config.js` + projet Wrap, redirect `msauth.tech.chinnin.demopowerapps1://auth` ajouté.
- **Wrap : sortie Azure Blob** (`stapowerappswrapping` / `ctn-powerappswrapping`, Key Vault
  `kv-powserappswrapping`, secret `blobkey` = key1 du compte). Config vérifiée (tags, secrets, cert,
  access policy du SP Wrap). **Bloquant non résolu** : le build échoue dans `msdyn_MobileAppBuild`
  (`0x80040265` « SAS URL is not a valid Dataverse organization endpoint ») en sortie Dataverse *comme*
  Blob — ce n'est donc pas le stockage de sortie. Erreur non documentée, côté service (preview).


_Append items here. Mark resolved with strikethrough rather than deleting._

- _e.g._ Connection `b8e4-...` for SharePoint expires 2026-07-15 — re-bind before then

## Plan history

| Date | Section edited | Reason |
|---|---|---|
| | Data Model / Native / Screens | |

---

## How agents should use this file

1. **At skill start:** Read the relevant section(s) before asking the user any question that this file might already answer.
2. **At skill end:** Append to the relevant section. Use ISO dates. One-line entries.
3. **Never delete:** If a decision was reversed, mark it as `~~superseded~~` rather than removing.
4. **Conflict policy:** If this file disagrees with what's actually in the project (e.g., file says SharePoint connection bound, but `/list-connections` shows none), trust the live state and update this file.

---

### Edit: 2026-09-22 — Refonte glassmorphism + élargissement du catalogue

- **Request:** « j'ai update les maquettes sur claude /design. On part sur glassmorphism. J'ai aussi
  ajouté des features et grisé celles à venir. Implémente le tout », puis quatre précisions en cours
  de route (inventaire `/add-native`, capteurs, NFC via la doc produit, haptique).
- **Intent brief:** re-skin complet en glassmorphism ; catalogue de 2 → 13 entrées avec un état
  « Bientôt » ; barre d'onglets flottante ; nouvel écran Infos ; 4 nouveaux écrans de démo.
- **Skills/agents invoked:** `/mobile-app:edit-app` (orchestrateur), `/mobile-app:add-native`
  (audio, location, biometrics — flux inline, aucun helper dédié pour ces trois).

#### Décisions utilisateur prises en séance

| Sujet | Décision |
|---|---|
| Démos à rendre réelles | géolocalisation, Face ID, mémo vocal — toutes trois avaient été proposées comme « grisées » avant l'inventaire `/add-native`, qui a montré que leurs packages sont livrés |
| Signature manuscrite | **pas** de tracé pur-JS fait maison → reste grisée en attendant `power-apps-native-pen-input` |
| Détection de chute, secousse | **retirées du catalogue** — `expo-sensors` absent de `package.json`. Décision explicite : ce qui n'a pas de package ne s'affiche pas |
| NFC, BLE, AR, notifications push | **grisées « Bientôt »** — annoncées au niveau produit, pas encore livrées |
| Retour haptique | **grisé** — `expo-haptics` est dans `package.json` mais son module natif n'est pas embarqué dans le binaire de rewrap |

#### Points techniques à ne pas re-découvrir

- **`native-app-plan.md` n'existait pas.** Absent de l'app root, non gitignoré : le
  `/create-mobile-app` initial ne l'a jamais écrit. `/edit-app` exige ce fichier et demande sinon de
  relancer `/create-mobile-app` — ce qui aurait scaffoldé un template neuf par-dessus une app qui
  marche. **Reconstruit depuis l'état réel** au lieu de ça. Il est désormais présent et à jour.
- **`scripts/check-routes.js` n'existe pas non plus** dans ce template (CLAUDE.md l'affirmait).
  Vérification des routes faite par un script node ad hoc : les 6 routes de démo + `/home` + `/infos`
  résolvent toutes vers un fichier.
- **`expo-blur` absent** → le flou d'arrière-plan est *composé*, pas réel : remplissages
  translucides + liseré interne 1px + ombres douces, et les halos colorés sont 18 cercles
  concentriques à faible alpha. Documenté en tête de `brand/tokens.ts` et `src/components/Glass.tsx`.
  **Ne pas « corriger » en installant expo-blur** (frontière module natif, règle dure 2).
- **`GestureHandlerRootView` n'est pas câblé** dans `app/_layout.tsx`, fichier explicitement
  load-bearing. `/swipe` utilise donc `PanResponder` (core React Native) plutôt que
  `react-native-gesture-handler` — aucun provider à toucher, aucune dépendance ajoutée.
- **`theme.statusDanger` est typé optionnel** (l'alias n'est pas peuplé côté thème sombre). Utiliser
  `tokens.color.statusDanger` pour le rouge d'enregistrement.
- **Les couleurs dynamiques (string) sur `bg`/`color` Tamagui** ne passent pas le typage : caster
  `as never`, ou passer par un `View` RN avec `style` (fait pour les halos).
- **`validate-screen-quality.js` signale `missing-safe-area-chrome` sur les 6 écrans de démo.**
  Faux positif : le validateur est par fichier et ne voit pas que `DemoScaffold` applique
  `SafeAreaView`. Ne pas ajouter de safe-area redondante écran par écran.
- **Les routes typées `.expo/types/router.d.ts` sont générées par Metro.** Les nouvelles routes n'y
  sont pas tant que `npm run dev` n'a pas tourné → cast `as Href` dans `home.tsx` et `TabBar.tsx`,
  avec le commentaire qui l'explique.

#### Verification

| Gate | Résultat |
|---|---|
| `npx tsc --noEmit` | ✅ PASS |
| `validate-color-contrast.js --report` | ✅ 0 issue |
| `validate-screen-quality.js --report` | ⚠️ 6 × `missing-safe-area-chrome`, faux positifs documentés ci-dessus |
| Résolution des routes | ✅ 8/8 |
| `npm run dev` / device | ❌ **non exécuté** — aucune vérification runtime sur appareil |

- **Preview:** non générée.
- **Blocks/concerns:** aucun blocage. Les 4 nouveaux écrans compilent et sont typés, mais
  **aucun n'a été exercé sur un appareil réel** : micro, GPS et biométrie demandent une permission
  native qui ne peut pas être testée depuis le poste de dev. À valider au prochain `npm run dev`.

### Edit: 2026-09-23 — Démo « Toasts et alertes » (burnt + haptique native)
- Request: « ajouter une feature sur toast et alerte natives (burnt) » puis « ajoute aussi l'haptic
  natif embarqué dans burnt via swift direct ».
- Intent brief: nouvelle démo `/toasts`, groupe Système ; capacité `burnt` 0.12.2 (template) ;
  aucune donnée, aucun connecteur, aucun changement de design.
- Assumptions: « haptic via swift direct » = option `haptic` de burnt, jouée par
  `BurntModule.swift` (SPIndicator/SPAlert). Aucun code Swift écrit — impossible sous la frontière
  module natif. `expo-haptics` reste banni.
- Skills/agents invoked: `/edit-app` ; planification et écran faits inline (1 écran, pas de wave).
- Plan sections changed: Native Capabilities (Wired + notes burnt), Screens.
- App changes: `src/native/toast.ts` (nouveau), `app/(app)/toasts.tsx` (nouveau),
  `src/demos/catalog.ts` (`DemoRoute` + ligne `toasts`, ready). Layout inchangé (Stack implicite).
- Findings qui comptent :
  - burnt iOS fait `requireNativeModule('Burnt')` **au chargement du module** : un `import` statique
    ferait planter la route si le binaire de rewrap n'embarque pas le module (cas expo-haptics).
    D'où le `require` paresseux dans le wrapper.
  - Le type TS `AlertOptions` de burnt n'a pas `haptic`, mais le Swift le lit (`@Field var haptic`) :
    le wrapper élargit le payload.
  - Android = `ToastAndroid` pur JS : titre seul, pas de preset/message/haptique,
    `dismissAllAlerts()` no-op. Web = nécessite `sonner` + `<Toaster />`, non ajouté.
- Verification: `npx tsc --noEmit` ✅ ; routes catalogue 7/7 ✅ ; contrast ✅ 0 ; screen-quality ⚠️ 1 ×
  `missing-safe-area-chrome` (faux positif DemoScaffold connu).
- Preview: non générée (le preview statique ne rend pas les toasts système).
- Debug handoff: non demandé.
- Blocks/concerns: **DONE_WITH_CONCERNS** — la présence du module natif Burnt dans le binaire
  Preview / rewrap n'est pas vérifiée. Tester `/toasts` sur iPhone : si la notice « module natif
  Burnt n'est pas embarqué » s'affiche, repasser la ligne en `ready: false` avec un `blockedBy`.

### Edit: 2026-09-23 — Démo « Pincer, pivoter, glisser » + appui long natif sur /swipe
- Request: appui long de `/swipe` qui ouvre le menu sans relâcher + vibration sans expo-haptics ;
  puis « ajouter des gestures natifs comme pincer ou glisser, qui rendent bien en natif ».
- Intent brief: `/swipe` corrigé ; nouvelle démo `/gestures`, groupe Capteurs ; aucune donnée,
  aucun connecteur, aucun paquet ajouté, aucun changement de design.
- Assumptions: `GestureHandlerRootView` était déjà branché (`app/_layout.tsx`, depuis `fd14ebd`) —
  la mention « PanResponder / root non branché » de CLAUDE.md était périmée.
- Skills/agents invoked: `/edit-app` ; écran construit inline (1 écran, pas de wave).
- Plan sections changed: Native Capabilities (touch gestures, vibration), Screens.
- App changes: `app/(app)/gestures.tsx` (nouveau) ; `src/demos/catalog.ts` (`DemoRoute` + ligne
  `gestures` ready, puces `swipe`) ; `src/components/DemoScaffold` → prop optionnelle
  `scrollEnabled` (rétro-compatible) ; `app/(app)/swipe.tsx` → `Gesture.Race` + `Vibration`.
- Points techniques à ne pas re-découvrir :
  - `Gesture.Exclusive(pan, longPress)` fait attendre l'échec du pan, donc le relâchement : le
    menu s'ouvrait au lâcher. `Race` = le premier qui s'active annule l'autre.
  - `Vibration.vibrate(ms)` : iOS ignore la durée (buzz système ~400 ms, pas un « tic ») ;
    Android respecte 15 ms mais exige la permission `VIBRATE` dans le binaire (non vérifié).
  - `/gestures` applique les deltas `onChange` (`scaleChange`, `rotationChange`, `changeX/Y`)
    autour du point focal / de l'ancre : les trois gestes composent sans double translation.
  - La scène est dans le ScrollView de `DemoScaffold` : `scrollEnabled` passe à false de
    `pan.onBegin` à `onFinalize`, sinon un glisser vertical fait défiler la page.
- Verification: `npx tsc --noEmit` ✅ ; routes catalogue 8/8 ✅ ; contrast ✅ 0 ;
  screen-quality ⚠️ 1 × `missing-safe-area-chrome` (faux positif DemoScaffold, identique aux 7
  autres démos) ; `validate-mobile-files` exit 2 pour la même raison.
- Preview: non générée (le preview statique ne rend pas les gestes).
- Debug handoff: non demandé.
- Blocks/concerns: **DONE_WITH_CONCERNS** — non testé sur appareil ; ressenti du zoom focal et de
  la bascule `scrollEnabled` en cours de geste à valider sur iPhone.
