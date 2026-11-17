// Small checks on the sandbox itself: console line numbers, error locations,
// test isolation and the double-response error. Runs in Node.
//
//   npm run test:sandbox
import { runTests, type Files } from '../src/runner/sandbox/index.ts';

const files: Files = {
  'src/app.js': [
    "const express = require('express');", // 1
    "const db = require('memdb');", // 2
    'const app = express();', // 3
    "app.get('/x', async (req, res) => {", // 4
    "  console.log('hit', req.query.n);", // 5
    "  const e = new Error('boom');", // 6
    '  console.error(e);', // 7
    '  console.log(db.collection("t").find());', // 8
    '  res.json({ ok: true });', // 9
    '  res.json({ again: true });', // 10
    '});', // 11
    "app.post('/t', async (req, res) => res.status(201).json(await db.collection('t').insert(req.body)));", // 12
    "app.get('/t', async (req, res) => res.json(await db.collection('t').find()));", // 13
    'module.exports = app;', // 14
  ].join('\n'),
  'tests/a.test.js': [
    "const request = require('supertest');",
    "const app = require('../src/app');",
    "test('logs', async () => { await request(app).get('/x?n=1'); });",
    "test('insert', async () => { await request(app).post('/t').send({ a: 1 }); });",
    "test('fresh db', async () => { const r = await request(app).get('/t'); expect(r.body).toEqual([]); });",
  ].join('\n'),
};

let bad = 0;
const check = (name: string, ok: boolean, got?: unknown) => {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  (got ${JSON.stringify(got)})`}`);
  if (!ok) bad++;
};

const [logs, insert, fresh] = await runTests(files, 'tests/a.test.js');
const L = logs.logs;
check('console.log reports the right file:line', L[0]?.where === 'src/app.js:5', L[0]?.where);
check('console.log text', L[0]?.text === 'hit 1', L[0]?.text);
check('Error prints as Name: message', L[1]?.text === 'Error: boom', L[1]?.text);
check('thrownAt points at new Error(...)', L[1]?.thrownAt === 'src/app.js:6', L[1]?.thrownAt);
check('a logged Promise asks about await', /forget await/.test(L[2]?.text ?? ''), L[2]?.text);
check('sending twice fails the test', !logs.pass && /ERR_HTTP_HEADERS_SENT/.test(logs.error ?? ''), logs.error);
check('insert test passes', insert.pass, insert.error);
check('each test gets a fresh database', fresh.pass, fresh.error);

const broken = await runTests({ 'tests/b.test.js': 'test("x", () => {\n  expect(1).toBe(\n' }, 'tests/b.test.js');
check('a syntax error is reported, not thrown', broken.length === 1 && !broken[0].pass, broken);

console.log(bad ? `\n${bad} sandbox check(s) failed` : '\nsandbox OK');
process.exit(bad ? 1 : 0);
