# Handout: EU Cloud Sovereignty Framework & IT-Strukturanalyse-Tool
**Für das Beraterteam · Stand: Juni 2026**

---

## Was ist das EU Cloud Sovereignty Framework?

Das EU Cloud Sovereignty Framework v1.2.1 (DG DIGIT, Oktober 2025) ist das offizielle europäische Bewertungsmodell für Cloud-Souveränität. Es definiert verbindlich, was „souveräne Cloud" in einem EU-Kontext bedeutet — und macht damit Schluss mit Marketing-Begriffen ohne nachprüfbaren Inhalt.

Das Framework ist relevant für alle Kunden, die Cloud-Dienste einsetzen oder planen und dabei regulatorischen Anforderungen unterliegen: NIS2-Betroffene, KRITIS-Betreiber, Behörden, aber auch privatwirtschaftliche Unternehmen mit hohem Schutzbedarf oder Exportkontroll-Themen.

---

## Die zwei Kernkonzepte

### 1. SEAL — Sovereignty Effectiveness Assurance Level

SEAL ist eine fünfstufige Reifegradskala (0–4), die beschreibt, wie weit ein Workload oder eine Cloud-Umgebung tatsächliche Souveränität erreicht:

- **SEAL-0** — No Sovereignty: Keine relevanten Maßnahmen. Anbieter hat vollständige Kontrolle, Jurisdiktion unklar.
- **SEAL-1** — Jurisdictional: Minimaler EU-Rechtsrahmen. Daten im EU-Raum, DSGVO-Vertrag vorhanden, aber keine Datenkontrolle.
- **SEAL-2** — Data: Eigene Datenkontrolle. Eigene Verschlüsselungsschlüssel (BYOK/HYOK), Datenklassifizierung dokumentiert.
- **SEAL-3** — Digital Resilience: Wechselfähigkeit nachgewiesen. Exit-Plan, offene Formate, Multi-Provider-Fähigkeit belegt.
- **SEAL-4** — Full Digital Sovereignty: Vollständige Unabhängigkeit. Gaia-X- oder C5-konform, Confidential Computing, keine strategische Abhängigkeit.

**Wichtig:** SEAL ist keine Zertifizierung, die ein Anbieter „hat". Es ist eine Bewertung, die wir für einen konkreten Kundendatensatz auf einem konkreten Dienst vornehmen. SEAL-4 auf Azure ist möglich — wenn die richtigen Schlüssel, Verträge und Exit-Strategien vorhanden sind.

### 2. Acht Sovereignty Objectives (SOV-1 bis SOV-8)

Das Framework bewertet Cloud-Souveränität entlang acht Dimensionen mit unterschiedlichen Gewichten, die den EU-strategischen Prioritäten entsprechen:

| # | Thema | Gewicht | Kernfrage |
|---|---|---|---|
| SOV-1 | Strategische Souveränität | 15 % | Hat der Kunde eine EU-unabhängige Cloud-Strategie? |
| SOV-2 | Recht & Jurisdiktion | 10 % | Gilt EU-Recht — ohne Ausnahmen? |
| SOV-3 | Daten & KI | 10 % | Wer kontrolliert Daten und KI-Modelle? |
| SOV-4 | Operative Resilienz | 15 % | Kann der Kunde den Anbieter wechseln, wenn er muss? |
| SOV-5 | Lieferkette | **20 %** | Wie transparent ist die gesamte Provider-Kette? |
| SOV-6 | Technologie | 15 % | Sind offene Standards und Interoperabilität gewährleistet? |
| SOV-7 | Sicherheit & Compliance | 10 % | Welche Nachweise (C5, ISO 27001) liegen vor? |
| SOV-8 | Nachhaltigkeit | 5 % | Energie- und CO₂-Reporting vorhanden? |

Der **Sovereignty Score** (0–100) ergibt sich aus der gewichteten Summe der normalisierten SEAL-Werte je Objektiv. Ein Score von 75 bedeutet, dass der Workload im Durchschnitt zwischen SEAL-3 und SEAL-4 liegt — aber die Teilscores je Objektiv zeigen, wo konkret Lücken sind.

**Warum ist SOV-5 das höchste Gewicht?** Die EU sieht hier die gravierendste strukturelle Abhängigkeit: Hyperscaler, ihre Subprozessoren, Rechenzentrumsausrüster und Software-Lieferketten sind fast vollständig außerhalb der EU kontrolliert. Ein Anbieter mit EU-Rechenzentrum, aber US-Mutterkonzern, US-Chipsätzen und US-Software hat eine Lieferketten-Souveränität von nahe null.

---

## Wie das IT-Strukturanalyse-Tool das Framework operationalisiert

### Das Grundprinzip: kein Doppelaufwand

Das Tool nutzt ausschließlich Daten, die in der Strukturanalyse ohnehin erfasst werden: Anbieter-Jurisdiktion, Schutzbedarf, Verschlüsselungshoheit, Portabilität, IKT-Dienstleister-Register, NIS2-Erfüllungsgrad. Es leitet daraus automatisch den SEAL-Ist-Wert je SOV-Objektiv ab — ohne zusätzlichen Erhebungsaufwand.

Was das Tool neu hinzufügt, ist die **Ableitung des SOLL-SEAL** aus dem BSI-Schutzbedarf:

- **Normaler Schutzbedarf** → SEAL-1 als Mindest (Jurisdiktions-Minimum)
- **Hoher Schutzbedarf** → SEAL-2 als Mindest (eigene Datenkontrolle zwingend)
- **Sehr hoher Schutzbedarf** → SEAL-3 als Mindest (Wechselfähigkeit und Supply-Chain-Nachweis)

Aus SOLL minus IST ergibt sich die **Gap-Liste**, automatisch priorisiert nach:

> **Priorität = SOV-Gewicht × Gap-Größe × Schutzbedarf-Faktor**

Das bedeutet: Ein Gap bei SOV-5 (Supply Chain, 20 % Gewicht) mit hohem Schutzbedarf steht immer oben — auch wenn der absolute Gap kleiner ist als bei einem anderen Objektiv.

### Der Change-of-Control-Stresstest

Das Differenzierungs-Feature: Das Tool simuliert, was passiert, wenn ein heute als souverän bewerteter EU-Anbieter von einem Nicht-EU-Konzern übernommen wird. Der Default-Fall ist der **US CLOUD Act** — der wichtigste reale Risikovektor.

Beim US CLOUD Act greifen US-Behörden (FBI, NSA) auf Daten von US-Konzernen zu, unabhängig davon, wo die Daten physisch liegen. Das betrifft nicht nur direkte US-Anbieter, sondern jede europäische Tochterfirma eines US-Konzerns. Die betroffenen Objektive (SOV-1, SOV-2, SOV-3, SOV-7) fallen auf maximal SEAL-1.

Das Ergebnis: Ein konkreter Score-Einbruch in Punkten, eine Vorher/Nachher-Ansicht und die Liste der ausgelösten Gaps. Das gibt uns die Grundlage für ein Gespräch, das bisher abstrakt blieb: „Wenn Microsoft Azure morgen durch einen US-Kongressbeschluss vollständig unter CLOUD Act fällt, sinkt Ihr Sovereignty Score von 72 auf 28. Die einzige Gegenmaßnahme mit nennenswerter Wirkung ist ein nachgewiesener Exit-Plan — das ist SOV-4."

---

## Einbettung in den Beratungsworkflow

Das Sovereignty Assessment ist kein separates Projektmodul. Es entsteht als Nebenprodukt einer sauber durchgeführten Strukturanalyse.

**Phase A — Datenerhebung (Workshop):** Die relevanten Cloud-Felder werden ohnehin erfasst: Anbieter, Bereitstellungsmodell, Jurisdiktion, Schutzbedarf, Verschlüsselung, Portabilität. Neu hinzu kommt die konsequente Pflege des IKT-Dienstleister-Registers mit Jurisdiktions-Angabe je Dienstleister.

**Phase B — Automatische Auswertung (im Tool):** Der Sovereignty Score, die SEAL-Matrix und die Gap-Liste entstehen ohne weiteren Aufwand aus den erfassten Daten. Der Stresstest ist ein Knopfdruck.

**Phase C — Beratungsgespräch:** Die Top-3-Gaps (nach Priorität) werden mit dem Kunden besprochen. Das Tool liefert die Reihenfolge — wir liefern die Handlungsempfehlung. Typische Ergebnisse: Exit-Plan dokumentieren (SOV-4), eigene Schlüssel einführen (SOV-3), IKT-Register vervollständigen (SOV-5).

**Phase D — Maßnahmen und Governance:** Die identifizierten Gaps werden als Governance-Themen im Tool angelegt: verantwortliche Rolle benennen, Evidence-Anforderung hinterlegen, Fälligkeit setzen. Alles im zentralen Governance-Modell — keine separate Aufgabenliste.

**Phase E — Dokumentation:** Der HTML- oder Excel-Export enthält das vollständige Souveränitäts-Assessment in audit-fähiger Form. Nicht als PowerPoint, sondern als strukturierter Datensatz, der beim nächsten Audit aktualisiert und neu exportiert werden kann.

---

## Was bleibt unsere Aufgabe als Berater

Das Tool automatisiert die Aggregation und Priorisierung — es ersetzt nicht das Urteil.

**Was das Tool nicht kann:** Anbieter-Zertifikate beschaffen, Verträge lesen, einschätzen ob ein C5-Testat wirklich zum Leistungsumfang des Kunden passt, oder beurteilen ob ein Exit-Plan realistisch umsetzbar ist.

**Was wir als Berater liefern:** Die Datenerhebung im Workshop mit dem richtigen Fragehorizont; die Einschätzung, welche Gaps wirklich kritisch sind und welche tolerierbar; die Übersetzung des Scores in eine Handlungsempfehlung, die der Kunde finanzieren und umsetzen kann; und die Einschätzung, welche SEAL-Stufe für welchen Kontext tatsächlich angemessen ist. Nicht jeder Workload braucht SEAL-4.

---

## Häufige Missverständnisse

**„SEAL-4 ist das Ziel für alle."** — Nein. SEAL-4 ist das Ziel für Workloads mit sehr hohem Schutzbedarf unter maximalem Angriffsdruck (Behörden, kritische Infrastruktur). Für ein Intranet-Portal reicht SEAL-1. Die Kunst ist die Schutzbedarf-gerechte Einordnung.

**„EU-Rechenzentrum = souverän."** — Nein. Jurisdiktion (SOV-2) ist nur ein Teilaspekt mit 10 % Gewicht. Ohne eigene Schlüssel, ohne Exit-Plan und ohne transparente Lieferkette kommt man über SEAL-1 nicht hinaus.

**„Der Score ist ein Audit-Ergebnis."** — Nein. Der Score ist eine fundierte Schätzung auf Basis verfügbarer Daten. Er ist Ausgangspunkt für das Gespräch, nicht Abschluss. Ein formales Audit erfordert Dokumentenprüfung, Interviews und externe Zertifizierung.

**„Das Tool ersetzt das Framework-Studium."** — Das Framework-Dokument (ca. 80 Seiten) enthält Begründungen, Literaturverweise und Contributing-Factor-Details, die nicht im Tool sind. Für tiefe Fachgespräche mit Kunden lohnt die Lektüre von Abschnitt 4 (die 8 Objectives mit ihren Contributing Factors).

---

## Kurzreferenz: Scoring-Formel

```
Sovereignty Score (0–100) =
  Σ über alle 8 Objektive:
    (IST-SEAL-Wert / 4) × 100 × Objektiv-Gewicht
```

Beispiel:
- SOV-5 (Lieferkette, 20 % Gewicht): IST-SEAL = 2 → Beitrag = (2/4) × 100 × 0.20 = 10 Punkte
- SOV-1 (Strategie, 15 % Gewicht): IST-SEAL = 3 → Beitrag = (3/4) × 100 × 0.15 = 11.25 Punkte

Maximaler Score = alle SEAL-4 = 100 Punkte.
