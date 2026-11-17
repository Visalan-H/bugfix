const request = require('supertest');
const app = require('../src/app');

const rsvp = (ev, u) => request(app).post(`/events/${ev}/rsvp`).set('x-user-id', u);
const cancel = (ev, u) => request(app).delete(`/events/${ev}/rsvp`).set('x-user-id', u);

describe('hidden', () => {
  test('capacity 1 event', async () => {
    expect((await rsvp('ev-workshop', 'a')).status).toBe(201);
    expect((await rsvp('ev-workshop', 'b')).status).toBe(409);
  });
  test('cancel frees a spot', async () => {
    await rsvp('ev-workshop', 'a');
    expect((await cancel('ev-workshop', 'a')).status).toBe(204);
    expect((await rsvp('ev-workshop', 'b')).status).toBe(201);
  });
  test('unknown event → 404', async () => {
    expect((await rsvp('ev-nope', 'a')).status).toBe(404);
  });
  test('cancel removes the right person', async () => {
    for (const u of ['a', 'b', 'c']) await rsvp('ev-meetup', u);
    await cancel('ev-meetup', 'a');
    expect((await request(app).get('/events/ev-meetup')).body.attendees).toEqual(['b', 'c']);
  });
});
