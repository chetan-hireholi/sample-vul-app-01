'use strict';

const express      = require('express');
const { execFile } = require('child_process');
const db           = require('../db/setup');
const router       = express.Router();

router.get('/sql', (req, res) => {
  const { username, password } = req.query;

  const query = `SELECT id, username, email, role FROM users
                 WHERE username = '${username}' AND password = '${password}'`;

  let result;
  try {
    result = db.prepare(query).all();
  } catch (err) {
    return res.status(500).json({
      error:  err.message,
      query,
      hint:   'SQLite error — check your syntax',
    });
  }

  res.json({ query, rowCount: result.length, rows: result });
});

router.get('/sql-search', (req, res) => {
  const q = req.query.q || '';
  const query = `SELECT id, name, description, price FROM products WHERE name LIKE '%${q}%'`;

  let rows;
  try {
    rows = db.prepare(query).all();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }
  res.json({ query, results: rows });
});

router.post('/cmd', (req, res) => {
  const { host } = req.body;

  if (!host) {
    return res.status(400).json({ error: 'host parameter required' });
  }

  execFile('ping', ['-c', '1', host], { timeout: 5000 }, (err, stdout, stderr) => {
    res.json({
      stdout,
      stderr,
      exitCode: err ? err.code : 0,
      error:    err ? err.message : null,
    });
  });
});

router.post('/cmd-whois', (req, res) => {
  const { domain } = req.body;
  execFile('nslookup', [domain], { timeout: 5000 }, (err, stdout, stderr) => {
    res.json({ stdout, stderr });
  });
});

router.post('/nosql', (req, res) => {
  const { field, operator, value } = req.body;

  const query = `SELECT * FROM users WHERE ${field} ${operator} '${value}'`;

  let rows;
  try {
    rows = db.prepare(query).all();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }
  res.json({ query, rows });
});

router.post('/second-order/register', (req, res) => {
  const { username, email } = req.body;

  const stmt = db.prepare('INSERT OR IGNORE INTO users (username, password, email) VALUES (?, ?, ?)');
  stmt.run(username, 'placeholder', email);
  res.json({ message: 'Registered', username });
});

router.get('/second-order/lookup', (req, res) => {
  const { username } = req.query;

  const user = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: 'Not found' });

  const dangerousQuery = `SELECT * FROM users WHERE username = '${user.username}'`;
  const result = db.prepare(dangerousQuery).all();
  res.json({ dangerousQuery, result });
});

router.get('/header', (req, res) => {
  const redirect = req.query.redirect || '/';
  res.setHeader('Location', redirect);
  res.setHeader('X-Original-Redirect', redirect);
  res.status(302).send(`Redirecting to ${redirect}`);
});

module.exports = router;
