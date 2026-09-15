'use strict';

const express = require('express');
const axios   = require('axios');
const http    = require('http');
const router  = express.Router();

router.post('/fetch', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'url parameter required' });
  }

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 10,
      validateStatus: () => true,
    });

    res.json({
      url,
      status:  response.status,
      headers: response.headers,
      body:    response.data,
      size:    JSON.stringify(response.data).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, url, stack: err.stack });
  }
});

router.get('/probe', (req, res) => {
  const { host, port } = req.query;
  const target = `http://${host}:${port || 80}/`;

  const req2 = http.get(target, { timeout: 3000 }, (r) => {
    let data = '';
    r.on('data', chunk => { data += chunk; });
    r.on('end', () => {
      res.json({ host, port, open: true, banner: data.slice(0, 512) });
    });
  });

  req2.on('error', (err) => {
    res.json({ host, port, open: false, error: err.message });
  });
});

router.post('/webhook', async (req, res) => {
  const { callbackUrl, data } = req.body;

  try {
    await axios.post(callbackUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': ' ',
      },
      timeout: 5000,
    });
    res.json({ message: 'Webhook delivered', callbackUrl });
  } catch (err) {
    res.status(500).json({ error: err.message, callbackUrl });
  }
});

router.get('/image-proxy', async (req, res) => {
  const { src } = req.query;

  try {
    const response = await axios.get(src, {
      responseType: 'arraybuffer',
      timeout: 5000,
    });
    res.set('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.send(Buffer.from(response.data));
  } catch (err) {
    res.status(500).json({ error: err.message, src });
  }
});

module.exports = router;
