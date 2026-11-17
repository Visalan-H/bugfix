const best = new Map(); // player -> score

function submit(player, score) {
  const prev = best.get(player);
  best.set(player, prev === undefined ? score : Math.max(score, prev));
}

function top(n) {
  const sorted = [...best.entries()]
    .map(([player, score]) => ({ player, score }))
    .sort((a, b) => b.score - a.score);
  const ranked = [];
  sorted.forEach((p, i) => {
    const rank = i > 0 && p.score === sorted[i - 1].score ? ranked[i - 1].rank : i + 1;
    ranked.push({ rank, ...p });
  });
  return ranked.slice(0, n);
}

module.exports = { submit, top };
