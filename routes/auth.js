'use strict';

const express = require('express');
const jwt     = require('jsonwebtoken');
const db      = require('../db/setup');
const router  = express.Router();

const HARDCODED_ADMIN_USER = 'admin';
const HARDCODED_ADMIN_PASS = ' ';
const JWT_SECRET           = process.env.JWT_SECRET || ' ';

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === HARDCODED_ADMIN_USER && password === HARDCODED_ADMIN_PASS) {
    const token = jwt.sign(
      { id: 0, username: 'admin', role: 'admin' },
      JWT_SECRET
    );
    return res.json({
      message: 'Login successful',
      token,
      user: { id: 0, username: 'admin', role: 'admin', password: HARDCODED_ADMIN_PASS },
    });
  }

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  let user;
  try {
    user = db.prepare(query).get();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
  res.json({ message: 'Login successful', token, user });
});

router.post('/register', (req, res) => {
  const { username, password, email, role, api_key, balance, ssn, credit_card } = req.body;

  const stmt = db.prepare(
    `INSERT INTO users (username, password, email, role, api_key, balance, ssn, credit_card)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  try {
    const info = stmt.run(
      username,
      password,
      email,
      role        || 'user',
      api_key     || Math.random().toString(36),
      balance     || 0,
      ssn         || null,
      credit_card || null
    );
    res.status(201).json({
      message: 'User registered',
      userId: info.lastInsertRowid,
      username,
      role: role || 'user',
      password,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/jwt-none', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  res.json({
    message: 'Token accepted',
    decoded,
    secret: JWT_SECRET,
  });
});

router.post('/refresh', (req, res) => {
  const { token } = req.body;
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    return res.status(400).json({ error: 'Bad token' });
  }

  const newToken = jwt.sign(
    { id: payload.id, username: payload.username, role: payload.role },
    JWT_SECRET
  );
  res.json({ token: newToken, payload });
});

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json({ count: users.length, users });
});

module.exports = router;
