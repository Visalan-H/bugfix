const express = require('express');
const auth = require('./middleware/auth');
const carRoutes = require('./routes/cars');

const app = express();
app.use(express.json());
app.use(auth);
app.use('/cars', carRoutes);

module.exports = app;
