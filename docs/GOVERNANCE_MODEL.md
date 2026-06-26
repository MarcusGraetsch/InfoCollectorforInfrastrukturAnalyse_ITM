# Querschnitt — Gemeinsames Governance-/Evidence-/Rollen-Modell

**Stand: 2026-06-24** · Status: Fundament umgesetzt (Datenmodell + Helper + Seed-Katalog).
UI-Konsumenten folgen in späteren Phasen (Rollen, NIS2, Souveränität, AI Act, BCM, Evidence).

## Motivation

Viele Module überschneiden sich (NIS2, Evidence-Katalog, Cloud-Souveränität, EU AI Act,
BCM, Cloud-Exit, Nachhaltigkeit, IT-Grundschutz-Rollen). Statt in jedem Modul eigene
Verantwortlichkeits- und Nachweisfelder zu duplizieren, gibt es **eine zentrale Datenbasis**.
Module referenzieren gemeinsame Objekte über IDs (n:m), z. B. kann ein AVV-Nachweis
gleichzeitig Datenschutz, NIS2-Lieferkette und Cloud-Souveränität abdecken.

## Datenmodell (`src/types.ts`)

| Struktur | Zweck | AppState-Feld (optional) |
|---|---|---|
| `GovernanceTopic` | Control/Thema je Domäne (NIS2-Maßnahme, Souveränitäts-Dimension, BCM-Baustein …) | `governanceTopics?` |
| `EvidenceItem` | Zentraler Nachweis (n:m zu Themen über `relatedTopicIds`) | `evidenceItems?` |
| `RoleAssignment` | ISMS-/BCM-/NIS2-Rolle (zentral referenzierbar) | `roleAssignments?` |
| `ActionItem` | Maßnahme / nächster Schritt (eingebettet in `GovernanceTopic.actionItems`) | — |
| `ObjectRef` | Verweis auf ein Erfassungsobjekt (`{ kategorie, id }`) | — |

Alle Felder sind **optional und additiv** → alte Backups laden unverändert
(`store.ts`: `createDefaultState` + `arrayKeys` + `mergeWithDefault`). Export/Import läuft
über den bestehenden State-Mechanismus.

### Domänen & Status

- `GovernanceDomain`: `nis2 | cloudSovereignty | aiAct | bcm | cloudExit | sustainability | itGrundschutz`
- `GovernanceStatus`: `Offen | In Arbeit | Teilweise | Erfüllt | N/A`
- `EvidenceStatus`: `Offen | Angefragt | Erhalten | Geprüft | Nicht anwendbar`
- `RoleRelevance`: `isms | bcm | nis2 | cloudGovernance | datenschutz | empfohlen`
  (eine Rolle kann mehreren dienen — Klassifizierung statt „formal vorgeschrieben").

## Helper (`src/utils/governance.ts`)

Reine Funktionen, keine UI, keine State-Mutation (immer neue Arrays):

- `makeId(prefix)` — kollisionsarme IDs ohne Dependency
- `ROLE_CATALOG` — Seed-Katalog der **20 ISMS-/BCM-/NIS2-Rollen** inkl. `relevanz`-Tags,
  `responsibility` und orientierendem `normativeHint`
- `seedRoleAssignments(existing)` — erzeugt fehlende Rollen idempotent (per `key`)
- `roleProgress` / `topicCompletion` / `evidenceProgress` — Fortschrittskennzahlen
- `roleName`, `evidenceForTopic`, `topicsForEvidence`, `openActions` — Referenz-Auflösung
  (beide Richtungen → keine Duplikat-Inseln)
- `DOMAIN_LABEL`, `ROLE_RELEVANCE_LABEL` — Anzeige-Labels

## Geplante Anbindung (nächste Phasen)

1. **Paket 4 — Rollenübersicht:** ✅ umgesetzt — `RollenUebersicht.tsx` (Tab
   „ISMS-/BCM-Rollen") auf `roleAssignments` + `seedRoleAssignments`.
2. **Paket 9 — Evidence-Katalog:** ✅ umgesetzt — `EvidenceKatalog.tsx` (Tab
   „Evidence-Katalog") auf `evidenceItems`. `src/compliance/evidenceCatalog.ts`
   bridged den statischen `NACHWEIS_KATALOG` (Seed) und migriert `nachweisStatus`
   non-destruktiv. EvidenceItem um Beratungsfelder erweitert (whyImportant, themen,
   normativeReferences, benoetigteInfos, beispielNachweise, typischeQuelle, seedKey).
3. **Paket 8 — NIS2-Check interaktiv:** ✅ umgesetzt — geführte Detailansicht je
   Mindestmaßnahme (`NIS2Check.tsx` + `src/compliance/nis2Detail.ts`). Speichert
   Reifegrad/Rolle/Evidence/Follow-up in `nis2Assessment.massnahmenDetail` und
   referenziert zentrale `roleAssignments` + `evidenceItems` (statt Duplikaten).
4. **Paket 6 — Cloud-Souveränität:** ✅ umgesetzt — die 6 Dimensionen sind klickbare
   Detailansichten (`GovernanceTopicDrawer.tsx` + `src/compliance/souvDetail.ts`),
   persistiert als `GovernanceTopic` (domain `cloudSovereignty`, key = Dimension).
   Helper `findTopic`/`makeTopic`/`upsertTopic` + `GovernanceTopicInfo` in governance.ts.
   Der Drawer ist generisch und für Pakete 3/7 wiederverwendbar.
5. **Paket 3 — BCM & Cloud-Exit (LG 9):** ✅ umgesetzt — zwei bearbeitbare Governance-
   Themen (`src/compliance/lg9Governance.ts`) im Tab „Security & Gov. (LG 9)" über den
   `GovernanceTopicDrawer`, persistiert als `GovernanceTopic` (domain `bcm` / `cloudExit`).
6. **Paket 7 — AI Act:** ✅ umgesetzt — Klärungs-Wizard je KI-System/Shadow-AI-Kandidat
   (`EuAiActInventar.tsx`). Die KI-Daten leben auf der `Anwendung` (additive aiXxx-Felder);
   Betriebsort/Hersteller nutzen vorhandene Felder, Nachweise referenzieren `evidenceItems`
   (keine Doppelerfassung). `countOffeneKlaerung` macht offene Punkte als Aufgaben sichtbar.

> Leitplanke: Keine neuen, parallelen Verantwortlichkeits-/Nachweisfelder in Einzelmodulen
> — immer die zentralen Objekte referenzieren.

## Tests

`src/__tests__/governance.test.ts` — Default/Migration, Seed-Idempotenz, Fortschritt,
n:m-Referenzauflösung, ID-Eindeutigkeit.
