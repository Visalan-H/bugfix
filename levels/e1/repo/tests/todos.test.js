const request = require('supertest');
const app = require('../src/app');

describe('Todos API', () => {
  test('POST /todos creates a todo and returns it', async () => {
    const res = await request(app).post('/todos').send({ title: 'Buy milk' });
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.title).toBe('Buy milk');
    expect(res.body.done).toBe(false);
  });

  test('POST /todos without a title returns 400 and creates nothing', async () => {
    const res = await request(app).post('/todos').send({});
    expect(res.status).toBe(400);
    const list = await request(app).get('/todos');
    expect(list.body).toHaveLength(0);
  });

  test('GET /todos?done=true returns only completed todos', async () => {
    const a = await request(app).post('/todos').send({ title: 'A' });
    await request(app).post('/todos').send({ title: 'B' });
    await request(app).patch(`/todos/${a.body._id}/toggle`);

    const res = await request(app).get('/todos?done=true');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('A');
  });
});
