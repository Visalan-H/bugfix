# GAME-6: Leaderboard is nonsense

| Method | Path | Behaviour |
|---|---|---|
| `POST` | `/scores { player, score }` | Keeps each player's **best** score. score must be a number ≥ 0 → else **400** |
| `GET` | `/leaderboard?top=` | `[{ rank, player, score }]`, best first. Default top **10**. Ranks are 1-based; ties share a rank (1, 2, 2, 4) |
