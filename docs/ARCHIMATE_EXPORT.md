# ArchiMate-lite Export

## Was dieses Feature tut

Das Tool leitet aus dem bestehenden Datenmodell der IT-Strukturanalyse
(`AppState`) **automatisch** eine ArchiMate-orientierte View- und Export-Schicht
ab. Es erzeugt:

1. Ein deterministisches ArchiMate-lite-Modell (Elemente + Relationships) aus dem
   `AppState`.
2. Drei generierte Views (Mermaid-Vorschau in der UI):
   - **Application Cooperation View** — Anwendungslandschaft + Schnittstellen (Flows)
   - **Technology Usage View** — Anwendungen auf Server/OS/Netz/Standorten
   - **Business/Application Alignment View** — Prozesse ↔ Anwendungen ↔ Daten
3. Export als **JSON-Mapping** (`archimate-lite-<kunde>-<datum>.json`)
4. Export im **ArchiMate Open Exchange XML**-Format (Version 3.0) für das
   Open-Source-Tool [Archi](https://www.archimatetool.com/)
   (`archimate-open-exchange-<kunde>-<datum>.xml`)
5. SVG- und Druck-Export der aktuellen View

Erreichbar in der Projektansicht unter **Analyse & Strategie → ArchiMate-Views**.

## Was dieses Feature ausdrücklich NICHT tut

- **Kein ArchiMate-Editor** — keine manuelle Modellierung in der UI
- Kein Drag & Drop, keine Bearbeitung von ArchiMate-Elementen
- Keine vollständige ArchiMate-Metamodell-Abdeckung
- Keine ADOIT-spezifische Integration, kein Backend, keine Netzwerkanfragen, keine KI
- **Quelle der Wahrheit bleibt die Strukturanalyse.** Das ArchiMate-Modell ist
  abgeleitet, nicht primär gepflegt. Änderungen erfolgen über die Erfassung und
  Verknüpfung der Objekte.

## Mapping: InfoCollector → ArchiMate-lite

### Elemente

| Quelle im AppState | ArchiMate-lite Elementtyp |
|---|---|
| `geschaeftsprozesse` | `BusinessProcess` |
| `daten` | `DataObject` |
| `anwendungen` | `ApplicationComponent` |
| `server` | `Node` |
| `clients` | `Device` |
| `netzkomponenten` | `Device` |
| `netzverbindungen` | `CommunicationNetwork` |
| `betriebssysteme` | `SystemSoftware` |
| `raeume` | `Location` |
| `gebaeude` | `Location` |
| `icsSysteme` | `Device` |
| `iotSysteme` | `Device` |
| `datentraeger` | `Artifact` |
| `iktDienstleister` | `TechnologyService` |

### Relationships

| Quelle | Relationship | Richtung |
|---|---|---|
| `Geschaeftsprozess.anwendungen[]` | `Serving` | Anwendung → Prozess |
| `Geschaeftsprozess.daten[]` | `Access` | Prozess → Daten |
| `Datum.anwendungen[]` | `Access` | Anwendung → Daten |
| `Server/Client/ICS/IoT.anwendungen[]` bzw. `Anwendung.itSysteme[]` | `Deployment` | Node/Device → Anwendung |
| `Server/Client.betriebssysteme[]` | `Assignment` | Node/Device → OS |
| `Server/Netzkomponente.netzverbindungen[]` | `Association` | Asset → Netzverbindung |
| `*.raeume[]` / `*.gebaeude[]` | `Association` | Asset → Location |
| `Schnittstelle` (quell/ziel) | `Flow` | Quelle → Ziel (bidirektional = 2 Flows) |

**Hinweise zum Mapping:**
- Explizite `schnittstellen` sind höherwertig als lose Referenzen.
- Doppelte Relationships werden über eine deterministische ID
  (`rel-<typ>-<source>-<target>`) vermieden.
- Nicht aufgelöste Referenzen werden in `warnings` gesammelt und in der UI
  angezeigt — sie führen **nicht** zum Abbruch.
- Alle Element-IDs sind deterministisch (`el-<kategorie>-<quellId>`).
- `Anwendung` hat kein direktes `daten`-Feld; die Beziehung Anwendung → Daten
  wird daher aus `Datum.anwendungen[]` abgeleitet.

## Die drei Views

### Application Cooperation View
Zeigt alle Anwendungen mit Schnittstellenbezug und die `Flow`-Relationships
dazwischen. Bidirektionale Schnittstellen werden als `<-->` dargestellt, das
Label trägt Protokoll/Ports/Frequenz.

### Technology Usage View
Zeigt, welche Anwendungen auf welcher Infrastruktur laufen. Gruppiert in
Subgraphs: Applications, Compute/Nodes, System Software, Network, Locations.
Enthält `Deployment`-, `Assignment`- und `Association`-Beziehungen.

### Business/Application Alignment View
Zeigt, welche Anwendungen welche Geschäftsprozesse unterstützen (`Serving`) und
welche Datenobjekte betroffen sind (`Access`). Gruppiert: Business, Application,
Data.

## Anleitung: Wie erfasst man Daten für brauchbare Views?

Die Modellqualität entsteht durch saubere Erfassung und Verknüpfung:

1. **Geschäftsprozesse mit Anwendungen verknüpfen** (Feld „Anwendungen" am Prozess)
2. **Anwendungen mit Daten verknüpfen** (Feld „Anwendungen" am Datenobjekt)
3. **Anwendungen mit Servern/IT-Systemen verknüpfen** (`itSysteme` an der Anwendung
   bzw. `anwendungen` am Server/Client)
4. **Server/Clients mit Betriebssystemen verknüpfen** (`betriebssysteme`)
5. **Schnittstellen mit Quell- und Zielanwendung pflegen** und Protokoll, Port,
   Frequenz, Verschlüsselung, Authentifizierung, Richtung erfassen
6. **Netzverbindungen und Netzkomponenten pflegen**, wenn die Technology Usage
   View aussagekräftig sein soll
7. **Räume/Gebäude** an Servern/Komponenten setzen, um Standorte sichtbar zu machen

Die Warnungs-Box in der UI zeigt fehlende Verknüpfungen (z.B. „Anwendung X ist mit
keiner Infrastruktur verknüpft") — eine gute To-do-Liste für die nächste
Erfassungsrunde.

## Exportformate

| Format | Dateiname | Zweck |
|---|---|---|
| JSON | `archimate-lite-<kunde>-<datum>.json` | Vollständiges Mapping (Elemente, Relationships, Views, Warnings, Metadaten) |
| XML | `archimate-open-exchange-<kunde>-<datum>.xml` | Import in Archi & kompatible Tools |
| SVG | `archimate-<view>-<kunde>.svg` | Grafik der aktuellen View |

## Grenzen und bekannte Unschärfen

- **„Deployment" ist keine native ArchiMate-Relationship.** Im internen Modell und
  im JSON wird sie als `Deployment` geführt (klarer Lesbarkeit halber). Im
  **Open-Exchange-XML** wird sie auf `Assignment` abgebildet, damit das XML gegen
  das ArchiMate-3.0-Schema valide bleibt (methodisch nächstliegende Relationship
  für „läuft auf").
- Der XML-Export enthält **nur Elemente und Relationships**, keine grafischen
  Diagramme/Views (Archi kann daraus automatisch Layouts erzeugen).
- `multiref`-Felder werden über `id`, `kuerzel` oder `name` aufgelöst — bei
  Namensdoppelungen kann es theoretisch zu Fehlzuordnungen kommen.
- Bei sehr großen Landschaften können die Mermaid-Vorschauen unübersichtlich
  werden; die Views filtern bereits auf die jeweils relevanten Elemente.

## Technische Architektur

- **`src/utils/archimate.ts`** — Model-Builder, View-Builder, Mermaid, JSON-Export
  (reine Transformationsfunktionen, keine UI-Abhängigkeit, keine Mutation des
  `AppState`)
- **`src/utils/archimateXml.ts`** — Open-Exchange-XML-Serialisierung (String-basiert,
  mit Escaping, keine externe Library)
- **`src/components/ArchiMateViews.tsx`** — UI (3 Tabs, Mermaid-Preview, Export,
  Warnungen)
- **`src/__tests__/archimate.test.ts`** — Unit-Tests für Mapping, Views, JSON & XML

> **Hinweis:** Das ArchiMate-Modell ist **abgeleitet, nicht primär gepflegt.**
> Es ersetzt kein EA-Repository, sondern macht die in der Strukturanalyse
> erfassten Zusammenhänge in einer EA-Sprache sichtbar und exportierbar.
