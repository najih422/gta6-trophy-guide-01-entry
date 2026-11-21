// filters.js — pure helpers for narrowing the trophy list: by kind, by search text,
// and the spoiler rule that hides un-earned story trophies. No DOM here, so the
// same rules can be tested without a browser.

// The kinds the toolbar offers, in display order.
export const KINDS = ['all', 'story', 'missable', 'collectible', 'activity', 'online'];

// A trophy counts as "online" only when its kind says so. This list has none.
export function isOnline(trophy) {
  return trophy.kind === 'online';
}

// Does this trophy pass the chosen kind filter? "missable" is a flag, not a kind:
// it matches any trophy whose missable flag is set.
export function passesKindFilter(trophy, kind) {
  if (!kind || kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind;
}

// Does this trophy match the search text? The query is matched against the
// official name, description and target label, case-insensitively. Hidden
// (spoiler-masked) story trophies never match a search — their words stay hidden.
export function passesSearch(trophy, query, hidden) {
  if (hidden) return false;
  const q = (query ?? '').trim().toLowerCase();
  if (!q) return true;
  const haystack = `${trophy.name} ${trophy.description} ${trophy.targetLabel ?? ''}`.toLowerCase();
  return haystack.includes(q);
}

// The spoiler rule: a story trophy is hidden while spoilers are on and it is
// not yet earned. Everything else is always visible.
export function isHiddenBySpoilers(trophy, spoilersOn, earned) {
  return spoilersOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

// Apply kind + search + spoiler rules to the whole list, in one pass.
export function filterTrophies(trophies, { kind, query, spoilersOn, earned }) {
  const shown = [];
  const hidden = [];
  for (const trophy of trophies) {
    if (!passesKindFilter(trophy, kind)) continue;
    const masked = isHiddenBySpoilers(trophy, spoilersOn, earned);
    if (masked) {
      hidden.push(trophy);
      continue;
    }
    if (!passesSearch(trophy, query, false)) continue;
    shown.push(trophy);
  }
  return { shown, hidden };
}

// Count earned trophies per grade, for the progress card.
export function countEarnedByGrade(trophies, earned) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const trophy of trophies) {
    if (earned.has(trophy.id) && trophy.grade in counts) counts[trophy.grade] += 1;
  }
  return counts;
}
