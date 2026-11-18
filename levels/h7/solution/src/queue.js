const db = require('memdb');
const clock = require('./clock');

const jobs = db.collection('jobs');
const LEASE_MS = 30 * 1000;
let seq = 0;

async function enqueue(type) {
  return jobs.insert({ type, seq: ++seq, status: 'queued', worker: null, leaseUntil: null });
}

// memdb matches in insertion order, so the first match is the oldest job.
async function claim(worker) {
  const now = clock.now();
  const patch = { $set: { status: 'running', worker, leaseUntil: now + LEASE_MS } };
  return (await jobs.findOneAndUpdate({ status: 'queued' }, patch))
    || jobs.findOneAndUpdate({ status: 'running', leaseUntil: { $lte: now } }, patch);
}

async function complete(worker, id) {
  return jobs.findOneAndUpdate({ _id: id, worker, status: 'running' }, { $set: { status: 'done' } });
}

module.exports = { enqueue, claim, complete };
