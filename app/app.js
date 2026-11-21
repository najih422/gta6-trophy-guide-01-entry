// app.js — the ledger itself: loads the trophy data, renders the checklist and
// the detail panel, and wires the toolbar (search, kind filters, spoiler toggle,
// export, import, reset) and the two views (checklist, roadmap).

import {
  buildExportPayload,
  clearSavedState,
  downloadText,
  loadEarned,
  loadPrefs,
  parseImportPayload,
  saveEarned,
  savePrefs,
} from './store.js';
import { countEarnedByGrade, filterTrophies, isHiddenBySpoilers } from './filters.js';
import { renderRoadmap } from './roadmap.js';

const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const listMetaEl = document.getElementById('list-meta');
const searchEl = document.getElementById('search');
const spoilerEl = document.getElementById('spoiler-toggle');
const progressEarnedEl = document.getElementById('progress-earned');
const progressFillEl = document.getElementById('progress-fill');
const progressGradesEl = document.getElementById('progress-grades');
const roadmapListEl = document.getElementById('roadmap-stages');
const checklistViewEl = document.getElementById('checklist-view');
const roadmapViewEl = document.getElementById('roadmap-view');

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const sourceByKey = new Map((data.sources ?? []).map((s) => [s.key, s]));

let earned = loadEarned();
let prefs = loadPrefs();
let selectedId = null;

function persist() {
  saveEarned(earned);
  savePrefs(prefs);
}

// --- progress card ---------------------------------------------------------

function renderProgress() {
  const counts = countEarnedByGrade(trophies, earned);
  progressEarnedEl.textContent = String(earned.size);
  progressFillEl.style.width = `${Math.round((earned.size / trophies.length) * 100)}%`;
  progressGradesEl.textContent =
    `${counts.platinum} platinum · ${counts.gold} gold · ${counts.silver} silver · ${counts.bronze} bronze`;
}

// --- checklist -------------------------------------------------------------

function gradePill(grade) {
  const pill = document.createElement('span');
  pill.className = `pill ${grade}`;
  pill.textContent = grade;
  return pill;
}

function renderRows() {
  const { shown, hidden } = filterTrophies(trophies, {
    kind: prefs.kind,
    query: prefs.query,
    spoilersOn: prefs.spoilers,
    earned,
  });
  rowsEl.replaceChildren();

  for (const trophy of shown) {
    rowsEl.append(buildRow(trophy, false));
  }
  for (const trophy of hidden) {
    rowsEl.append(buildRow(trophy, true));
  }

  const total = shown.length + hidden.length;
  listMetaEl.textContent = hidden.length > 0
    ? `Showing ${total} of 55 trophies — ${hidden.length} story ${hidden.length === 1 ? 'trophy' : 'trophies'} hidden by spoilers`
    : `Showing ${total} of 55 trophies`;
}

function buildRow(trophy, masked) {
  const li = document.createElement('li');
  li.className = 'row' + (earned.has(trophy.id) ? ' is-earned' : '') + (selectedId === trophy.id ? ' is-selected' : '');
  li.dataset.id = String(trophy.id);

  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.setAttribute('aria-label', masked ? 'Mark hidden story trophy earned' : `Mark ${trophy.name} earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    persist();
    renderAll();
  });
  li.append(box);

  const main = document.createElement('div');
  if (masked) {
    const name = document.createElement('p');
    name.className = 'row-name row-hidden';
    name.textContent = 'Hidden story trophy — earn it to reveal';
    main.append(name);
    const desc = document.createElement('p');
    desc.className = 'row-desc row-hidden';
    desc.textContent = 'Its name, description and guide stay hidden while spoilers are on.';
    main.append(desc);
  } else {
    const name = document.createElement('p');
    name.className = 'row-name';
    name.textContent = trophy.name;
    main.append(name);
    const desc = document.createElement('p');
    desc.className = 'row-desc';
    desc.textContent = trophy.description;
    main.append(desc);
    const meta = document.createElement('p');
    meta.className = 'row-meta';
    meta.append(gradePill(trophy.grade));
    if (trophy.missable) {
      const pill = document.createElement('span');
      pill.className = 'pill missable';
      pill.textContent = 'Missable';
      meta.append(pill);
    }
    if (trophy.targetLabel) {
      const pill = document.createElement('span');
      pill.className = 'pill target';
      pill.textContent = `Target: ${trophy.targetLabel}`;
      meta.append(pill);
    }
    main.append(meta);
  }
  main.addEventListener('click', () => {
    selectedId = trophy.id;
    renderAll();
  });
  li.append(main);

  const kind = document.createElement('span');
  kind.className = 'row-kind';
  kind.textContent = masked ? 'story' : trophy.kind + (trophy.missable ? ' · missable' : '');
  li.append(kind);
  return li;
}

// --- detail panel ----------------------------------------------------------

function renderDetail() {
  detailEl.replaceChildren();
  const trophy = trophies.find((t) => t.id === selectedId);
  if (!trophy) {
    const empty = document.createElement('p');
    empty.className = 'detail-empty';
    empty.textContent = 'Pick a trophy to read its guide and sources.';
    detailEl.append(empty);
    return;
  }

  const masked = isHiddenBySpoilers(trophy, prefs.spoilers, earned);
  const heading = document.createElement('h2');
  heading.textContent = masked ? 'Hidden story trophy' : trophy.name;
  detailEl.append(heading);

  if (earned.has(trophy.id)) {
    const line = document.createElement('p');
    line.className = 'earned-line';
    line.textContent = '✓ Earned — ticked off in your ledger.';
    detailEl.append(line);
  }

  if (masked) {
    const note = document.createElement('p');
    note.className = 'detail-desc';
    note.textContent = 'Its name, description and guide stay hidden while spoilers are on. Earn it in the game — or turn spoilers off — to read the guide.';
    detailEl.append(note);
    return;
  }

  const meta = document.createElement('p');
  meta.className = 'row-meta';
  meta.append(gradePill(trophy.grade));
  if (trophy.missable) {
    const pill = document.createElement('span');
    pill.className = 'pill missable';
    pill.textContent = 'Missable — one chance only if there is no mission replay';
    meta.append(pill);
  }
  if (trophy.targetLabel) {
    const pill = document.createElement('span');
    pill.className = 'pill target';
    pill.textContent = `Target: ${trophy.targetLabel}`;
    meta.append(pill);
  }
  detailEl.append(meta);

  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = trophy.description;
  detailEl.append(desc);

  const guide = document.createElement('p');
  guide.className = 'detail-guide';
  const guideLabel = document.createElement('strong');
  guideLabel.textContent = 'Guide: ';
  guide.append(guideLabel);
  guide.append(document.createTextNode(trophy.guide.replace(/^Sources:.*$/, '').replace(/ Sources: Exophase trophy list; PSNProfiles trophies page\.$/, '')));
  detailEl.append(guide);

  const sources = document.createElement('div');
  sources.className = 'detail-sources';
  const sourcesHeading = document.createElement('h3');
  sourcesHeading.textContent = 'Sources';
  sources.append(sourcesHeading);
  const list = document.createElement('ul');
  for (const key of trophy.sources ?? []) {
    const source = sourceByKey.get(key);
    if (!source) continue;
    const item = document.createElement('li');
    if (source.url) {
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.name;
      link.target = '_blank';
      link.rel = 'noopener';
      item.append(link);
    } else {
      item.textContent = source.name;
    }
    list.append(item);
  }
  sources.append(list);
  detailEl.append(sources);
}

// --- views -----------------------------------------------------------------

function renderViews() {
  const roadmap = prefs.view === 'roadmap';
  checklistViewEl.hidden = roadmap;
  roadmapViewEl.hidden = !roadmap;
  document.getElementById('view-checklist').classList.toggle('is-active', !roadmap);
  document.getElementById('view-roadmap').classList.toggle('is-active', roadmap);
  if (roadmap) renderRoadmap(roadmapListEl, trophies, earned, prefs.spoilers);
}

function renderAll() {
  renderProgress();
  renderRows();
  renderDetail();
  renderViews();
}

// --- toolbar wiring --------------------------------------------------------

searchEl.value = prefs.query;
spoilerEl.checked = prefs.spoilers;
document.querySelectorAll('.kind-btn').forEach((button) => {
  button.classList.toggle('is-active', button.dataset.kind === prefs.kind);
});

searchEl.addEventListener('input', () => {
  prefs.query = searchEl.value;
  persist();
  renderRows();
});

spoilerEl.addEventListener('change', () => {
  prefs.spoilers = spoilerEl.checked;
  persist();
  renderAll();
});

document.querySelectorAll('.kind-btn').forEach((button) => {
  button.addEventListener('click', () => {
    prefs.kind = button.dataset.kind;
    document.querySelectorAll('.kind-btn').forEach((b) => b.classList.toggle('is-active', b === button));
    persist();
    renderRows();
  });
});

document.getElementById('view-checklist').addEventListener('click', () => {
  prefs.view = 'checklist';
  persist();
  renderViews();
});
document.getElementById('view-roadmap').addEventListener('click', () => {
  prefs.view = 'roadmap';
  persist();
  renderViews();
});

document.getElementById('export-btn').addEventListener('click', () => {
  downloadText('leonida-ledger-progress.json', buildExportPayload(earned));
});

document.getElementById('import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const imported = parseImportPayload(await file.text());
  if (imported === null) {
    alert('That file is not a Leonida Ledger progress export.');
    return;
  }
  earned = imported;
  persist();
  renderAll();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Reset the ledger? This clears every earned tick and your settings.')) return;
  earned = new Set();
  prefs = { spoilers: true, kind: 'all', view: 'checklist', query: '' };
  selectedId = null;
  clearSavedState();
  searchEl.value = '';
  spoilerEl.checked = true;
  document.querySelectorAll('.kind-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.kind === 'all'));
  renderAll();
});

renderAll();
