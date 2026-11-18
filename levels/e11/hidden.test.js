const request = require('supertest');
const app = require('../src/app');

describe('hidden', () => {
  test('other post', async () => {
    const res = await request(app).get('/posts/p2/comments');
    expect(res.body.comments.map((c) => c.id)).toEqual(['c5']);
  });
  test('unknown author → empty, total 0', async () => {
    const res = await request(app).get('/posts/p1/comments?authorId=zz');
    expect(res.body).toEqual({ total: 0, comments: [] });
  });
  test('stored format unchanged', async () => {
    const res = await request(app).get('/posts/p1/comments?authorId=b');
    expect(res.body.comments[0].createdAt).toBe('03/02/2026 18:00');
  });
});
