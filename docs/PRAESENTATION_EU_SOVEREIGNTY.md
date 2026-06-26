# EU Cloud Sovereignty Framework — Folienskript mit Speaker Notes
## IT-Strukturanalyse-Tool · Interne Einführung für Beraterteam

---

## Folie 1 — Titel

**EU Cloud Sovereignty Framework v1.2.1**
Wie wir mit dem IT-Strukturanalyse-Tool strukturiert bewerten,
ob Cloud-Dienste wirklich souverän sind — und was das für unsere Kunden bedeutet.

> *Speaker Note:*
> Einstieg ohne Framework-Theorie. Direkt mit der Praxisfrage beginnen:
> „Ihr kennt das alle: Der Kunde sagt, seine Cloud sei ‚souverän'. Was heißt das eigentlich?"
> Kurze Handshow: Wer hat schon mal ein Souveränitäts-Versprechen eines Anbieters
> nicht nachprüfen können? Das ist der Ausgangspunkt.

---

## Folie 2 — Das Problem: Souveränitäts-Washing

**Was Anbieter behaupten:**
- „Unsere Cloud ist DSGVO-konform"
- „Daten bleiben in Deutschland"
- „Wir sind Gaia-X-zertifiziert"

**Was wir nicht wissen:**
- Wer hat Zugriff auf die Schlüssel?
- Was passiert bei einer Konzernübernahme?
- Kann der Kunde die Daten wirklich rausbekommen?

**Das Risiko:** Kunden investieren in vermeintliche Souveränität —
und merken erst beim nächsten Audit, dass es Papier ist.

> *Speaker Note:*
> Hier ruhig ein konkretes Beispiel einbauen, das ihr aus Projekten kennt
> (anonymisiert). Typisch: Ein Anbieter ist "EU-based", gehört aber einem
> US-Konzern → CLOUD Act greift trotzdem. Das ist nicht Böswilligkeit,
> sondern ein strukturelles Problem, das man nur mit einem Framework
> systematisch sichtbar macht.

---

## Folie 3 — Die Antwort der EU: Das Sovereignty Framework

**EU Cloud Sovereignty Framework v1.2.1**
*DG DIGIT, Oktober 2025 — das offizielle EU-Bewertungsmodell*

Zwei Kernkonzepte:

**SEAL — Sovereignty Effectiveness Assurance Level**
Eine Reifegradskala von 0 bis 4:

| Stufe | Name | Bedeutung |
|---|---|---|
| SEAL-0 | No Sovereignty | Keine relevanten Maßnahmen |
| SEAL-1 | Jurisdictional | EU-Rechtsbindung, Mindeststandard |
| SEAL-2 | Data | Eigene Datenkontrolle (Verschlüsselung) |
| SEAL-3 | Digital Resilience | Wechselfähigkeit, Exit-Plan nachgewiesen |
| SEAL-4 | Full Digital Sovereignty | Gaia-X/C5, vollständige Unabhängigkeit |

**8 Sovereignty Objectives (SOV-1 bis SOV-8)**
Was genau bewertet wird — nächste Folie.

> *Speaker Note:*
> SEAL ist die zentrale Metapher für das Gespräch mit Kunden.
> Analog zu CMMI oder Reifegradbewertungen, die viele kennen.
> Wichtig: SEAL ist kein Zertifikat — es ist eine interne Bewertungsskala.
> Ein Anbieter kann nicht "SEAL-4 besitzen". Wir bewerten, ob ein
> konkreter Workload des Kunden dieses Niveau erreicht.

---

## Folie 4 — Die 8 Souveränitäts-Objektive

Was bewertet das Framework je Workload?

| Kürzel | Thema | Gewicht |
|---|---|---|
| SOV-1 | Strategische Souveränität | 15 % |
| SOV-2 | Recht & Jurisdiktion | 10 % |
| SOV-3 | Daten & KI | 10 % |
| SOV-4 | Operative Resilienz | 15 % |
| SOV-5 | Lieferkette (Supply Chain) | **20 %** |
| SOV-6 | Technologie & Portabilität | 15 % |
| SOV-7 | Sicherheit & Compliance | 10 % |
| SOV-8 | Umwelt & Nachhaltigkeit | 5 % |

**Sovereignty Score** = Σ (IST-SEAL je Objektiv / 4) × Gewicht → 0–100 Punkte

> *Speaker Note:*
> Das Gewicht ist kein Zufall: Supply Chain (SOV-5, 20 %) hat das höchste Gewicht,
> weil die EU hier strukturell die größte Abhängigkeit sieht — Hyperscaler,
> Subprozessoren, Rechenzentrumsausrüstung.
> Kurzer Reality-Check: Wie viele Kunden haben eine vollständige Lieferketten-
> Transparenz ihrer Cloud-Provider? Antwort: fast keiner. Das ist die größte Lücke.
> SOV-8 (Nachhaltigkeit, 5 %) ist bewusst klein — Reporting-Pflicht, kein
> Differenzierungs-Kriterium.

---

## Folie 5 — Wie unser Tool das Framework operationalisiert

**Ohne Tool:** Framework-PDF lesen → Excel → manuell befüllen → veraltet

**Mit IT-Strukturanalyse-Tool:**

```
Kundendaten erfassen          →  Strukturanalyse (Anwendungen, Server, Cloud-Felder)
                                  ↓
Automatische Ableitung        →  SEAL-Ist je SOV-Objektiv aus vorhandenen Daten
                                  ↓
Soll-SEAL aus Schutzbedarf    →  BSI-Schutzbedarfsfelder → Mindest-SEAL je Objektiv
                                  ↓
Gap-Analyse                   →  Priorisiert nach: Gewicht × Gap × Schutzbedarf
                                  ↓
Change-of-Control-Stresstest  →  Was passiert bei Konzernübernahme (CLOUD Act)?
                                  ↓
Report / Export               →  Prüffertige Dokumentation für Audits
```

**Kein Parallelmodell:** Das Tool nutzt die Daten, die bereits in der
Strukturanalyse erfasst wurden — kein Doppelaufwand.

> *Speaker Note:*
> Das ist der wichtigste Satz für das Team: Keine Extraarbeit.
> Wenn der Berater im Workshop ohnehin Jurisdiktion, Schutzbedarf,
> Verschlüsselung und Portabilität erfasst — was wir schon immer taten —
> rechnet das Tool den Sovereignty Score automatisch aus.
> Das ist der Unterschied zu einem separaten Audit-Tool.

---

## Folie 6 — Was das Tool konkret ableitet (Mapping)

Welche Strukturanalyse-Felder fließen in welches SOV-Objektiv?

| SOV-Objektiv | Genutzte Tool-Felder |
|---|---|
| SOV-1 Strategie | Gaia-X-Zertifizierung, Cloud-Strategie-Ziel, EU-Präferenz |
| SOV-2 Recht | Anbieter-Jurisdiktion (EU/USA/Gemischt), Datensouveränität |
| SOV-3 Daten & KI | Verschlüsselungshoheit (BYOK/HYOK), KI-Logging, Personenbezug |
| SOV-4 Resilienz | DORA-/IKT-Register: Exit-Strategien, Konzentrationsrisiko |
| SOV-5 Lieferkette | IKT-Dienstleister: Anzahl, Jurisdiktion, Dokumentationsgrad |
| SOV-6 Technologie | Portabilitätsreife (Standard-Formate vs. proprietär) |
| SOV-7 Security | NIS2-Erfüllungsgrad, C5/ISO-Nachweise, Gaia-X |
| SOV-8 Nachhaltigkeit | Nachhaltigkeitsmodul: PUE, Strommix, Energieverbrauch |

**Lücken werden explizit ausgewiesen** — „Unklar" ist eine valide Antwort
und erscheint als offener Punkt, nicht als Fehler.

> *Speaker Note:*
> Kurz innehalten: Wer hat alle diese Felder schon einmal systematisch
> für einen Kunden erfasst? Das ist der Baseline-Aufwand.
> Die gute Nachricht: In einem Strukturanalyse-Workshop mit 2–3 Tagen
> kommen die meisten dieser Daten ohnehin raus. Das Tool macht sie
> jetzt unmittelbar nutzbar für die Souveränitätsbewertung.

---

## Folie 7 — Der Change-of-Control-Stresstest (Differenzierungs-Feature)

**Frage:** Was passiert, wenn unser „EU-souveräner" Cloud-Anbieter
morgen von einem US-Konzern übernommen wird?

**Stresstest im Tool — US CLOUD Act Szenario:**

Betroffene Objektive fallen auf reduzierte SEAL-Werte:
- SOV-1 (Strategie) → max. SEAL-1
- SOV-2 (Jurisdiktion) → max. SEAL-1 *(EU-Recht nicht mehr allein maßgeblich)*
- SOV-3 (Datenkontrolle) → max. SEAL-1 *(behördlicher Zugriff möglich)*
- SOV-7 (Security) → max. SEAL-1 *(US-Security-Regime)*

**Ergebnis:** Score-Einbruch in Punkte, Vorher/Nachher-Vergleich,
Liste der ausgelösten Gaps.

**Warum das wichtig ist:** Lieferkettenresilienz und Exit-Fähigkeit
(SOV-4, SOV-5) werden zum entscheidenden Unterschied.

> *Speaker Note:*
> Das ist das Gespräch, das wir bisher nicht systematisch mit Kunden
> führen konnten. Jetzt haben wir eine Zahl: „Bei einer CLOUD-Act-Übernahme
> fällt Ihr Sovereignty Score von 68 auf 31 — das entspricht einem
> Wechsel von SEAL-2 auf SEAL-0 in drei kritischen Objektiven."
> Das schlägt jede abstrakte Warnung. Und: Der Stresstest zeigt gleichzeitig,
> welche Maßnahmen (Exit-Plan, eigene Schlüssel) den Schaden begrenzen würden.

---

## Folie 8 — Workflow im Beratungsprojekt

**Wann kommt das Sovereignty Assessment?**

```
Phase A: Erhebung          →  Strukturanalyse-Workshop (Bestandsaufnahme)
                               Cloud-Felder, Schutzbedarf, IKT-Dienstleister

Phase B: Bewertung         →  Sovereignty Score automatisch
(Tool, kein Extraaufwand)     Gap-Analyse + Stresstest

Phase C: Priorisierung     →  Top-3-Gaps je Priorität ansprechen
                               (Gewicht × Gap × Schutzbedarf)

Phase D: Maßnahmen         →  Governance-Themen anlegen, Evidence zuweisen,
                               Rollen benennen (zentrales Governance-Modell)

Phase E: Dokumentation     →  HTML-/Excel-Export mit Souveränitäts-Assessment
                               für Audit / Management-Report
```

**Zeitaufwand zusätzlich:** ~0,5 h je Projekt (Tool macht das Scoring automatisch).
**Mehrwert:** Audit-fähige Dokumentation, die ohne Tool Tage dauern würde.

> *Speaker Note:*
> Phase B ist der Key: Kein separater Souveränitäts-Workshop nötig.
> Die Daten aus Phase A reichen für einen ersten Score.
> In Phase C entsteht der eigentliche Beratungswert: Was priorisieren wir?
> Das Tool liefert die Reihenfolge — wir liefern die Handlungsempfehlung.

---

## Folie 9 — Was das Tool noch nicht kann (Grenzen kennen)

**Ehrliche Einschränkungen:**

- **Kein Anbieter-Check:** Das Tool bewertet Kundendaten — nicht Anbieter-Zertifikate.
  C5-Testate, Gaia-X-Labels müssen wir separat beschaffen und eintragen.

- **Kein Live-Monitoring:** Stichtags-Bewertung. Wenn ein Anbieter übernommen wird,
  muss ein neuer Assessment-Lauf gestartet werden.

- **Kein SBOM/Provenance:** Software-Lieferkette unterhalb der Dienstleister-Ebene
  wird nicht erfasst (SBOM-Anforderungen aus EU Cyber Resilience Act).

- **Heuristisch, nicht normativ:** Der Score ist eine fundierte Schätzung,
  kein rechtsverbindliches Audit-Ergebnis.

**Positionierung:** Das Tool ist die Grundlage für das Gespräch —
nicht das Gespräch selbst.

> *Speaker Note:*
> Diesen Punkt früh und offen ansprechen schützt uns vor Übertreibungen.
> Kunden werden fragen: „Ist das jetzt ein offizielles EU-Zertifikat?"
> Antwort: Nein — aber es ist die strukturierteste Bewertung, die wir
> mit vertretbarem Aufwand machen können, und sie basiert auf dem
> offiziellen EU-Framework. Das ist mehr als fast alle Wettbewerber liefern.

---

## Folie 10 — Nächste Schritte & offene Fragen

**Was wir als Team jetzt brauchen:**

1. **Pilotprojekt identifizieren** — Welches laufende oder kommende Projekt
   eignet sich für den ersten Einsatz des Sovereignty Assessments?

2. **Datenerhebungstiefe klären** — Wie systematisch erfassen wir aktuell
   IKT-Dienstleister, Jurisdiktion, Portabilität im Workshop?

3. **Kundenkommunikation** — Wie pitchen wir das Modul? Eigenständiges
   Add-on oder Teil der Standard-Strukturanalyse?

4. **Export-Review** — Wer prüft den generierten Report auf Mandantengerechtheit?

**Fragen ans Team:**
- Welche Kunden haben heute aktiv Souveränitäts-Anforderungen gestellt?
- Gibt es interne Guidance von HiSolutions zum Thema Gaia-X/C5?

> *Speaker Note:*
> Folie 10 ist Diskussionsfolie — nicht vorlesen, sondern Gespräch eröffnen.
> Wichtigste Frage zuerst: Wer hat ein konkretes Projekt, wo wir das
> nächste Woche einsetzen könnten? Aus der Antwort ergibt sich alles andere.
