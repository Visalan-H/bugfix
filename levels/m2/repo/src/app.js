const express = require('express');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const ticketRoutes = require('./routes/tickets');

const app = express();
app.use(express.json());
app.use(auth);
app.use('/tickets', ticketRoutes);
app.use(errorHandler);

module.exports = app;
