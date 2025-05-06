const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/foods', require('./routes/foods'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;