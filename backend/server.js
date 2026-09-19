const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API endpoints
app.use('/api', apiRoutes);

// Serve frontend static assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('==============================================');
    console.log('Emergency Evacuation Planning System (PIE & UX-First)');
    console.log('Experimental Learning Model — JAIN (Deemed-to-be Univ)');
    console.log('Author: Ameya (B.Tech CSE — AI-Driven DevOps)');
    console.log(`Server active on: http://localhost:${PORT}`);
    console.log('==============================================');
  });
}

module.exports = app;
