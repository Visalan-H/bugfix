const request = require('supertest');
const app = require('../src/app');

describe('hidden', () => {
  test('whitespace-only title is rejected and nothing is created', async () => {
    const res = await request(app).post('/todos').send({ title: '    ' });
    expect(res.status).toBe(400);
    const list = await request(app).get('/todos');
    expect(list.body).toHaveLength(0);
  });

  test('title is trimmed', async () => {
    const res = await request(app).post('/todos').send({ title: '  Milk  ' });
    expect(res.body.title).toBe('Milk');
  });

  test('a created todo is in the list right away', async () => {
    await request(app).post('/todos').send({ title: 'X' });
    const list = await request(app).get('/todos');
    expect(list.body).toHaveLength(1);
  });

  test('GET /todos?done=false returns only open todos', async () => {
    const a = await request(app).post('/todos').send({ title: 'A' });
    await request(app).post('/todos').send({ title: 'B' });
    await request(app).patch(`/todos/${a.body._id}/toggle`);
    const res = await request(app).get('/todos?done=false');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('B');
  });

  test('toggle on unknown id returns 404', async () => {
    const res = await request(app).patch('/todos/nope/toggle');
    expect(res.status).toBe(404);
  });
});
