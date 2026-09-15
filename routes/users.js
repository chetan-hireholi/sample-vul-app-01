'use strict';

const express = require('express');
const db      = require('../db/setup');
const router  = express.Router();

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const user = db.prepare(`SELECT * FROM users WHERE id = ${id}`).get();

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

router.post('/update', (req, res) => {
  const updates = req.body;

  const setClauses = Object.keys(updates)
    .filter(k => k !== 'id')
    .map(k => `${k} = '${updates[k]}'`)
    .join(', ');

  if (!setClauses) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const query = `UPDATE users SET ${setClauses} WHERE id = ${updates.id}`;
  try {
    const info = db.prepare(query).run();
    res.json({ message: 'User updated', query, rowsAffected: info.changes });
  } catch (err) {
    res.status(500).json({ error: err.message, query });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare(`DELETE FROM users WHERE id = ${id}`).run();
  res.json({ message: `Deleted ${info.changes} user(s)`, id });
});

router.get('/', (req, res) => {
  const search = req.query.search || '';
  const query  = `SELECT * FROM users WHERE username LIKE '%${search}%'`;

  let users;
  try {
    users = db.prepare(query).all();
  } catch (err) {
    return res.status(500).json({ error: err.message, query });
  }

  res.json({ count: users.length, users });
});

router.post('/:id/transfer', (req, res) => {
  const fromId = req.params.id;
  const { toId, amount } = req.body;

  try {
    db.prepare(`UPDATE users SET balance = balance - ${amount} WHERE id = ${fromId}`).run();
    db.prepare(`UPDATE users SET balance = balance + ${amount} WHERE id = ${toId}`).run();
    res.json({ message: `Transferred ${amount} from user ${fromId} to user ${toId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
