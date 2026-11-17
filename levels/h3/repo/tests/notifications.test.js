const request = require('supertest');
const app = require('../src/app');
const svc = require('../src/services/notificationService');

const get = (u) => request(app).get(u).set('x-user-id', 'u1');
const seed = async (n, user = 'u1') => { for (let i = 1; i <= n; i++) await svc.notify(user, `n${i}`); };

describe('Notifications', () => {
  test('cursor pages do not overlap', async () => {
    await seed(5);
    const p1 = await get('/notifications?limit=2');
    const p2 = await get(`/notifications?limit=2&cursor=${p1.body.nextCursor}`);
    const texts = [...p1.body.items, ...p2.body.items].map((n) => n.text);
    expect(texts).toEqual(['n5', 'n4', 'n3', 'n2']);
  });

  test('nextCursor is null on the last page', async () => {
    await seed(3);
    const p1 = await get('/notifications?limit=2');
    const p2 = await get(`/notifications?limit=2&cursor=${p1.body.nextCursor}`);
    expect(p2.body.items.map((n) => n.text)).toEqual(['n1']);
    expect(p2.body.nextCursor).toBeNull();
  });

  test('deleted notifications do not count as unread', async () => {
    await seed(3);
    const list = await get('/notifications');
    await request(app).delete(`/notifications/${list.body.items[0]._id}`).set('x-user-id', 'u1');
    const res = await get('/notifications/unread-count');
    expect(res.body.count).toBe(2);
  });

  test('read-all clears the badge immediately', async () => {
    await seed(4);
    const r = await request(app).post('/notifications/read-all').set('x-user-id', 'u1');
    expect(r.body.updated).toBe(4);
    const res = await get('/notifications/unread-count');
    expect(res.body.count).toBe(0);
  });
});
