const express = require('express');
const users = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/users', users);
app.use(errorHandler);

module.exports = app;
