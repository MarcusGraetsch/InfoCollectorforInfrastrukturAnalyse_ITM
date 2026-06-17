import React, { useState } from 'react';

interface Props {
  customerName: string;
  onClose: () => void;
}

export const EmailTemplate: React.FC<Props> = ({ customerName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const recipient = customerName || '[Kundenname]';

  const emailText = `Betreff: Vorbereitung IT-Strukturanalyse & Cloud-Readiness-Workshop – benötigte Unterlagen

Sehr geehrte Damen und Herren,

vielen Dank für Ihr Vertrauen in HiSolutions AG. Im Rahmen der bevorstehenden IT-Strukturanalyse gemäß BSI IT-Grundschutz (Standard 200-2) und der Vorbereitung des Cloud-Readiness-Workshops möchten wir Sie bitten, uns folgende Unterlagen und Informationen vorab zur Verfügung zu stellen.

Diese Vorarbeit ermöglicht es uns, die gemeinsame Zeit vor Ort optimal zu nutzen und Ihnen fundierte Empfehlungen zu geben.

**Benötigte Unterlagen (soweit vorhanden):**

1. IT-Bestandslisten
   – Übersicht aller Server, Clients, Netzkomponenten (physisch und virtuell)
   – Betriebssysteme und Versionen, ggf. inkl. Support-Ende

2. Anwendungsübersicht / Software-Inventar
   – Liste aller eingesetzten Fachverfahren und Business-Anwendungen
   – Zuständige Ansprechpartner je Anwendung
   – Lizenzmodelle (Perpetual, Subscription, SaaS)

3. Netzwerkdokumentation
   – Netzwerkplan / Topologie-Übersicht (auch vereinfacht)
   – Liste externer Verbindungen (Internet, WAN, VPN)
   – Bandbreiten und Provider

4. Geschäftsprozess-Übersicht
   – Welche Kernprozesse gibt es und welche Systeme/Anwendungen werden dabei genutzt?
   – Zuständige Fachbereiche / Prozessverantwortliche

5. Datenkategorien und Datenschutz
   – Übersicht verarbeiteter Datenkategorien (z.B. Kunden-, Personal-, Finanzdaten)
   – Bestehende Verarbeitungsverzeichnisse (DSGVO)
   – Anforderungen an den Speicherort (z.B. nur Deutschland, EU-DSGVO)

6. Backup und Notfallkonzepte
   – Backup-Konzept und eingesetzte Lösungen
   – RTO/RPO-Anforderungen (Wiederherstellungszeiten)

7. Wartungsverträge und Supportvereinbarungen
   – Übersicht laufender Wartungs- und Supportverträge

8. Räume und Infrastruktur
   – Übersicht relevanter Serverräume / Rechenzentren (Standort, Ausstattung)
   – Anzahl und Lage der Betriebsstandorte / Gebäude

9. Bestehende Sicherheitsdokumentation
   – Vorhandene Sicherheitskonzepte, Richtlinien oder Risikoanalysen
   – Ergebnisse früherer IT-Audits oder Penetrationstests (sofern vorliegend)

**Interview vor Ort:**

Bitte planen Sie zusätzlich ca. 1–2 Stunden für ein strukturiertes Interview mit folgenden Ansprechpartnern ein:
– IT-Leitung / CIO
– System-/Netzwerkadministration
– Datenschutzbeauftragter (DSB)
– ggf. Fachbereichsverantwortliche (je nach Prozesstiefe)

Alle von Ihnen übermittelten Informationen werden vertraulich behandelt und ausschließlich im Rahmen der Analyse verwendet.

Bei Rückfragen stehen wir Ihnen jederzeit gerne zur Verfügung.

Mit freundlichen Grüßen

[Ihr Name]
HiSolutions AG
[Telefon]
[E-Mail]`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailText.replace(/\[Kundenname\]/g, recipient));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-hi-navy px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">E-Mail-Vorlage: Unterlagen-Anforderung</h2>
            <p className="text-white/60 text-sm mt-0.5">Professionelle Vorlage für den Versand an den Kunden</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm text-hi-slate leading-relaxed bg-hi-gray rounded-xl p-4 border border-hi-accent/10">
            {emailText.replace(/\[Kundenname\]/g, recipient)}
          </pre>
        </div>

        <div className="px-6 py-4 border-t border-hi-accent/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-hi-slate hover:text-hi-navy transition-colors">
            Schließen
          </button>
          <button
            onClick={handleCopy}
            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              copied ? 'bg-emerald-600 text-white' : 'bg-hi-accent text-white hover:bg-hi-blue'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Kopiert!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                In Zwischenablage kopieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
