# Native App Plan — demo mobile powerapps

> **Provenance.** This file was **reconstructed from live state on 2026-09-22**, during the
> glassmorphism edit. The original `/create-mobile-app` run never wrote it (it was absent from the
> app root and not gitignored), so `/edit-app` had no source of truth to diff against. Rather than
> re-run `/create-mobile-app` — which scaffolds a fresh template and would have destroyed four
> working screens, the brand system, the bound connector and the auth config — the plan was
> rebuilt from `app/`, `src/demos/catalog.ts`, `package.json`, `brand/` and `memory-bank.md`.
> Sections below therefore describe what **is**, verified against the code, not what was proposed.

Visual reference: Claude Design project
[« Design hifi basé sur artefact »](https://claude.ai/design/p/54857710-fa36-492f-9465-9ef6c74fb4ac),
file `Power Apps Mobile.dc.html` (810-line revision, 2026-09-22). Read with `mcp__design__*`.

---

## Data Model

**None.** This app is deliberately **connector-only**: no Dataverse table, no
`.datamodel-manifest.json`, no offline profile, nothing persisted. Every demo holds its result in
component state for the length of the session and discards it.

This is a constraint, not an omission — a capability demonstrator should not require a schema to
run. It is also the reason the `offline` catalogue row cannot ship (see below).

## Connectors

| Connector | Connection | Purpose |
|---|---|---|
| `shared_office365users` | `0797fce6301e423b83f9c2457d41c44b` (pre-existing, Connected) | `MyProfile_V2` + `UserPhoto_V2` for the header avatar |

`npm run generate-schemas` regenerates `src/generated/connectorSchemas.ts` from `.power/schemas/`
and must run after any connector change.

## Native Capabilities

The template's `package.json` is the allowlist — a capability whose package is absent cannot be
added (hard rule 2, native module boundary).

### Wired

| Capability | Module | Wrapper | Used by |
|---|---|---|---|
| `camera` / `image-picker` | `expo-image-picker` | `src/native/camera.ts` | `/photo` |
| `barcode-scanner` | `expo-camera` | `src/native/barcodeScanner.tsx` | `/qr-code` |
| `audio` | `expo-audio` 55.0.14 | `src/native/audio.ts` | `/voice` |
| `location` (one-shot, foreground) | `expo-location` 55.1.9 | `src/native/location.ts` | `/geolocation` |
| `biometrics` | `expo-local-authentication` 55.0.13 | `src/native/biometrics.ts` | `/face-id` |
| touch gestures | `react-native` `PanResponder` + `react-native-reanimated` | — (in-screen) | `/swipe` |
| `device-info` | `expo-device` | — (in-screen) | `/infos` |

### Blocked — and why

Each maps to a greyed « Bientôt » catalogue row carrying the same reason in its `blockedBy` field.

| Capability | Status | Blocker |
|---|---|---|
| `pen-input` (signature) | greyed | `@microsoft/power-apps-native-pen-input` absent. The plugin *has* a dedicated helper (`/add-native pen-input`), so this is a shipping gap, not a design gap. |
| AR | greyed | No AR package. Named as a native-app benefit in the product docs; listed by `/add-native` under "until the template adds them". |
| haptics | greyed | **`expo-haptics` IS in `package.json` (55.0.16)** but its native module is not bundled into the rewrap binary — `Haptics.impactAsync()` throws on first call. Banned by `agents/screen-builder.md:266`. Needs only binary bundling. |
| offline | greyed | `@microsoft/power-apps-native-offline` **is** installed (0.1.32), but offline sync requires a Dataverse Mobile Offline Profile. This app has no table. Blocked on the data model, not the package. |
| NFC | greyed | No NFC package. Explicitly cited as a native-app benefit in the product docs; `/add-native` lists it under "until the template adds them". |
| BLE | greyed | Same as NFC. |
| push notifications | greyed | `expo-notifications` absent **and** push is listed in the product docs' own *Limitations* section — unsupported in Private Preview, not merely unshipped. |
| sensors (accelerometer) | **removed from catalogue** | `expo-sensors` absent. `/add-native` reserves the slot (`sensors` → `src/native/sensors.ts`) but the package is not shipped. User decision 2026-09-22: drop the rows rather than advertise them. |

**`expo-blur` is also absent**, which is why glassmorphism is composed rather than blurred — see Design.

## Design

Direction: **glassmorphism over a warm gradient canvas**, transcribed from the 2026-09-22 prototype.
Tint stays `#742774`.

`brand/tokens.ts` carries two exports:

- `tokens` — the Tamagui-facing scales (space / size / radius / color) fed to
  `createPowerAppsTamaguiConfig`.
- `glass` — the glassmorphism recipe. It lives *outside* `tokens` because a glass pane is a
  composition (fill + hairline border + inset highlight + drop shadow), not a single colour, so it
  cannot be expressed as a theme key.

**The blur is faked, on purpose.** React Native has no `backdrop-filter` and `expo-blur` is not in
the template. `src/components/Glass.tsx` reproduces the look with translucent fills, a 1px inset top
highlight, soft shadows, and background orbs built from stacked concentric circles at low alpha
(18 layers) instead of a Gaussian blur. This holds because the canvas beneath is a smooth gradient
with no high-frequency detail. **Do not "fix" this by installing `expo-blur`.**

Primitives: `AppBackground`, `GlassCard` (`surface` / `bar` / `overlay` tones), `GlassDivider`,
`MediaStripes`.

## Screens

Navigation is a plain expo-router `Stack` (`app/(app)/_layout.tsx`, headers hidden). Demo detail
screens **push**; the two tab destinations **replace**, so switching tabs never grows the stack.
There is no `Tabs` layout — with only two destinations it would have nested every detail screen
inside a tab stack and drawn the pill over the detail pages.

| Route | Screen | Notes |
|---|---|---|
| `/home` | Démos — search, 4-way segment filter, grouped sections, empty state | Tab destination |
| `/infos` | Infos — à propos, informations (live platform string), lien GitHub | Tab destination |
| `/photo` | Prise de photo | `expo-image-picker` |
| `/qr-code` | Lecture de QR code | `expo-camera` |
| `/voice` | Mémo vocal | `expo-audio`, live metering waveform |
| `/geolocation` | Géolocalisation | `expo-location`, one-shot + reverse geocode |
| `/swipe` | Swipe et appui long | `PanResponder`, no haptics |
| `/face-id` | Face ID | `expo-local-authentication` |

### Shared chrome

`src/components/DemoScreen.tsx` owns the whole demo page frame. `DemoScaffold` wraps
`AppBackground` + `SafeAreaView(['top','bottom'])` + back link + scroll body + pinned CTA bar; all
six demo screens supply only their hero content, their capability-specific section, and what the CTA
does.

> **Validator note.** `validate-screen-quality.js` reports `missing-safe-area-chrome` on all six
> demo screens. This is a **false positive**: the validator is per-file and cannot see that
> `DemoScaffold` applies `SafeAreaView`. Confirmed handled centrally. Do not "fix" it by adding
> redundant per-screen safe-area wrappers.

### Catalogue contract

`src/demos/catalog.ts` is a discriminated union:

- `ReadyDemo` (`ready: true`) — has a `route`, `hero`, `cta`, `running`, `resultLabel`. Opens a real
  screen that calls the real device API.
- `UpcomingDemo` (`ready: false`) — has **no** route and a `blockedBy` string. Renders greyed with a
  « Bientôt » pill and is inert.

Use `findReadyDemo(id)` from a detail screen so TypeScript proves the demo has a route.

**A row whose page fakes the capability has no place in a demonstrator.** Adding a demo means
writing its screen; promoting a greyed row means the blocker in `blockedBy` actually cleared.

### JavaScript Dependencies

None added. Every capability above uses a package the template already ships.

## Generated Services (snapshot at 2026-09-22)

| Service | File | Methods |
|---|---|---|
| _connector services only_ | `src/generated/` | Office 365 Users — `MyProfile_V2`, `UserPhoto_V2` via `src/hooks/useMyProfile.ts` |

No Dataverse services: there are no tables.
