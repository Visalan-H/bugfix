const db = require('memdb');
const clock = require('./clock');

const jobs = db.collection('jobs');
const LEASE_MS = 30 * 1000;
let seq = 0;

async function enqueue(type) {
  return jobs.insert({ type, seq: ++seq, status: 'queued', worker: null, leaseUntil: null });
}

async function claim(worker) {
  const now = clock.now();
  const candidates = (await jobs.find({}))
    .filter((j) => j.status === 'queued' || (j.status === 'running' && j.leaseUntil > now))
    .sort((a, b) => b.seq - a.seq);
  const job = candidates[0];
  if (!job) return null;
  return jobs.updateById(job._id, { status: 'running', worker, leaseUntil: now + LEASE_MS });
}

async function complete(worker, id) {
  const job = await jobs.findById(id);
  if (!job || job.status !== 'running') return null;
  return jobs.updateById(id, { status: 'done' });
}

module.exports = { enqueue, claim, complete };
