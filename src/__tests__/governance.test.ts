import { describe, it, expect } from 'vitest';
import {
  ROLE_CATALOG, seedRoleAssignments, roleProgress, topicCompletion,
  evidenceProgress, roleName, evidenceForTopic, topicsForEvidence, openActions, makeId,
} from '../utils/governance';
import { createDefaultState, mergeWithDefault } from '../store';
import type { GovernanceTopic, EvidenceItem, RoleAssignment } from '../types';

describe('Querschnitt — Governance-Modell', () => {
  it('Default-State enthält die neuen Arrays (leer)', () => {
    const s = createDefaultState();
    expect(s.governanceTopics).toEqual([]);
    expect(s.evidenceItems).toEqual([]);
    expect(s.roleAssignments).toEqual([]);
  });

  it('alte Backups ohne neue Arrays laden migrationssicher', () => {
    const merged = mergeWithDefault({ customerName: 'Alt', lastUpdated: '2020-01-01' } as never);
    expect(Array.isArray(merged.governanceTopics)).toBe(true);
    expect(Array.isArray(merged.evidenceItems)).toBe(true);
    expect(Array.isArray(merged.roleAssignments)).toBe(true);
  });

  it('Rollen-Seed-Katalog hat 20 Rollen mit eindeutigen Keys', () => {
    expect(ROLE_CATALOG.length).toBe(20);
    const keys = ROLE_CATALOG.map(r => r.key);
    expect(new Set(keys).size).toBe(20);
    for (const r of ROLE_CATALOG) expect(r.relevanz.length).toBeGreaterThan(0);
  });

  it('seedRoleAssignments erzeugt 20 Rollen und ist idempotent', () => {
    const first = seedRoleAssignments([]);
    expect(first.length).toBe(20);
    expect(first.every(r => r.status === 'Offen')).toBe(true);
    const again = seedRoleAssignments(first);
    expect(again.length).toBe(20); // keine Duplikate
  });

  it('seedRoleAssignments ergänzt nur fehlende Rollen', () => {
    const partial: RoleAssignment[] = [{ id: 'x', key: 'isb', roleName: 'ISB', relevanz: ['isms'], personName: 'Frau A' }];
    const result = seedRoleAssignments(partial);
    expect(result.length).toBe(20);
    expect(result.find(r => r.key === 'isb')?.personName).toBe('Frau A'); // bestehende unverändert
  });

  it('roleProgress zählt benannt / Vertretung / Nachweis', () => {
    const roles: RoleAssignment[] = [
      { id: '1', roleName: 'A', relevanz: ['isms'], personName: 'P', deputy: 'D', evidenceIds: ['e1'] },
      { id: '2', roleName: 'B', relevanz: ['bcm'], personName: 'Q' },
      { id: '3', roleName: 'C', relevanz: ['nis2'], bestellungsdokument: 'http://x' },
    ];
    const p = roleProgress(roles);
    expect(p).toEqual({ total: 3, benannt: 2, mitVertretung: 1, mitNachweis: 2 });
  });

  it('topicCompletion behandelt Erfüllt und N/A als abgeschlossen', () => {
    const topics: GovernanceTopic[] = [
      { id: '1', domain: 'nis2', title: 'a', status: 'Erfüllt' },
      { id: '2', domain: 'nis2', title: 'b', status: 'N/A' },
      { id: '3', domain: 'nis2', title: 'c', status: 'Offen' },
      { id: '4', domain: 'nis2', title: 'd', status: 'In Arbeit' },
    ];
    expect(topicCompletion(topics)).toBeCloseTo(0.5);
    expect(topicCompletion([])).toBe(0);
  });

  it('evidenceProgress klassifiziert Status', () => {
    const items: EvidenceItem[] = [
      { id: '1', title: 'a', status: 'Offen' },
      { id: '2', title: 'b', status: 'Angefragt' },
      { id: '3', title: 'c', status: 'Erhalten' },
      { id: '4', title: 'd', status: 'Geprüft' },
      { id: '5', title: 'e', status: 'Nicht anwendbar' },
    ];
    expect(evidenceProgress(items)).toEqual({ total: 5, offen: 1, inArbeit: 2, geprueft: 1, na: 1 });
  });

  it('n:m Referenzen über beide Richtungen auflösbar (keine Duplikat-Inseln)', () => {
    const topic: GovernanceTopic = { id: 't1', domain: 'nis2', title: 'Lieferkette', relatedEvidenceIds: ['ev1'] };
    const ev1: EvidenceItem = { id: 'ev1', title: 'AVV', status: 'Erhalten' };
    const ev2: EvidenceItem = { id: 'ev2', title: 'Audit', status: 'Geprüft', relatedTopicIds: ['t1'] };
    const items = [ev1, ev2];
    const forTopic = evidenceForTopic(items, topic);
    expect(forTopic.map(e => e.id).sort()).toEqual(['ev1', 'ev2']); // beide Richtungen
    expect(topicsForEvidence([topic], ev2).map(t => t.id)).toEqual(['t1']);
  });

  it('roleName löst Rollen-ID auf', () => {
    const roles: RoleAssignment[] = [{ id: 'r1', roleName: 'ISB', relevanz: ['isms'] }];
    expect(roleName(roles, 'r1')).toBe('ISB');
    expect(roleName(roles, undefined)).toBeUndefined();
  });

  it('openActions liefert offene Maßnahmen über alle Themen', () => {
    const topics: GovernanceTopic[] = [
      { id: '1', domain: 'bcm', title: 'a', actionItems: [
        { id: 'a1', title: 'x', status: 'Offen' },
        { id: 'a2', title: 'y', status: 'Erledigt' },
      ] },
      { id: '2', domain: 'bcm', title: 'b', actionItems: [{ id: 'a3', title: 'z', status: 'In Arbeit' }] },
    ];
    expect(openActions(topics).map(a => a.id).sort()).toEqual(['a1', 'a3']);
  });

  it('makeId erzeugt eindeutige, präfixierte IDs', () => {
    const a = makeId('role'); const b = makeId('role');
    expect(a).not.toBe(b);
    expect(a.startsWith('role-')).toBe(true);
  });
});
