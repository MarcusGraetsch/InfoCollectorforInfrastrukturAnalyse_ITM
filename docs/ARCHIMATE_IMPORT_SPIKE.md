# Spike: ArchiMate-/Archi-Import (NICHT implementiert)

## Status

**Bewusst nicht implementiert.** Dieses Dokument hält die Bewertung fest und
empfiehlt den Import als späteres Feature mit Review-Wizard.

## Frage

Kann aus einem ArchiMate Open Exchange XML (z.B. aus Archi exportiert) ein
sinnvoller Import in die IT-Strukturanalyse abgeleitet werden — also Vorschläge
für Anwendungen, Daten, Geschäftsprozesse, Server/Nodes und Beziehungen?

## Bewertung

### Technisch lesbar? — Ja
Das Open-Exchange-XML ist ein flaches, gut strukturiertes Format
(`<elements>`, `<relationships>`). Ein Parser mit `DOMParser` (im Browser
vorhanden, keine neue Dependency) könnte Elemente und Relationships ohne großen
Aufwand auslesen.

### Semantisch sauber? — Nein, hier liegt das eigentliche Problem
Das Risiko liegt nicht im Parsen, sondern in der **Bedeutung**:

- Ein ArchiMate `ApplicationComponent` kann im Quelltool eine Anwendung, ein
  Produktcontainer, ein technischer Service, ein Plattformdienst oder ein
  abstraktes Capability-Modell sein. Eine 1:1-Übernahme als „Anwendung" würde die
  Strukturanalyse mit semantisch unscharfen Einträgen verunreinigen.
- ArchiMate-Relationships (`Serving`, `Realization`, `Association` …) lassen sich
  nicht eindeutig auf die fachlichen Verknüpfungen der Strukturanalyse abbilden
  (Schnittstelle vs. lose Referenz vs. Beziehung).
- Modelle aus verschiedenen Tools/Modellierern folgen unterschiedlichen
  Konventionen — es gibt keine verlässliche Heuristik.

### Risiko falscher Datenübernahme — Hoch
Ein direkter Import würde mit hoher Wahrscheinlichkeit „Müll" erzeugen, der
anschließend mühsam von Hand bereinigt werden müsste. Import ist hier
**Governance-Arbeit**, kein Parsing-Problem.

## Empfehlung

Import **nicht jetzt** bauen. Wenn überhaupt, dann später als **Review-Wizard**,
der ausschließlich Vorschläge erzeugt und **niemals den `AppState` automatisch
verändert**:

- „Anwendung aus ArchiMate übernehmen?" (Ja / Nein / Mapping anpassen)
- „Geschäftsprozess übernehmen?"
- „Relationship als Schnittstelle oder als einfache Referenz übernehmen?"
- Konflikt-/Duplikat-Erkennung gegen bestehende Objekte

Die signaturseitige Vorbereitung (falls später benötigt) würde so aussehen:

```ts
// NICHT implementiert — nur als Konzept-Signatur dokumentiert.
interface ImportSuggestion {
  kind: 'anwendung' | 'datum' | 'geschaeftsprozess' | 'server' | 'beziehung';
  proposedName: string;
  sourceType: string;           // ArchiMate xsi:type
  confidence: 'hoch' | 'mittel' | 'niedrig';
  rawId: string;
}
// parseArchiMateExchangeXmlToSuggestions(xml: string): ImportSuggestion[]
```

Diese Funktion dürfte ausschließlich Vorschläge liefern — die Übernahme bliebe
eine bewusste Nutzerentscheidung im Wizard.

## Fazit

Export ist klar und wertvoll (siehe `ARCHIMATE_EXPORT.md`). Import ist
verführerisch, aber semantisch riskant und gehört hinter einen Review-Wizard —
nicht in einen Direktimport.
