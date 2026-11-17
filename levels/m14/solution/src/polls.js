const db = require('memdb');
const clock = require('./clock');

const polls = db.collection('polls');
const votes = db.collection('votes');

const ready = Promise.all([
  polls.insert({ _id: 'lunch', options: ['yes', 'no'], closesAt: '2026-12-01T00:00:00Z' }),
  polls.insert({ _id: 'old', options: ['a', 'b'], closesAt: '2026-01-01T00:00:00Z' }),
]);

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }

async function load(pollId) {
  await ready;
  const p = await polls.findById(pollId);
  if (!p) throw new HttpError(404, 'poll not found');
  return p;
}

async function vote(pollId, userId, option) {
  const poll = await load(pollId);
  if (clock.now() >= Date.parse(poll.closesAt)) throw new HttpError(409, 'poll closed');
  if (!poll.options.includes(option)) throw new HttpError(400, 'unknown option');
  if (await votes.findOne({ pollId, userId })) throw new HttpError(409, 'already voted');
  return votes.insert({ pollId, userId, option });
}

async function results(pollId) {
  const poll = await load(pollId);
  const all = await votes.find({ pollId });
  const total = all.length;
  return {
    total,
    results: poll.options.map((option) => {
      const count = all.filter((v) => v.option === option).length;
      return { option, votes: count, percent: total ? Math.round((count * 100) / total) : 0 };
    }),
  };
}

module.exports = { vote, results };
