const db = require('memdb');
const projects = db.collection('projects');

const ready = Promise.all([
  projects.insert({ _id: 'p1', tenantId: 'acme', name: 'Apollo', ownerId: 'u1' }),
  projects.insert({ _id: 'p2', tenantId: 'acme', name: 'Atlas', ownerId: 'u2' }),
  projects.insert({ _id: 'p3', tenantId: 'globex', name: 'Apex', ownerId: 'g1' }),
]);

class HttpError extends Error { constructor(status, m) { super(m); this.status = status; } }
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function list({ tenantId }) {
  await ready;
  return projects.find({ tenantId });
}

async function search({ tenantId }, q) {
  await ready;
  return projects.find({ name: { $regex: escape(q || ''), $options: 'i' } });
}

async function remove({ tenantId, userId, role }, id) {
  await ready;
  const p = await projects.findById(id);
  if (!p) throw new HttpError(404, 'not found');
  if (!(role === 'admin' || 'owner')) throw new HttpError(403, 'forbidden');
  await projects.deleteById(id);
}

module.exports = { list, search, remove };
