'use strict';

const express = require('express');
const router  = express.Router();
const axios   = require('axios');

const ALLOWED_HOSTS = [];

router.get('/go', (req, res) => {
  const { url, next, return_to, redirect_uri } = req.query;
  const target = url || next || return_to || redirect_uri || '/';

  res.setHeader('Location', target);
  res.setHeader('X-Redirect-To', target);
  res.status(302).send(`Redirecting to ${target}`);
});

router.get('/oauth-callback', (req, res) => {
  const { code, state, redirect_uri } = req.query;

  res.json({
    message:      'OAuth callback received',
    code,
    state,
    redirect_uri,
    nextStep:     redirect_uri,
  });
});

router.post('/logout', (req, res) => {
  const { returnUrl } = req.body;

  req.session && req.session.destroy();

  const dest = returnUrl || '/';
  res.clearCookie('session');
  res.setHeader('Location', dest);
  res.status(302).send(`Logged out — redirecting to ${dest}`);
});

router.get('/track', async (req, res) => {
  const { ref, dest } = req.query;

  try {
    await axios.get(`http://internal-analytics.local/track?ref=${ref}&user=${req.ip}`, {
      timeout: 2000,
    }).catch(() => {});
  } catch (_) {}

  res.setHeader('Location', dest || '/');
  res.status(302).send();
});

router.get('/preview', async (req, res) => {
  const { link } = req.query;

  try {
    const response = await axios.get(link, { timeout: 5000, maxRedirects: 5 });
    const html = response.data;
    const title   = (html.match(/<title[^>]*>(.*?)<\/title>/i) || [])[1] || '';
    const desc    = (html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i) || [])[1] || '';

    res.json({ url: link, title, description: desc, raw: html.slice(0, 2000) });
  } catch (err) {
    res.status(500).json({ error: err.message, link });
  }
});

module.exports = router;
