// const express = require('express');
// const fetch = require('node-fetch');
// const cors = require('cors');
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 8081;

// Enable CORS
app.use(cors({origin: "*"}));

// Middleware to parse JSON bodies
app.use(express.json());

console.log("process.env.QUARKSHUB_SERVER_URL", process.env.QUARKSHUB_SERVER_URL)
const quarkshubServerUrl = process.env.QUARKSHUB_SERVER_URL || "https://api.quarkshub.com";

// Proxy route to forward requests to the API
app.use('/proxy', async (req, res) => {
  try {
    const apiUrl = `${quarkshubServerUrl}${req.originalUrl.replace('/proxy', '')}`;
    
    console.log(`Proxying request to: ${apiUrl}`);
    const apiResponse = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        // Forward any custom headers (optional)
        // ...req.headers,
      },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method.toUpperCase()) ? JSON.stringify(req.body) : undefined,
    });

    // Handle API response
    const data = await apiResponse.json();
    // console.log('API Response:', JSON.stringify(data));
    res.status(apiResponse.status).json(data);
  } catch (error) {
    console.error('Error in Proxy Server:', error.message);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running at http://localhost:${PORT}`);
});
