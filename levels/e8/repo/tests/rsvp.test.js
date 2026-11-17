const request = require('supertest');
const app = require('../src/app');

const rsvp = (ev, u) => request(app).post(`/events/${ev}/rsvp`).set('x-user-id', u);
const cancel = (ev, u) => request(app).delete(`/events/${ev}/rsvp`).set('x-user-id', u);
const get = (ev) => request(app).get(`/events/${ev}`);

describe('RSVP', () => {
  test('4th person on a capacity-3 event → 409', async () => {
    for (const u of ['a', 'b', 'c']) expect((await rsvp('ev-meetup', u)).status).toBe(201);
    expect((await rsvp('ev-meetup', 'd')).status).toBe(409);
    expect((await get('ev-meetup')).body.spotsLeft).toBe(0);
  });

  test('same user twice → 409', async () => {
    await rsvp('ev-meetup', 'a');
    expect((await rsvp('ev-meetup', 'a')).status).toBe(409);
    expect((await get('ev-meetup')).body.attendees).toEqual(['a']);
  });

  test('cancelling without an RSVP → 404 and nobody is removed', async () => {
    await rsvp('ev-meetup', 'alice');
    const res = await cancel('ev-meetup', 'bob');
    expect(res.status).toBe(404);
    expect((await get('ev-meetup')).body.attendees).toEqual(['alice']);
  });
});
