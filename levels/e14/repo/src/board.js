const best = new Map(); // player -> score

function submit(player, score) {
  const existing = best.has(player) ? { score: best.get(player) } : undefined;
  best.set(player, Math.max(score, existing?.score));
}

function top(n) {
  return [...best.entries()]
    .map(([player, score]) => ({ player, score }))
    .slice(0, n)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i, ...p }));
}

module.exports = { submit, top };
