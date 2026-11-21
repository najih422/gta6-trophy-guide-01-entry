// roadmap.js — the five-stage road to the platinum, built from each trophy's
// roadmap stage. One clear job: describe the stages and render them.

// The five stages, in the order a player should take them.
export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    blurb: 'Chapters 1 to 4, the named missions and the final mission. Twelve trophies, all from playing the story in order.',
  },
  {
    stage: 2,
    title: 'Stage 2 — Strangers across Leonida',
    blurb: 'The stranger strands: finish whole strands, not just the first mission of each. Seven trophies, including the five strand finales.',
  },
  {
    stage: 3,
    title: 'Stage 3 — Activities',
    blurb: 'The repeatable fun: stunts, races, the shooting range, drone races, fishing, arcade, bowling and challenges. Nine trophies.',
  },
  {
    stage: 4,
    title: 'Stage 4 — Collectibles',
    blurb: 'The long hunts: meditation spots, card sets, WAiNK locations, vehicles, the 52 areas and all 8 garages. Seven trophies.',
  },
  {
    stage: 5,
    title: 'Stage 5 — Cleanup',
    blurb: 'Everything left: 100% completion, the robberies, the money totals and the odd one-off feats. Twenty trophies, then the platinum.',
  },
];

// Group trophies by their roadmap stage, in id order within each stage.
export function groupByStage(trophies) {
  const groups = new Map(ROADMAP_STAGES.map((s) => [s.stage, []]));
  for (const trophy of trophies) {
    if (groups.has(trophy.roadmap)) groups.get(trophy.roadmap).push(trophy);
  }
  return ROADMAP_STAGES.map((stage) => ({
    ...stage,
    trophies: groups.get(stage.stage) ?? [],
  }));
}

// Render the stages into a container element. Each trophy is a list item that
// shows its earned state; story trophies stay masked while spoilers are on and
// the trophy is un-earned.
export function renderRoadmap(container, trophies, earned, spoilersOn) {
  container.replaceChildren();
  for (const group of groupByStage(trophies)) {
    const done = group.trophies.filter((t) => earned.has(t.id)).length;
    const item = document.createElement('li');
    item.className = 'stage';

    const heading = document.createElement('h3');
    heading.textContent = group.title + ' ';
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = `${done}/${group.trophies.length} earned`;
    heading.append(count);
    item.append(heading);

    const blurb = document.createElement('p');
    blurb.textContent = group.blurb;
    item.append(blurb);

    const list = document.createElement('ul');
    for (const trophy of group.trophies) {
      const li = document.createElement('li');
      const masked = spoilersOn && trophy.kind === 'story' && !earned.has(trophy.id);
      li.textContent = masked
        ? 'Hidden story trophy — earn it to reveal'
        : `${trophy.name} (${trophy.grade})${trophy.targetLabel ? ` — ${trophy.targetLabel}` : ''}`;
      if (earned.has(trophy.id)) li.classList.add('is-earned');
      list.append(li);
    }
    item.append(list);
    container.append(item);
  }
}
