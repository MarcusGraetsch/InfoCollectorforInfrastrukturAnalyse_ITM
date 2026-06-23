import type { AppState, CategoryKey } from '../types';

// [sourceCategory, sourceField, targetCategory, targetField]
type BidirPair = [CategoryKey, string, CategoryKey, string];

const BIDIR_PAIRS: BidirPair[] = [
  ['anwendungen', 'itSysteme', 'server', 'anwendungen'],
  ['betriebssysteme', 'itSysteme', 'server', 'betriebssysteme'],
  ['anwendungen', 'netzverbindungen', 'netzverbindungen', 'anwendungen'],
  ['server', 'netzverbindungen', 'netzverbindungen', 'server'],
  ['clients', 'netzverbindungen', 'netzverbindungen', 'clients'],
  ['netzkomponenten', 'netzverbindungen', 'netzverbindungen', 'netzkomponenten'],
];

function addIfMissing(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr : [...arr, id];
}

/**
 * After saving an item in `changedCategory`, propagate its link fields
 * back to the referenced items so links stay bidirectionally consistent.
 */
export function syncBidirectionalLinks(
  state: AppState,
  changedCategory: CategoryKey,
  changedItem: Record<string, unknown>
): AppState {
  const changedId = changedItem['id'] as string;
  let next = { ...state };

  for (const [catA, fieldA, catB, fieldB] of BIDIR_PAIRS) {
    let sourceField: string | null = null;
    let targetCategory: CategoryKey | null = null;
    let targetField: string | null = null;

    if (changedCategory === catA) {
      sourceField = fieldA;
      targetCategory = catB;
      targetField = fieldB;
    } else if (changedCategory === catB) {
      sourceField = fieldB;
      targetCategory = catA;
      targetField = fieldA;
    }

    if (!sourceField || !targetCategory || !targetField) continue;

    const referencedIds = new Set((changedItem[sourceField] as string[] | undefined) ?? []);
    const targetArr = next[targetCategory] as unknown as Record<string, unknown>[];

    const updatedTarget = targetArr.map(targetItem => {
      const tid = targetItem['id'] as string;
      const backlinks = (targetItem[targetField!] as string[] | undefined) ?? [];
      if (referencedIds.has(tid)) {
        return { ...targetItem, [targetField!]: addIfMissing(backlinks, changedId) };
      } else if (backlinks.includes(changedId)) {
        return { ...targetItem, [targetField!]: backlinks.filter(x => x !== changedId) };
      }
      return targetItem;
    });

    next = { ...next, [targetCategory]: updatedTarget };
  }

  return next;
}

/** Returns items in targetCategory that are not yet linked from the given source item */
export function findUnlinkedSuggestions(
  state: AppState,
  sourceCategory: CategoryKey,
  sourceItem: Record<string, unknown>
): { targetCategory: CategoryKey; targetField: string; suggestions: { id: string; kuerzel: string; name: string; score: number }[] }[] {
  const results = [];

  for (const [catA, fieldA, catB, fieldB] of BIDIR_PAIRS) {
    let sourceField: string | null = null;
    let targetCategory: CategoryKey | null = null;

    if (sourceCategory === catA) {
      sourceField = fieldA;
      targetCategory = catB;
    } else if (sourceCategory === catB) {
      sourceField = fieldB;
      targetCategory = catA;
    }

    if (!sourceField || !targetCategory) continue;

    const currentLinks = new Set((sourceItem[sourceField] as string[] | undefined) ?? []);
    const targetArr = state[targetCategory] as unknown as { id: string; kuerzel: string; name: string }[];
    const sourceName = String(sourceItem['name'] ?? '').toLowerCase();
    const sourceWords = new Set(sourceName.split(/\W+/).filter(Boolean));

    const suggestions = targetArr
      .filter(t => !currentLinks.has(t.id))
      .map(t => {
        const targetWords = new Set(t.name.toLowerCase().split(/\W+/).filter(Boolean));
        const shared = [...sourceWords].filter(w => targetWords.has(w)).length;
        const score = shared / Math.max(sourceWords.size, targetWords.size, 1);
        return { id: t.id, kuerzel: t.kuerzel, name: t.name, score };
      })
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    if (suggestions.length > 0) {
      results.push({ targetCategory, targetField: sourceField, suggestions });
    }
  }

  return results;
}
