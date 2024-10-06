const express = require('express');
const sql = require('mssql');
const app = express();
const port = 3000;

// SQL Server configuration
const config = {
  user: 'sa',
  password: '12345',
  server: 'DESKTOP-DUFVAUL', // Use the machine name
  database: 'PawTime',
  options: {
    instanceName: 'SQLEXPRESS', // Named instance
    encrypt: false, // Set to false if not using Azure
    enableArithAbort: true
  }
};

// Connect to SQL Server
sql.connect(config, err => {
  if (err) console.log(err);
  else console.log('Connected to SQL Server');
});

// Middleware to parse JSON
app.use(express.json());

// Serve static files
app.use(express.static(__dirname));

// API endpoint to get products
app.get('/api/pets', async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM Pets`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});