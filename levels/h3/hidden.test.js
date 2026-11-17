const request = require('supertest');
const app = require('../src/app');
const svc = require('../src/services/notificationService');

const as = (u) => ({
  get: (url) => request(app).get(url).set('x-user-id', u),
  del: (id) => request(app).delete(`/notifications/${id}`).set('x-user-id', u),
});
const seed = async (n, user) => { for (let i = 1; i <= n; i++) await svc.notify(user, `${user}-${i}`); };

describe('hidden', () => {
  test('cannot delete another user\'s notification', async () => {
    await seed(1, 'alice');
    const a = await as('alice').get('/notifications');
    const res = await as('mallory').del(a.body.items[0]._id);
    expect(res.status).toBe(404);
    const still = await as('alice').get('/notifications');
    expect(still.body.items).toHaveLength(1);
  });

  test('deleting twice → 404', async () => {
    await seed(1, 'u');
    const a = await as('u').get('/notifications');
    expect((await as('u').del(a.body.items[0]._id)).status).toBe(204);
    expect((await as('u').del(a.body.items[0]._id)).status).toBe(404);
  });

  test('exactly limit items → nextCursor null', async () => {
    await seed(2, 'u');
    const p = await as('u').get('/notifications?limit=2');
    expect(p.body.items).toHaveLength(2);
    expect(p.body.nextCursor).toBeNull();
  });

  test('walking all pages returns every item exactly once', async () => {
    await seed(7, 'u');
    const seen = [];
    let cursor = null, guard = 0;
    do {
      const p = await as('u').get(`/notifications?limit=3${cursor !== null ? `&cursor=${cursor}` : ''}`);
      seen.push(...p.body.items.map((n) => n.text));
      cursor = p.body.nextCursor;
    } while (cursor !== null && ++guard < 10);
    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
  });

  test('other users\' notifications are not listed or counted', async () => {
    await seed(2, 'alice');
    await seed(3, 'bob');
    expect((await as('alice').get('/notifications')).body.items).toHaveLength(2);
    expect((await as('alice').get('/notifications/unread-count')).body.count).toBe(2);
  });
});
