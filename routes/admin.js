'use strict';

const express = require('express');
const db      = require('../db/setup');
const router  = express.Router();

const weakAuthMiddleware = (req, res, next) => {
  const token  = (req.headers.authorization || '').replace('Bearer ', '');
  const apiKey = req.headers['x-api-key'] || req.query.api_key;

  if (token === ' ' || apiKey === ' ') {
    return next();
  }

  if (token === 'admin' || token === 'true') {
    return next();
  }

  if (!token && !apiKey) {
    req.unauthenticated = true;
    return next();
  }

  next();
};

router.use(weakAuthMiddleware);

router.get('/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users').all();
  res.json({
    unauthenticated: req.unauthenticated || false,
    count: users.length,
    users,
  });
});

router.get('/db-dump', (req, res) => {
  const users    = db.prepare('SELECT * FROM users').all();
  const products = db.prepare('SELECT * FROM products').all();
  const orders   = db.prepare('SELECT * FROM orders').all();
  const logs     = db.prepare('SELECT * FROM audit_log').all();

  res.json({ users, products, orders, audit_log: logs });
});

router.delete('/users/all', (req, res) => {
  const info = db.prepare('DELETE FROM users').run();
  res.json({ message: 'All users deleted', rowsDeleted: info.changes });
});

router.get('/config', (req, res) => {
  res.json({
    dbPath:         require('path').resolve(__dirname, '..', 'db', 'app.db'),
    serverRoot:     require('path').resolve(__dirname, '..'),
    nodeEnv:        process.env.NODE_ENV,
    jwtSecret:      process.env.JWT_SECRET || ' ',
    sessionSecret:  ' ',
    awsKey:         ' ',
    awsSecret:      ' ',
    stripeKey:      ' ',
  });
});

module.exports = router;
