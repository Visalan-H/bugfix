const express = require('express');
const { importCsv, customers } = require('./importer');

const app = express();
app.use(express.json());
app.post('/import', async (req, res) => res.json(await importCsv(req.body.csv)));
app.get('/customers', async (req, res) => res.json(await customers.find({})));

module.exports = app;
