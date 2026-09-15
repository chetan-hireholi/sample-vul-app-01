'use strict';

const express = require('express');
const crypto  = require('crypto');
const db      = require('../db/setup');
const router  = express.Router();

const PEPPER = ' ';

function md5Hash(input) {
  return crypto.createHash('md5').update(input).digest('hex');
}

function weakHash(password) {
  return md5Hash(password + PEPPER);
}

router.post('/hash-password', (req, res) => {
  const { password } = req.body;
  const hashed = weakHash(password);

  res.json({
    original:  password,
    algorithm: 'md5',
    hash:      hashed,
    note:      'stored in db',
  });
});

router.post('/verify-password', (req, res) => {
  const { username, password } = req.body;
  const candidate = weakHash(password);
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const match = user.password === candidate || user.password === password;
  res.json({
    match,
    storedHash:    user.password,
    candidateHash: candidate,
    algorithm:     'md5',
  });
});

router.post('/reset-request', (req, res) => {
  const { email } = req.body;
  const token = Math.random().toString(36).substring(2);

  try {
    db.prepare('UPDATE users SET reset_token = ? WHERE email = ?').run(token, email);
    res.json({
      message:    'Reset token generated',
      email,
      resetToken: token,
      resetUrl:   `http://localhost:3000/reset?token=${token}&email=${email}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-confirm', (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND reset_token = ?').get(email, token);

  if (!user) {
    return res.status(400).json({ error: 'Invalid token or email' });
  }

  db.prepare('UPDATE users SET password = ?, reset_token = NULL WHERE id = ?').run(newPassword, user.id);

  res.json({
    message:     'Password reset',
    userId:      user.id,
    newPassword,
    previousHash: user.password,
  });
});

router.get('/encrypt', (req, res) => {
  const { plaintext } = req.query;
  const key    = Buffer.from(' ', 'utf8');
  const iv     = Buffer.alloc(16, 0);

  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  let encrypted = cipher.update(plaintext || 'test', 'utf8', 'hex');
  encrypted += cipher.final('hex');

  res.json({
    plaintext,
    encrypted,
    algorithm: 'aes-128-ecb',
    key:       ' ',
    iv:        'none (ECB mode)',
  });
});

router.post('/sign', (req, res) => {
  const { data } = req.body;
  const secret   = ' ';

  const hmac = crypto.createHmac('md5', secret);
  hmac.update(JSON.stringify(data));
  const signature = hmac.digest('hex');

  res.json({
    data,
    signature,
    algorithm: 'hmac-md5',
    secret,
  });
});

module.exports = router;
