const request = require('supertest');
const app = require('../src/app');

const ids = (res) => res.body.comments.map((c) => c.id);

describe('Comments', () => {
  test('newest first', async () => {
    const res = await request(app).get('/posts/p1/comments');
    expect(ids(res)).toEqual(['c4', 'c3', 'c1', 'c2']);
    expect(res.body.total).toBe(4);
  });
  test('authorId filter + total', async () => {
    const res = await request(app).get('/posts/p1/comments?authorId=a');
    expect(ids(res)).toEqual(['c3', 'c1']);
    expect(res.body.total).toBe(2);
  });
});
