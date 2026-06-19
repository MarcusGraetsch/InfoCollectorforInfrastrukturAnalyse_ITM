# Umsetzungsplan: Alle Feature-Ideen aus `CONSULTANT_FEATURE_IDEAS.md`

**Stand:** Juni 2026 · **Branch:** `claude/dazzling-ride-04upm4`  
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS · Kein Backend · localStorage + IndexedDB  
**Designprinzipien (nie brechen):** Kein Pflicht-Backend · Offline-fähig · Druckbar · Kein Breaking-Change am JSON-Export ohne Migrationspfad

Dieses Dokument ist als **Arbeitsanweisung** formuliert: Jede Session kann einen Block direkt umsetzen, ohne dieses Dokument zu verlassen. Für jedes Feature sind exakte Datei-Pfade, Interface-Erweiterungen, Komponenten-Namen und UI-Texte vorgegeben.

---

## Leseanleitung

Jeder Block folgt diesem Schema:
1. **Was & Warum** — Ziel und Beratungs-Mehrwert in einem Satz
2. **Datenmodell** — Welche Interfaces in `src/types.ts` erweitern / hinzufügen (inkl. Migrationspfad in `store.ts`)
3. **Logik-Dateien** — Neue oder zu ändernde Dateien in `src/`
4. **Komponente(n)** — Dateiname, Props-Interface, grober JSX-Aufbau
5. **Navigation** — Einbindung in `ProjectView.tsx` (SubTab / Gruppe)
6. **UX-Anforderungen** — Was der Berater sieht, hört, tun kann; Druckbarkeit
7. **Qualitätskriterien** — „Done" wenn …

---

## BLOCK 1 — Vollständigkeits-Cockpit (Quick Win)

**Ziel:** Berater sieht auf einem Blick, welche Kategorien vollständig erfasst sind und wo noch `Unklar`-Felder offen sind. Ersetzt die bisherige rein gefühlsmäßige Einschätzung des Erfassungsfortschritts.

### 1.1 Datenmodell
Kein neues Interface nötig. Die Berechnung erfolgt rein aus dem vorhandenen `AppState`.

### 1.2 Logik-Datei: `src/completeness.ts` (neu)
```typescript
// Exportiert:
export interface CategoryCompleteness {
  key: string;
  label: string;
  total: number;
  withUnklar: number;   // Einträge mit ≥1 Feld = 'Unklar'
  empty: number;        // Einträge mit 0 cloud-relevanten Feldern
  pct: number;          // 0–100: 100 = alle Felder ohne 'Unklar'
  status: 'Grün' | 'Gelb' | 'Rot';
}

export function computeCompleteness(state: AppState): CategoryCompleteness[]
// Iteriert über ASSESSABLE_CATEGORIES + geschaeftsprozesse + stakeholder
// Prüft jeden Eintrag auf 'Unklar'-Werte (cloudReadiness.ts kennt die Felder)
// Status: Grün = pct ≥ 80, Gelb = 40–79, Rot = < 40 oder empty > 0
```

### 1.3 Komponente: `src/components/VolllstaendigkeitsCockpit.tsx` (neu)
**Props:**
```typescript
interface Props { state: AppState; onNavigate: (tab: string) => void; }
```

**UI-Aufbau (exakt so umsetzen):**
- **Header:** `h2` „Erfassungsfortschritt" + Erklärungstext: *„Zeigt für jede Kategorie, wie viele Einträge noch offene `Unklar`-Felder haben oder gar nicht erfasst wurden."*
- **Gesamtfortschritts-Balken:** Ein großer Fortschrittsbalken über alle Kategorien, darunter Text: *„X von Y Kategorien vollständig"*
- **Kategorie-Kacheln:** 4-spaltig (2 auf Mobil), je Kachel:
  - Farbige linke Kante (grün/gelb/rot)
  - Kategorie-Label + Anzahl Einträge
  - Mini-Balken (Anteil ohne Unklar)
  - Zahl `X Einträge mit offenen Feldern`
  - Button „Zur Fragenliste →" der `onNavigate('fragenliste')` aufruft
- **Ampel-Legende** ganz unten: Grün (≥80 % vollständig) · Gelb (40–79 %) · Rot (<40 %)
- **Druckbar:** Print-Button der alle Kategorien als simple Tabelle rendert

**Navigation:** Neuen SubTab `'cockpit'` in `ProjectView.tsx` hinzufügen, Gruppe „Projektsteuerung", Icon = Balkendiagramm-SVG. Im `LG_TAB_MAP` in `ProjectTracker.tsx` keinem LG zugeordnet (kein Pflicht-LG), aber als Einstiegsbutton prominent im ProjectTracker anzeigen.

**Qualitätskriterien:** ✓ Cockpit öffnet sich sofort ohne Ladezeit · ✓ Bei 0 Einträgen in einer Kategorie: „Noch keine Einträge erfasst" in Rot · ✓ Klick auf Kachel navigiert zur jeweiligen Kategorie-Liste

---

## BLOCK 2 — NIS2-/BSIG-Betroffenheits- & Readiness-Check

**Ziel:** In 5 Minuten klären: Ist der Kunde von NIS2 betroffen? Welche Maßnahmen fehlen? Direkt ausfüllbar im Erstgespräch.

### 2.1 Datenmodell: `src/types.ts` erweitern
```typescript
// Am Ende von types.ts ergänzen:
export type NIS2Einstufung = 'Besonders wichtig' | 'Wichtig' | 'Nicht betroffen' | 'Unklar';

export interface NIS2Assessment {
  sektor: string;            // Dropdown (s.u.)
  mitarbeiter: string;       // '<50' | '50-249' | '≥250'
  umsatzMio: string;         // '<10' | '10-49' | '≥50'
  kritis: string;            // 'Ja' | 'Nein' | 'Unklar'
  einstufung: NIS2Einstufung;
  // Gap-Felder (je NIS2-Maßnahme): 'Vorhanden' | 'Teilweise' | 'Fehlend' | 'N/A'
  massnahmen: Record<string, 'Vorhanden' | 'Teilweise' | 'Fehlend' | 'N/A'>;
  notizen: string;
  erstelltAm: string;
}
```

**Migration in `store.ts`:** In `mergeWithDefault()` ergänzen:
```typescript
if (!merged.nis2Assessment) {
  merged.nis2Assessment = { sektor: '', mitarbeiter: '', umsatzMio: '', kritis: 'Unklar', einstufung: 'Unklar', massnahmen: {}, notizen: '', erstelltAm: '' };
}
```
Feld `nis2Assessment?: NIS2Assessment` in `AppState` hinzufügen (optional → keine Breaking Change).

### 2.2 Logik-Datei: `src/compliance/nis2.ts` (neu)
```typescript
// Sektoren laut NIS2-Anhang I (besonders wichtig) und II (wichtig):
export const NIS2_SEKTOREN_ANHANG_I = [
  'Energie', 'Verkehr', 'Bankwesen', 'Finanzmarktinfrastruktur',
  'Gesundheit', 'Trinkwasser', 'Abwasser', 'Digitale Infrastruktur',
  'IKT-Dienstleistungen (B2B)', 'Öffentliche Verwaltung', 'Raumfahrt'
];
export const NIS2_SEKTOREN_ANHANG_II = [
  'Post- und Kurierdienste', 'Abfallbewirtschaftung', 'Chemikalien',
  'Lebensmittel', 'Verarbeitendes Gewerbe/Herstellung', 'Digitale Dienste',
  'Forschung'
];

// 10 Mindestmaßnahmen nach Art. 21 NIS2 / §30 BSIG:
export const NIS2_MASSNAHMEN = [
  { key: 'risikoanalyse', label: 'Risikoanalyse & Informationssicherheitskonzept' },
  { key: 'incident', label: 'Incident-Erkennung & Meldepflicht (24h/72h/1 Monat)' },
  { key: 'bcm', label: 'Business Continuity / Backup / Wiederherstellung' },
  { key: 'lieferkette', label: 'Sicherheit der Lieferkette (Drittparteien)' },
  { key: 'einkauf', label: 'Sicherheit bei Erwerb, Entwicklung, Wartung von IT' },
  { key: 'schwachstellen', label: 'Schwachstellenmanagement & Offenlegung' },
  { key: 'kryptografie', label: 'Kryptografie & Verschlüsselung' },
  { key: 'personal', label: 'Personalsicherheit, Schulung, Zugriffskontrollen' },
  { key: 'mfa', label: 'Multi-Faktor-Authentifizierung (MFA)' },
  { key: 'physisch', label: 'Physische Sicherheit der Infrastruktur' },
];

// Betroffenheitsprüfung:
export function berechneEinstufung(a: NIS2Assessment): NIS2Einstufung
// Logik: Anhang-I-Sektor + (≥250 MA ODER ≥50 Mio Umsatz) → "Besonders wichtig"
//        Anhang-I-Sektor + (50–249 MA ODER 10–49 Mio) → "Wichtig"
//        Anhang-II-Sektor → "Wichtig"
//        kritis = 'Ja' → immer "Besonders wichtig"
//        sonst → "Nicht betroffen"

// Gap-Analyse:
export function nis2GapAmpel(massnahmen: Record<string, string>): { offen: number; teilweise: number; vorhanden: number }
```

### 2.3 Komponente: `src/components/NIS2Check.tsx` (neu)
**Props:**
```typescript
interface Props {
  assessment: NIS2Assessment;
  onUpdate: (a: NIS2Assessment) => void;
}
```

**UI-Aufbau (5 Schritte, als vertikaler Stepper):**

**Schritt 1 — Sektor:** Dropdown „In welchem Sektor ist das Unternehmen tätig?" mit Anhang-I/II-Gruppierung + Option „Kein geregelter Sektor". Darunter kleiner Info-Text: *„Quelle: NIS2-Richtlinie Anhang I & II, BSIG §28"*

**Schritt 2 — Größe:** Zwei nebeneinander: Mitarbeiteranzahl (Radio: <50 / 50–249 / ≥250) + Jahresumsatz (Radio: <10 Mio / 10–49 Mio / ≥50 Mio)

**Schritt 3 — KRITIS:** Radio „Ist das Unternehmen als kritische Anlage (KRITIS) eingestuft?" (Ja / Nein / Unklar)

**Schritt 4 — Einstufungsergebnis (automatisch):**
- Große farbige Karte: `einstufung` mit Icon und Erklärungstext
- Grün = „Nicht betroffen" · Orange = „Wichtig" · Rot = „Besonders wichtig"
- Text bei „Besonders wichtig": *„Registrierungspflicht beim BSI, Meldepflichten, erhöhte Prüfrechte. Bußgelder bis 10 Mio. € oder 2 % des weltweiten Umsatzes."*
- Text bei „Wichtig": *„Registrierungspflicht beim BSI, Meldepflichten. Bußgelder bis 7 Mio. € oder 1,4 % des weltweiten Umsatzes."*

**Schritt 5 — Gap-Analyse:** Tabelle der 10 Maßnahmen, je Zeile 4-fach-Radio (Vorhanden / Teilweise / Fehlend / N/A). Ampel-Zusammenfassung oben. Button „Als Offene Punkte exportieren" → schreibt `Fehlend`-Maßnahmen in die Fragenliste/offene Punkte.

**Footer:** Notizen-Freifeld + Datum + Button „Bericht drucken" (öffnet Print-Window mit vollständiger Gap-Liste)

**Navigation:** Neuer SubTab `'nis2'` in `ProjectView.tsx`, Gruppe „Compliance & Regulatorik" (neue Gruppe anlegen!). Kein LG-Mapping, aber Badge „NEU" im Tab-Label beim ersten Öffnen.

**In `App.tsx`:** Handler `onUpdateNIS2={(a) => updateState(prev => ({ ...prev, nis2Assessment: a }))}` auf `ProjectView` übergeben.

**Qualitätskriterien:** ✓ Einstufung berechnet sich sofort beim Ausfüllen · ✓ Ohne Dateneingabe steht „Unklar" · ✓ Druckergebnis enthält Datum, Kundenname, alle 10 Maßnahmen mit Status

---

## BLOCK 3 — EU-Cloud-Souveränitäts-Bewertung (SEAL-Levels / Gaia-X)

**Ziel:** Das bisherige binäre `souveraen`-Flag in `cloudReadiness.ts` zu einer abgestuften Souveränitäts-Ampel ausbauen, die erklärt *was* geprüft wurde und *welche Cloud-Typen* geeignet sind.

### 3.1 Datenmodell: `src/types.ts`
```typescript
// CloudFields erweitern (alle optional → kein Breaking Change):
export interface CloudFields {
  // ... bisherige Felder bleiben ...
  cloudAnbieterJurisdiktion?: 'EU' | 'USA' | 'Gemischt' | 'Unklar';
  verschluesselungshoheit?: 'Anbieter' | 'Eigene Schlüssel (BYOK)' | 'Hardware-Schlüssel (HYOK)' | 'Unklar';
  portabilitaetsreife?: 'Hoch (Standard-Formate)' | 'Mittel' | 'Niedrig (proprietär)' | 'Unklar';
  gaixZertifiziert?: 'Ja' | 'Nein' | 'Geplant' | 'Unklar';
}
```

### 3.2 Logik: `src/cloudReadiness.ts` erweitern
```typescript
// Neues Interface ergänzen:
export type SovereignLevel = 'S0' | 'S1' | 'S2' | 'S3';
// S0 = keine Anforderung · S1 = EU-Jurisdiktion · S2 = + BYOK · S3 = + Gaia-X/C5

export interface SovereignResult {
  level: SovereignLevel;
  label: string;           // z.B. "S2 — EU-Jurisdiktion + eigene Schlüssel"
  anforderung: string;     // Was der Schutzbedarf verlangt
  empfehleCloudTypen: string[]; // z.B. ["Deutsche Cloud (T-Systems)", "Azure Germany (Treuhand)"]
  hinweise: string[];
}

// Neue Funktion:
export function assessSovereignty(item: CloudFields): SovereignResult

// Logik:
// schutzbedarf = 'Normal' + keine Souveränitätsangabe → S0
// datensouveraenitaet = 'Deutschland' ODER schutzbedarf = 'Hoch' → S1
// verschluesselungshoheit = BYOK/HYOK → +1 Level
// gaixZertifiziert = 'Ja' ODER datensouveraenitaet = 'Streng souverän (C5 / Gaia-X)' → S3
```

### 3.3 Sichtbar in bestehenden Komponenten
**`ZielarchitekturBetrieb.tsx`:** Neue Spalte „Souveränität" in der Systemtabelle — zeigt `SovereignLevel`-Badge (S0–S3 mit Farbkodierung: grau/gelb/orange/grün). Tooltip erklärt was das Level bedeutet.

**`CloudDashboard.tsx`:** Neue KPI-Karte „Souveränitätsbedarf" (Anzahl Systeme mit S2+). Erweiterung des Tabellenfilters um „Nur S2+ anzeigen".

**`CloudReadinessWizard.tsx`:** Die 4 neuen `CloudFields` als Formularschritte ergänzen, mit erklärenden Tooltips:
- „Anbieter-Jurisdiktion": *„Wo ist der Cloud-Anbieter rechtlich ansässig? Relevant für US-CLOUD-Act und DSGVO."*
- „Verschlüsselungshoheit": *„Wer kontrolliert die Schlüssel? BYOK/HYOK bedeutet: Anbieter kann ohne Ihre Schlüssel nicht auf Daten zugreifen."*
- „Portabilitätsreife": *„Wie einfach wäre ein Anbieterwechsel? Proprietäre Formate erhöhen den Lock-in."*
- „Gaia-X-Zertifizierung": *„Ist die Zielumgebung Gaia-X-konform? Relevant für Ausschreibungen öffentlicher Auftraggeber."*

**Qualitätskriterien:** ✓ Level S3 erscheint nur wenn sowohl BYOK als auch Gaia-X/C5 vorhanden · ✓ Tooltips erklären jeden Begriff ohne Fachkenntnisse vorauszusetzen · ✓ Neues Level sichtbar in Cloud-Dashboard-KPIs

---

## BLOCK 4 — CIA-Triade & Schutzbedarfsvererbung (BSI 200-2)

**Ziel:** Den einwertigen `schutzbedarf`-Wert durch eine vollständige CIA-Triade (Vertraulichkeit, Integrität, Verfügbarkeit) ersetzen und die automatische Vererbung entlang modellierter Abhängigkeiten implementieren.

> ⚠️ **Achtung Breaking Change:** `schutzbedarf: string` wird zu einem strukturierten Objekt. **Migrationslogik zwingend.** Alle alten Daten müssen beim Laden konvertiert werden.

### 4.1 Datenmodell: `src/types.ts`
```typescript
export type SchutzbedarfNiveau = 'Normal' | 'Hoch' | 'Sehr hoch' | 'Unklar' | '';

export interface CIASchutzbedarf {
  vertraulichkeit: SchutzbedarfNiveau;
  integritaet: SchutzbedarfNiveau;
  verfuegbarkeit: SchutzbedarfNiveau;
  begruendung?: string;
  vererbt?: boolean;     // true = automatisch berechnet, false = manuell gesetzt
}

// In CloudFields: schutzbedarf wird zu:
schutzbedarf?: CIASchutzbedarf | SchutzbedarfNiveau;  // Union für Migration
// Nach Migration kann der alte string-Typ entfernt werden
```

### 4.2 Migration in `store.ts`
In `mergeWithDefault()` nach dem Array-Key-Check ergänzen:
```typescript
// CIA-Migration: altes string-schutzbedarf zu CIASchutzbedarf konvertieren
function migriereSchutzbedarf(item: Record<string, unknown>): void {
  if (typeof item.schutzbedarf === 'string') {
    const alt = item.schutzbedarf as SchutzbedarfNiveau;
    item.schutzbedarf = {
      vertraulichkeit: alt, integritaet: alt, verfuegbarkeit: alt,
      begruendung: '', vererbt: false
    };
  }
}
// Auf alle Einträge in anwendungen, server, clients, icsSysteme, iotSysteme anwenden
```

### 4.3 Logik: `src/schutzbedarfsVererbung.ts` (neu)
```typescript
export function maxNiveau(a: SchutzbedarfNiveau, b: SchutzbedarfNiveau): SchutzbedarfNiveau
// Reihenfolge: 'Sehr hoch' > 'Hoch' > 'Normal' > 'Unklar' > ''

export function berechneVererbung(state: AppState): AppState
// Algorithmus (BSI-Maximumprinzip):
// 1. Geschäftsprozesse → deren Anwendungen erben den höchsten GP-Schutzbedarf
// 2. Anwendungen → deren Server erben den höchsten Anwendungs-Schutzbedarf
// 3. Server → deren Netzverbindungen als Hinweis
// Gibt neuen AppState zurück mit vererbt=true wo automatisch gesetzt
// Berater kann manuell überschreiben (vererbt=false)
```

### 4.4 UI-Anpassungen

**`CategoryForm.tsx`:** Das bisherige `schutzbedarf`-Dropdown durch 3 nebeneinander stehende Dropdowns ersetzen (V / I / V). Wenn `vererbt=true`: grau hinterlegt mit Hinweis *„Automatisch vererbt von [Objekt-Name] — Klicken zum Überschreiben"*.

**`CloudDashboard.tsx`:** KPI-Karte „Schutzbedarf Übersicht" auf CIA-Triade aufsplitten: 3 kleine Indikatoren C/I/A je mit ihrer Verteilung.

**`SecurityGovernanceArchitektur.tsx`:** Maßnahmen-Empfehlungen verweisen jetzt auf den spezifischen CIA-Wert (z. B. *„Verfügbarkeit Sehr hoch → RTO < 1h erforderlich"*).

**Qualitätskriterien:** ✓ Altes JSON-Backup öffnet korrekt (Migration läuft transparent) · ✓ Vererbungspfad ist in der UI nachvollziehbar dargestellt · ✓ Manuelles Überschreiben möglich und persistent

---

## BLOCK 5 — EU AI Act Inventar & Shadow-AI-Discovery

**Ziel:** Alle KI-Systeme im Anwendungsbestand identifizieren, risikoklassifizieren (Art. 6/7 EU AI Act) und ein EU-AI-Act-konformes Register exportieren.

### 5.1 Datenmodell: `src/types.ts`
```typescript
// Anwendung erweitern (alle optional):
export interface Anwendung extends BaseItem, CloudFields {
  // ... bisherige Felder ...
  istKISystem?: boolean;
  aiRisikoklasse?: 'Verboten' | 'Hoch' | 'Begrenzt' | 'Minimal' | 'Kein KI' | 'Unklar';
  aiRolle?: 'Anbieter' | 'Betreiber' | 'Beides' | 'Unklar';
  aiTrainingsdaten?: 'Interne Daten' | 'Öffentliche Daten' | 'Drittanbieter' | 'Unklar';
  aiMenschlicheAufsicht?: 'Vollständig' | 'Teilweise' | 'Keine' | 'Unklar';
  aiLoggingVorhanden?: 'Ja' | 'Nein' | 'Teilweise' | 'Unklar';
  aiNotizen?: string;
}
```

### 5.2 Logik: `src/compliance/euAiAct.ts` (neu)
```typescript
// Shadow-AI-Heuristik — erkennt wahrscheinliche KI-Systeme:
const AI_KEYWORDS = ['gpt', 'copilot', 'ai', 'llm', 'ml', 'chatbot', 'neural',
  'deeplearning', 'künstliche intelligenz', 'machine learning', 'openai',
  'anthropic', 'gemini', 'watson', 'azure ai', 'sagemaker', 'vertex'];

export function erkenneShadowAI(anwendungen: Anwendung[]): string[]
// Gibt IDs zurück von Anwendungen, deren name/erlaeuterung/tags
// einen AI_KEYWORD enthalten und istKISystem noch nicht gesetzt ist

// Risikoklassifizierungs-Hilfe:
export const AI_HOCHRISIKO_BEISPIELE = [
  'Biometrie / Gesichtserkennung', 'Kreditwürdigkeits-Scoring',
  'HR-Einstellungsentscheidungen', 'Sicherheitskritische Infrastruktur',
  'Strafverfolgung', 'Bildungsbeurteilung', 'Medizinische Diagnose'
];
```

### 5.3 Komponente: `src/components/EuAiActInventar.tsx` (neu)
**Props:**
```typescript
interface Props {
  state: AppState;
  onUpdateAnwendung: (id: string, changes: Partial<Anwendung>) => void;
}
```

**UI-Aufbau:**
- **Banner:** Gelbes Info-Banner (wenn Shadow-AI erkannt): *„X Anwendungen könnten KI-Systeme enthalten (Name/Tags enthalten KI-Schlüsselwörter). Bitte prüfen und klassifizieren."* mit Button „Alle markieren zur Prüfung"
- **KPI-Zeile:** Gesamt KI-Systeme · Hochrisiko · Betreiber-Rolle · Logging vorhanden
- **Tabelle:** Alle `istKISystem=true` Anwendungen mit allen AI-Feldern inline editierbar (analog `LizenzKostenAnalyse.tsx`)
- **Register-Export:** Button „EU AI Act Register exportieren" → Excel mit den EU-AI-Act-Pflichtfeldern (Name, Zweck, Risikoklasse, Rolle, technische Dokumentation vorhanden J/N)
- **Erklärungsbereich:** Ausklappbarer Bereich „Was bedeuten die Risikoklassen?" mit je 2–3 Satz Erklärung und Beispielen aus `AI_HOCHRISIKO_BEISPIELE`

**Navigation:** SubTab `'euaiact'` in `ProjectView.tsx`, Gruppe „Compliance & Regulatorik"

**Qualitätskriterien:** ✓ Shadow-AI-Banner erscheint automatisch ohne manuelle Aktion · ✓ Klassifizierung direkt in der Tabelle möglich · ✓ Export funktioniert ohne Backend

---

## BLOCK 6 — FinOps: Szenarien, AI-Kosten & Value-Tracking

**Ziel:** Das TCO-Modell (LG 6) um FinOps-Denkweise erweitern: Szenario-Vergleich (konservativ / realistisch / optimistisch), expliziter AI/GenAI-Kostenbaustein, Savings-Plans-Hebel.

### 6.1 Datenmodell: `src/types.ts`
```typescript
// TCOZielkostenBlock erweitern:
export interface TCOZielkostenBlock {
  // ... bisherige Felder ...
  aiInferenzkosten?: string;    // Neu: Token-/API-Kosten für GenAI
  savingsPlanRabatt?: string;   // Neu: %-Rabatt durch Reservierungen
  idleRessourcen?: string;      // Neu: geschätzte verschwendete Kosten
}

// Neu: Szenario-Container:
export interface TCOSzenario {
  name: 'Konservativ' | 'Realistisch' | 'Optimistisch';
  faktor: number;     // Multiplikator auf Basiswerte (0.8 / 1.0 / 1.3)
  notiz: string;
}
export interface TCODaten {
  // ... bisherige Felder ...
  szenarien?: TCOSzenario[];
  aktivesSzenario?: 'Konservativ' | 'Realistisch' | 'Optimistisch';
}
```

### 6.2 UI-Erweiterung in `TCOModell.tsx`
- **Szenario-Umschalter** (3 Buttons wie der Zeithorizont-Umschalter): Konservativ / Realistisch / Optimistisch. Tooltip: *„Konservativ = Kosten +20% (Risiko-Puffer), Realistisch = Basiswerte, Optimistisch = Kosten −30% (Best-Case mit Savings Plans)"*
- **Neue CostField-Gruppe „AI & GenAI-Kosten"** im Cloud-Kostenteil:
  - `aiInferenzkosten`: *„Token-/API-Kosten (OpenAI, Azure AI, Bedrock …) pro Jahr"*
  - `savingsPlanRabatt`: *„Erwarteter Rabatt durch Reserved Instances / Savings Plans (in %)"*
  - `idleRessourcen`: *„Geschätzte Kosten für Idle-/Unused-Ressourcen (FinOps-Optimierungspotenzial)"*
- **Optimierungspotenzial-Karte:** Neue grüne Karte unter dem Ergebnis: *„Identifiziertes FinOps-Optimierungspotenzial: X € durch Savings Plans + Y € durch Idle-Abbau"*
- **Szenario-Vergleichstabelle:** Wenn alle 3 Szenarien ausgefüllt, kleine Tabelle mit allen drei Gesamtbeträgen nebeneinander

**Qualitätskriterien:** ✓ Szenario-Wechsel aktualisiert alle Summen sofort · ✓ AI-Kostenbaustein ist separat ausweisbar (für Kunden mit GenAI-Projekten)

---

## BLOCK 7 — EnEfG / CO₂ Nachhaltigkeitsmodul

**Ziel:** CO₂-Footprint und Energieverbrauch der erfassten Server schätzen, On-Prem vs. Cloud-Vergleich in Nachhaltigkeit, CSRD-tauglicher Export.

### 7.1 Logik: `src/sustainability.ts` (neu)
```typescript
export interface EnergieProfil {
  serverId: string;
  kw: number;           // Leistungsaufnahme in kW (Schätzung: 1,5 kW default)
  pue: number;          // Power Usage Effectiveness (default 1.5)
  stunden: number;      // Betriebsstunden/Jahr (default 8760)
  strommixFaktor: number; // kg CO₂/kWh (DE-Mix 2024: 0,38)
  kwhJahr: number;      // = kw × pue × stunden
  co2tJahr: number;     // = kwhJahr × strommixFaktor / 1000
}

export interface NachhaltigkeitsSummary {
  gesamtKwhJahr: number;
  gesamtCO2tJahr: number;
  cloudKwhJahr: number;      // Schätzung Cloud (PUE 1.2, erneuerbarer Strom 0.10)
  cloudCO2tJahr: number;
  co2EinsparungJahr: number; // Delta
  enEfGPflicht: boolean;     // true wenn Gesamtleistung > 300 kW
  enEfGLuecken: string[];    // Fehlende Maßnahmen (Mgmt-System, PUE-Ziel etc.)
}

export function berechneEnergieProfil(server: Server[], customKw?: Record<string, number>): EnergieProfil[]
export function berechneNachhaltigkeit(profile: EnergieProfil[]): NachhaltigkeitsSummary
```

### 7.2 Komponente: `src/components/NachhaltigkeitsModul.tsx` (neu)
**Props:**
```typescript
interface Props { state: AppState; }
```

**UI-Aufbau:**
- **Header:** *„Green IT & Nachhaltigkeitsbewertung"* + Erklärung: *„Schätzt den Energieverbrauch und CO₂-Fußabdruck der erfassten Server-Infrastruktur auf Basis von Richtwerten (anpassbar). Grundlage für CSRD-Berichterstattung und EnEfG-Compliance."*
- **EnEfG-Pflicht-Banner:** Wenn `enEfGPflicht=true`: orange Banner *„Ihr Rechenzentrum hat >300 kW — EnEfG-Pflichten gelten! Management-System bis Juli 2025 (rückwirkend prüfen), PUE ≤ 1,2 für Neubauten ab Juli 2026."*
- **Anpassbare Richtwerte:** Ausklappbarer Bereich mit Schiebereglern für kW/Server (default 1,5), PUE (default 1,5), Strommix-Faktor (default 0,38 für DE)
- **Vergleichsdiagramm:** Balkendiagramm (CSS, kein Chart-Lib) On-Prem vs. Cloud CO₂/Jahr
- **CSRD-Export:** Button → Print-Window mit standardisierter Kennzahlen-Tabelle (kWh/Jahr, tCO₂/Jahr, PUE, Anteil erneuerbarer Energien)

**Navigation:** SubTab `'nachhaltigkeit'` in `ProjectView.tsx`, neue Gruppe „Regulatorik & ESG"

---

## BLOCK 8 — DORA: IKT-Drittparteien-Register

**Ziel:** Finanzunternehmen können das DORA-Informationsregister (IKT-Drittdienstleister) direkt aus erfassten Anwendungs-/Server-Daten ableiten und als CSV exportieren.

### 8.1 Datenmodell: `src/types.ts`
```typescript
export interface IKTDienstleister {
  id: string;
  anbieterName: string;
  leistung: string;            // z.B. „Cloud-Hosting", „SaaS-CRM"
  kritikalitaet: 'Kritisch' | 'Wichtig' | 'Nicht kritisch';
  substituierbar: 'Einfach' | 'Schwer' | 'Nicht substituierbar';
  vertragsnummer: string;
  sitzland: string;
  subdienstleister: string;    // Freitext
  exitStrategie: string;
  verknuepfteAnwendungen: string[];  // IDs aus Anwendungen
  verknuepfteServer: string[];       // IDs aus Server
  notizen: string;
}
```
Migration: `iktDienstleister?: IKTDienstleister[]` in `AppState` (optional).

### 8.2 Komponente: `src/components/DORARegister.tsx` (neu)
- **Tabellenansicht** aller Dienstleister + Inline-Neuanlage
- **Auto-Ableitung:** Button *„Aus Anwendungsdaten ableiten"* — liest alle `lizenzAnbieter`-Werte aus Anwendungen und schlägt je einzigartigen Anbieter als Dienstleister-Entwurf vor
- **DORA-Export:** Button → CSV im Format des BaFin-Informationsregisters (Spalten laut DORA RTS Art. 28)
- **Kritikalitäts-Übersicht:** KPI-Kacheln: Kritische Anbieter / Nicht substituierbar / Drittland-Sitz

**Navigation:** SubTab `'dora'` in `ProjectView.tsx`, Gruppe „Compliance & Regulatorik"

---

## BLOCK 9 — SAM-Compliance: Lizenz-Über-/Unterdeckung

**Ziel:** Zeigt für Software-Anbieter den Soll-Ist-Abgleich (lizenziert vs. eingesetzt) und identifiziert Audit-Risiken — besonders relevant für Microsoft, Oracle, SAP.

### 9.1 Logik (erweiterung von `LizenzKostenAnalyse.tsx`)
- Neue Ansicht **„SAM-Analyse"** als zweiter Tab innerhalb der Lizenzanalyse (Toggle-Buttons oben: „Risiko-Übersicht" / „SAM-Abgleich")
- **Berechnung:** Pro `lizenzAnbieter` Summe aller lizenzierten Instanzen (aus `anzahl`-Feldern verknüpfter Server/Clients) vs. erfasste Einzel-Lizenzen → Delta (positiv = Unterdeckung/Risiko, negativ = Überdeckung/Verschwendung)
- **Audit-Risiko-Ampel:** Microsoft/Oracle/SAP/Adobe automatisch als „Hohes Audit-Risiko" markiert (bekannte aktive Publisher-Audits)
- **True-Up-Schätzung:** Delta × durchschnittlicher Lizenzpreis = potenzielle Nachzahlung

---

## BLOCK 10 — Optionaler KI-Anreicherungs-Assistent (n8n / lokales LLM)

**Ziel:** Berater kann optional einen KI-Endpunkt konfigurieren, der beim Erfassen von Objekten automatisch Vorschläge für Schutzbedarf, Bereitstellung und 6R-Strategie liefert.

> ⚠️ **Designprinzip:** STRIKT optional. Ohne Konfiguration: kein Netzwerk-Request. Kein Default-Endpunkt. Kein kommerzieller API-Key in der App. Funktioniert mit jedem OpenAI-kompatiblen Endpunkt (lokales Ollama, n8n-Webhook, Azure OpenAI, Anthropic API).

### 10.1 Konfigurations-Interface: `src/types.ts`
```typescript
export interface AIConfig {
  enabled: boolean;
  endpunkt: string;         // z.B. "http://localhost:11434/api/chat" (Ollama)
  apiKey?: string;          // Optional (leer = kein Auth-Header)
  modell: string;           // z.B. "llama3", "gpt-4o-mini"
  maxTokens: number;        // default 200
  timeout: number;          // default 5000ms
}
```
Gespeichert in separatem localStorage-Key `'it-sa-ai-config'` (nicht im AppState-Export — enthält potenzielle API-Keys).

### 10.2 Logik: `src/integrations/aiSuggest.ts` (neu)
```typescript
export interface AIVorschlag {
  schutzbedarf?: string;
  bereitstellung?: string;
  migrationskomplexitaet?: string;
  cloudEignung?: string;
  begruendung: string;
  konfidenz: 'Hoch' | 'Mittel' | 'Niedrig';
}

export async function holeAIVorschlag(
  config: AIConfig,
  kategorie: string,
  name: string,
  kontext: string
): Promise<AIVorschlag | null>
// Baut Prompt: "Du bist ein IT-Berater. Analysiere dieses IT-System: {name} ({kategorie}). {kontext}. Gib JSON-Vorschläge für schutzbedarf, bereitstellung, migrationskomplexitaet zurück."
// fetch() gegen config.endpunkt, 5s Timeout, silent fail (null bei Fehler)
```

### 10.3 UI-Integration
**`CategoryForm.tsx`:** Wenn `config.enabled=true`: Pro Objekt ein kleiner „✨ KI-Vorschlag holen"-Button (dezent, nicht im Hauptfluss). Bei Klick: Spinner, dann gelbe Vorschlags-Karte mit allen vorgeschlagenen Werten + Konfidenz + Begründung. Button „Vorschläge übernehmen" (einzeln oder alle). Jeder Vorschlag ist als Vorausfüllung gekennzeichnet (`cloudNotiz` bekommt Auto-Prefix: *„KI-Vorschlag [Datum]: …"*).

**Einstellungs-Panel:** Neuer Bereich im App-Header oder als Modal: „KI-Assistent konfigurieren" mit Feldern für Endpunkt, Modell, API-Key (masked), Test-Button. Deutlicher Hinweis: *„Ihre Daten werden an den konfigurierten Endpunkt gesendet. Verwenden Sie ausschließlich souveräne oder On-Prem-Endpunkte für sensible Kundendaten."*

**Qualitätskriterien:** ✓ Bei `enabled=false` kein einziger Netzwerk-Request · ✓ Fehler werden still abgefangen, nie als Blocking-Error angezeigt · ✓ API-Key wird nie im AppState-Export gespeichert

---

## BLOCK 11 — Snapshot-Versionierung & Delta-Ansicht

**Ziel:** Berater kann den Projektstand zu beliebigen Zeitpunkten einfrieren und später sehen, was sich seit dem letzten Snapshot geändert hat. Wertvolles Werkzeug für Audit-Follow-ups.

### 11.1 Datenmodell
Gespeichert in separatem localStorage-Key `'it-sa-snapshots'` (nicht im Haupt-AppState):
```typescript
export interface Snapshot {
  id: string;
  label: string;           // z.B. "Nach Workshop 1 — 2026-06-19"
  createdAt: string;
  state: AppState;         // vollständige Kopie
}
```

### 11.2 Logik: `src/snapshotStore.ts` (neu)
```typescript
export function saveSnapshot(state: AppState, label: string): Snapshot
export function loadSnapshots(): Snapshot[]
export function deleteSnapshot(id: string): void
export function computeDelta(before: AppState, after: AppState): DeltaResult
// DeltaResult: { added: Record<CategoryKey, BaseItem[]>, removed: ..., changed: ... }
```

### 11.3 Komponente: `src/components/VersionControl.tsx` (neu)
- Liste aller Snapshots mit Datum und Beschriftung
- Button „Snapshot erstellen" (Prompt für Namen)
- Snapshot anklicken → Delta-Ansicht (farbkodiert: grün=neu, gelb=geändert, rot=entfernt)
- Button „Snapshot als JSON exportieren" (Einzelexport für Archiv)
- Maximale Snapshots: 10 (älteste werden automatisch gelöscht, Warnung vorab)

---

## BLOCK 12 — Reifegradmodell & Maturity-Assessment

**Ziel:** Cloud-Transformationsreifegrad in 5 Stufen (analog zu CMMI/AWS CAF) mit Spider-Chart im Executive Summary — gibt Managementpräsentationen sofortige Visualisierung.

### 12.1 Logik: `src/maturity.ts` (neu)
```typescript
export interface MaturityDimension {
  key: string;
  label: string;    // z.B. "Strategie & Governance"
  stufe: 1 | 2 | 3 | 4 | 5;
  begruendung: string;  // aus welchen Daten abgeleitet
}

// 6 Dimensionen (analog AWS CAF):
// 1. Strategie & Wirtschaftlichkeit
// 2. Personal & Kompetenz
// 3. Governance & Compliance
// 4. Plattform & Infrastruktur
// 5. Sicherheit
// 6. Betrieb

export function berechneMaturity(state: AppState): MaturityDimension[]
// Heuristisch: z.B. Dim 4 "Plattform": viele SaaS → Stufe 4; alles On-Prem physisch → Stufe 1
```

### 12.2 UI-Integration in `ExecutiveSummary.tsx`
- **Spider-Chart** (SVG, kein Chart-Lib) über die 6 Dimensionen, 5 Stufen
- Jede Dimension anklickbar → erklärender Text mit Ableitung
- Benchmark-Linie (statisch, branchentypisch): „Typischer Mittelstand 2026: ~Stufe 2,5"

---

## Migrations- & Release-Strategie

### Schema-Versioning (wichtig!)
Alle Schema-Änderungen (Block 3, 4, 5, 6, 8, 10) müssen in `store.ts` abwärtskompatibel migriert werden:

```typescript
// Am Anfang von mergeWithDefault():
const SCHEMA_VERSION = 4; // Aktuell erhöhen bei jeder Breaking-Change-Migration
if (!partial._schemaVersion || partial._schemaVersion < SCHEMA_VERSION) {
  // Migrations-Funktionen in Reihenfolge aufrufen
}
```

### Empfohlene Reihenfolge der Umsetzung (Aufwand vs. Nutzen)

| Runde | Blöcke | Warum |
|---|---|---|
| **Session 1** | Block 1 (Cockpit) | Quick Win, keine Schema-Änderung |
| **Session 2** | Block 2 (NIS2) | Stärkstes Markt-Signal, neues Feld optional |
| **Session 3** | Block 5 (EU AI Act) | Einfache Erweiterung bestehender Anwendungs-Felder |
| **Session 4** | Block 3 (Souveränität) | Ausbau bestehender Cloud-Readiness-Logik |
| **Session 5** | Block 6 (FinOps) | Erweiterung TCOModell.tsx |
| **Session 6** | Block 11 (Snapshots) | Separater Storage, keine Schema-Konflikte |
| **Session 7** | Block 4 (CIA-Triade) | Breaking Change — erfordert sorgfältige Migration |
| **Session 8** | Block 7 (Nachhaltigkeit) | Neue Logik, keine Schema-Änderung |
| **Session 9** | Block 8 (DORA) | Neues optionales Feld |
| **Session 10** | Block 9 (SAM) | Erweiterung bestehender Lizenzanalyse |
| **Session 11** | Block 12 (Maturity) | Executive-Summary-Erweiterung |
| **Session 12** | Block 10 (KI-Assistent) | Komplex, separat konfigurierbar |

---

## Qualitäts-Checkliste (für jede Session)

Bevor ein Block als fertig gilt:

- [ ] **TypeScript:** `npm run build` ohne Fehler und Warnings
- [ ] **Migration:** Altes JSON-Backup (`docs/`-Testdatei) lädt ohne Fehler
- [ ] **Leerer Zustand:** Komponente zeigt sinnvolle Leerzustands-Meldung (kein JS-Fehler)
- [ ] **Druckbarkeit:** Print-Button/Funktion vorhanden und produziert lesbares Ergebnis
- [ ] **Erklärungen:** Jedes neue Fachkonzept hat einen Tooltip oder Info-Text im UI
- [ ] **Offline-Test:** Kein Netzwerk-Request ohne explizite Nutzer-Aktion (außer Block 10)
- [ ] **Responsiv:** Tabellen scroll horizontal auf kleinen Bildschirmen

---

## UI/UX-Prinzipien (für alle Blöcke)

1. **Jedes Fachkonzept muss im Tool erklärt sein** — kein Fachbegriff ohne Tooltip oder Link. Der Berater soll die Bedeutung auch nachschlagen können, wenn er kein Experte ist.
2. **Ampeln vor Zahlen** — Farb-Feedback (rot/gelb/grün) immer sichtbarer als numerische Werte; Zahlen ergänzen, ersetzen nicht.
3. **Handlungsempfehlung statt Diagnose** — Jede Analyse-Sicht endet mit einer konkreten Empfehlung was als nächstes zu tun ist (z.B. *„3 offene Maßnahmen → Als Agenda-Punkt für das nächste Meeting setzen"*).
4. **Progressive Disclosure** — Komplexe Inhalte (z.B. CIA-Vererbungspfade, Szenario-Vergleiche) sind eingeklappt und öffnen sich auf Nutzer-Aktion. Standardansicht bleibt schlicht.
5. **Wording auf Consultant-Level** — Keine rein-technischen Begriffe ohne Erklärung; aber auch kein vereinfachtes Wording das Fachleuten eigenartig vorkommt.

---

*Dieser Plan ist als Prompt-Basis und Arbeitsanweisung konzipiert. Alle Code-Skelette sind als Referenz zu verstehen — exakte Implementierung kann abweichen, muss aber die genannten Qualitätskriterien erfüllen.*
