/**
 * Fuzzy-Keyword-Mapping für den Excel/CSV-Import.
 *
 * Ordnet interne Feldschlüssel (field.key) alternativen deutschen und englischen
 * Spaltenköpfen zu, wie sie in CMDB-Exporten, Inventarlisten oder manuell
 * erstellten Excel-Tabellen vorkommen.
 *
 * Matching-Strategie (Reihenfolge in findeMapping):
 *   1. Exakter Treffer (case-insensitive)
 *   2. Spalte enthält Alias als Substring
 *   3. Alias enthält Spalte als Substring (nur wenn Spalte ≥ 3 Zeichen)
 */

export const FELD_ALIASE: Record<string, string[]> = {
  // ── Basis-Felder (alle Kategorien) ──────────────────────────────────────────
  kuerzel:    ['Kürzel', 'Kuerzel', 'ID', 'Kennung', 'Kurzbezeichnung', 'Short Name', 'Kurzname', 'Asset ID', 'Asset-ID'],
  name:       ['Name', 'Bezeichnung', 'Titel', 'Description', 'Beschreibung', 'Komponentenname'],
  erlaeuterung: ['Erläuterung', 'Erlaeuterung', 'Kommentar', 'Notiz', 'Bemerkung', 'Hinweis', 'Anmerkung', 'Notes', 'Comment', 'Remarks', 'Beschreibung detail'],
  status:     ['Status', 'Betriebsstatus', 'Zustand', 'State'],
  tags:       ['Tags', 'Schlagwörter', 'Schlagwoerter', 'Stichworte', 'Keywords', 'Labels'],
  verantwortlicher: ['Verantwortlicher', 'Verantwortlich', 'Owner', 'Zuständig', 'Zustaendig', 'IT-Verantwortlicher'],
  standort:   ['Standort', 'Location', 'Ort', 'Gebäude', 'Gebaeude', 'Site', 'Raum'],
  plattform:  ['Plattform', 'Platform', 'Umgebung', 'Environment', 'Infrastruktur'],

  // ── Hardware-Felder (Server, Clients, ICS, IoT, Netzkomponenten) ────────────
  hersteller:        ['Hersteller', 'Manufacturer', 'Vendor', 'Brand', 'Marke', 'Lieferant'],
  modell:            ['Modell', 'Model', 'Typ', 'Type', 'Gerätetyp', 'Geraetetyp', 'Artikel', 'Artikelbezeichnung'],
  seriennummer:      ['Seriennummer', 'Serial', 'SN', 'Serial Number', 'Seriennr', 'S/N'],
  inventarnummer:    ['Inventarnummer', 'Inventar', 'Inventar-Nr', 'Asset Number', 'Asset-Nr', 'Asset Nr', 'Inventory', 'Inventory Number'],
  managementIp:      ['Management IP', 'MGMT IP', 'iDRAC IP', 'iLO IP', 'BMC IP', 'Management-IP', 'IPMI IP', 'Remote-Management IP'],
  stromverbrauchW:   ['Stromverbrauch', 'Strom', 'Watt', 'Power', 'Leistung W', 'Leistungsaufnahme', 'Power Consumption', 'Leistung (W)'],
  leistungKW:        ['Leistung kW', 'kW', 'Kilowatt', 'Leistung (kW)'],
  hoeheneinheiten:   ['HE', 'Höheneinheiten', 'Hoeheneinheiten', 'Rack Units', 'RU', 'U', 'Rack-HE'],
  formfaktor:        ['Formfaktor', 'Form Factor', 'Bauform', 'Gehäuseform'],
  cpu:               ['CPU', 'Prozessor', 'Processor', 'CPU-Typ', 'Prozessortyp', 'CPU Modell', 'Prozessor-Modell'],
  ram:               ['RAM', 'Arbeitsspeicher', 'Memory', 'Speicher RAM', 'RAM (GB)', 'Hauptspeicher'],
  speicher:          ['Speicher', 'Disk', 'Storage', 'HDD', 'SSD', 'Festplatte', 'Disk-Kapazität', 'Speicherkapazität'],
  redundanz:         ['Redundanz', 'Redundancy', 'HA', 'Hochverfügbarkeit', 'High Availability'],
  produktivnahmeDatum: ['Produktivnahme', 'In Betrieb', 'Inbetriebnahme', 'Installation Date', 'Commissioning', 'Go-Live', 'In-Betrieb-Datum'],
  softwareSupportEnde: ['Software Support Ende', 'Software EOL', 'OS EOL', 'SW Support Ende', 'Software End of Life'],

  // ── Wirtschaftlichkeit-Felder ────────────────────────────────────────────────
  anschaffungsdatum:      ['Anschaffungsdatum', 'Kaufdatum', 'Purchase Date', 'Acquisition Date', 'Kaufjahr', 'Beschaffungsdatum'],
  anschaffungspreis:      ['Anschaffungspreis', 'Kaufpreis', 'Purchase Price', 'Preis', 'Kosten', 'Cost', 'Anschaffungskosten', 'Investitionskosten'],
  abschreibungsdauerJahre:['Abschreibungsdauer', 'AfA', 'Nutzungsdauer', 'Depreciation', 'Laufzeit Jahre', 'AfA-Dauer', 'Abschreibung'],
  jaehrlBetriebskosten:   ['Betriebskosten', 'Jährliche Kosten', 'Jaehrliche Kosten', 'Operating Cost', 'OPEX', 'Laufende Kosten', 'Betriebskosten p.a.'],
  wartungsvertrag:        ['Wartungsvertrag', 'Wartung', 'Maintenance Contract', 'Support Vertrag', 'SLA', 'Servicevertrag', 'Pflegevertrag'],
  wartungskostenJahr:     ['Wartungskosten', 'Maintenance Cost', 'Support Kosten', 'Wartungskosten p.a.', 'Wartung p.a.'],
  vertragsbeginn:         ['Vertragsbeginn', 'Contract Start', 'Laufzeit Beginn', 'Vertrag Start', 'Beginn'],
  vertragsende:           ['Vertragsende', 'Contract End', 'Laufzeit Ende', 'Ablauf', 'Vertrag Ende', 'Ablaufdatum'],
  kuendigungsfrist:       ['Kündigungsfrist', 'Kuendigungsfrist', 'Notice Period', 'Kündigung', 'Kuendigung'],
  supportEnde:            ['Support Ende', 'End of Support', 'EOS', 'EOL', 'End of Life', 'Support-Ende', 'Herstellersupport Ende'],
  kostenstelle:           ['Kostenstelle', 'Cost Center', 'KST', 'CC', 'Kostenträger', 'Kostenstellen-Nr'],

  // ── Anwendungs-Tiefe ────────────────────────────────────────────────────────
  produktname:       ['Produktname', 'Produkt', 'Product', 'Software Name', 'Produktbezeichnung'],
  version:           ['Version', 'Versionsnummer', 'Release', 'Ver.', 'Softwareversion', 'Release-Version'],
  updateZyklus:      ['Update-Zyklus', 'Patch-Zyklus', 'Update Cycle', 'Patch Interval', 'Patchzyklus', 'Updatezyklus'],
  linkBetriebshandbuch: ['Betriebshandbuch', 'Handbuch Link', 'Manual URL', 'Dokumentation', 'Betriebsanleitung'],
  linkRepository:    ['Repository', 'Repo', 'Git', 'Source Code', 'Git-URL', 'Source-URL'],
  linkHersteller:    ['Hersteller Link', 'Vendor URL', 'Product URL', 'Hersteller-URL', 'Produktseite'],

  // ── Cloud-Readiness-Felder ───────────────────────────────────────────────────
  schutzbedarf:      ['Schutzbedarf', 'Protection Demand', 'Schutzklasse', 'Sicherheitsstufe', 'Security Level'],
  bereitstellung:    ['Bereitstellung', 'Deployment', 'Betriebsart', 'Hosting', 'Betriebsform', 'Infrastrukturtyp'],
  migrationsstrategie: ['Migrationsstrategie', 'Migration', 'Migration Strategy', '6R', 'Cloud-Strategie'],
  migrationskomplexitaet: ['Migrationskomplexität', 'Migrationskomplexitaet', 'Complexity', 'Migration Complexity'],

  // ── Betriebssystem-Felder (Kategorie: betriebssysteme) ───────────────────────
  kernel:         ['Kernel', 'Kernel Version', 'Kernelversion'],
  patchLevel:     ['Patch Level', 'Patch Stand', 'Patchstand', 'CU', 'Update Stand', 'Patch-Stand', 'KB-Stand'],
  lizenztyp:      ['Lizenztyp', 'Lizenz', 'License Type', 'License', 'Lizenzart'],
  architektur:    ['Architektur', 'Architecture', 'x64', 'ARM', 'CPU-Architektur', 'Prozessor-Architektur'],

  // ── Schnittstellen-Felder (Kategorie: schnittstellen) ────────────────────────
  quellAnwendung: ['Quelle', 'Quell-Anwendung', 'Source', 'From', 'Von', 'Quellsystem', 'Source Application'],
  zielAnwendung:  ['Ziel', 'Ziel-Anwendung', 'Target', 'Destination', 'To', 'Nach', 'Zielsystem', 'Target Application'],
  protokoll:      ['Protokoll', 'Protocol', 'Kommunikationsprotokoll', 'Übertragungsprotokoll'],
  ports:          ['Port', 'Ports', 'TCP Port', 'UDP Port', 'Portnummer', 'TCP-Port', 'UDP-Port'],
  richtung:       ['Richtung', 'Direction', 'Kommunikationsrichtung', 'Flow Direction'],
  verschluesselung: ['Verschlüsselung', 'Verschluesselung', 'Encryption', 'TLS', 'SSL', 'Verschlüsselungsstandard'],
  authentifizierung: ['Authentifizierung', 'Auth', 'Authentication', 'Authn', 'Zugangskontrolle'],
  firewallRegel:  ['Firewall', 'Firewall-Regel', 'FW Rule', 'Network Rule', 'FW-Regel', 'Firewall Rule'],
  datenfluss:     ['Datenfluss', 'Data Flow', 'Payload', 'Daten', 'Übertragungsinhalt'],
  frequenz:       ['Frequenz', 'Frequency', 'Interval', 'Häufigkeit', 'Haeufigkeit', 'Übertragungsintervall'],
  synchronitaet:  ['Synchronität', 'Synchronitaet', 'Sync', 'Async', 'Synchron', 'Asynchron', 'Synchronous'],

  // ── Multi-Data-Section Felder ────────────────────────────────────────────────
  netzwerkInterfaces: ['Netzwerk-Interfaces', 'Interfaces', 'Network Interfaces', 'NICs', 'Netzwerkkarten', 'NIC'],
  lizenzen:           ['Lizenzen', 'Licenses', 'Lizenzinformationen', 'License Info', 'Softwarelizenzen'],
};

/**
 * Sucht den Feldschlüssel für einen gegebenen Excel-Spaltenkopf.
 *
 * Matching-Stufen (erste Übereinstimmung gewinnt):
 *   1. Exakter Match (case-insensitive, trimmed)
 *   2. Spalte enthält Alias als Substring
 *   3. Alias enthält Spalte als Substring (nur wenn Spalte ≥ 3 Zeichen lang)
 */
export function findeMapping(spalte: string): string | undefined {
  const lower = spalte.toLowerCase().trim();
  if (!lower) return undefined;
  for (const [feldKey, aliase] of Object.entries(FELD_ALIASE)) {
    for (const alias of aliase) {
      const al = alias.toLowerCase();
      if (al === lower) return feldKey;                          // exakter Treffer
      if (lower.includes(al)) return feldKey;                   // Spalte enthält Alias
      if (lower.length >= 3 && al.includes(lower)) return feldKey; // Alias enthält Spalte
    }
  }
  return undefined;
}
