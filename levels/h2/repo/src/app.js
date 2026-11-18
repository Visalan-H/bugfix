const express = require('express');
const auth = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const orderController = require('./controllers/orderController');
const productController = require('./controllers/productController');

const app = express();
app.use(express.json());
app.use(auth);
app.get('/products/:id', productController.get);
app.post('/orders', orderController.create);
app.use(errorHandler);

module.exports = app;
