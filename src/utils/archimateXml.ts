import type { AppState } from '../types';
import type { ArchiMateModel, ArchiMateRelationshipType } from './archimate';
import { buildArchiMateModel, GENERATOR_NAME } from './archimate';

/**
 * Export im ArchiMate Open Exchange File Format (Version 3.0) für das
 * Open-Source-Tool "Archi" und andere kompatible Werkzeuge.
 *
 * Bewusst minimal gehalten: nur Elemente und Relationships (keine Diagramme/
 * grafischen Views), nur unterstützte Typen. Reine String-Serialisierung mit
 * Escaping — keine externe XML-Library.
 *
 * Quelle: http://www.opengroup.org/xsd/archimate/3.0/
 */

/** XML-Text-Escaping. */
function xmlEsc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * ArchiMate kennt keine eigenständige "Deployment"-Relationship.
 * Für valides Open-Exchange-XML wird Deployment auf Assignment abgebildet
 * (die methodisch nächstliegende ArchiMate-Relationship für "läuft auf").
 */
function xmlRelationshipType(type: ArchiMateRelationshipType): string {
  if (type === 'Deployment') return 'Assignment';
  return type;
}

function indent(level: number): string {
  return '  '.repeat(level);
}

/** Baut das Open-Exchange-XML aus einem bereits berechneten Modell. */
export function modelToExchangeXml(model: ArchiMateModel): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<model xmlns="http://www.opengroup.org/xsd/archimate/3.0/" ' +
      'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
      'xsi:schemaLocation="http://www.opengroup.org/xsd/archimate/3.0/ ' +
      'http://www.opengroup.org/xsd/archimate/3.0/archimate3_Model.xsd" ' +
      `identifier="${xmlEsc(model.id)}">`
  );

  // Modell-Metadaten
  lines.push(indent(1) + `<name xml:lang="de">${xmlEsc(model.name)}</name>`);
  lines.push(indent(1) + `<documentation xml:lang="de">ArchiMate-lite mapping derived from IT-Strukturanalyse AppState. ` +
    `Erzeugt von ${xmlEsc(GENERATOR_NAME)} am ${xmlEsc(model.generatedAt)}.</documentation>`);

  // Elemente
  lines.push(indent(1) + '<elements>');
  for (const el of model.elements) {
    lines.push(indent(2) + `<element identifier="${xmlEsc(el.id)}" xsi:type="${xmlEsc(el.type)}">`);
    lines.push(indent(3) + `<name xml:lang="de">${xmlEsc(el.name)}</name>`);
    if (el.documentation) {
      lines.push(indent(3) + `<documentation xml:lang="de">${xmlEsc(el.documentation)}</documentation>`);
    }
    lines.push(indent(2) + '</element>');
  }
  lines.push(indent(1) + '</elements>');

  // Relationships
  if (model.relationships.length > 0) {
    lines.push(indent(1) + '<relationships>');
    for (const rel of model.relationships) {
      lines.push(
        indent(2) +
          `<relationship identifier="${xmlEsc(rel.id)}" source="${xmlEsc(rel.source)}" ` +
          `target="${xmlEsc(rel.target)}" xsi:type="${xmlEsc(xmlRelationshipType(rel.type))}">`
      );
      if (rel.name) {
        lines.push(indent(3) + `<name xml:lang="de">${xmlEsc(rel.name)}</name>`);
      }
      lines.push(indent(2) + '</relationship>');
    }
    lines.push(indent(1) + '</relationships>');
  }

  lines.push('</model>');
  return lines.join('\n');
}

/** Bequemer Wrapper: AppState → Open-Exchange-XML. */
export function buildArchiMateExchangeXml(state: AppState): string {
  return modelToExchangeXml(buildArchiMateModel(state));
}
