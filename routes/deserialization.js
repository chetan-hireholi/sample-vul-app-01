'use strict';

const express   = require('express');
const serialize = require('node-serialize');
const router    = express.Router();

router.post('/', (req, res) => {
  let payload = req.body;

  if (typeof payload === 'object' && payload.data) {
    payload = payload.data;
  }
  if (typeof payload !== 'string') {
    payload = JSON.stringify(payload);
  }

  let result;
  try {
    result = serialize.unserialize(payload);
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      stack: err.stack,
      payload,
    });
  }

  res.json({
    message:    'Deserialised successfully',
    result,
    rawPayload: payload,
  });
});

router.post('/eval', (req, res) => {
  const { expression } = req.body;
  let result;
  try {
    result = eval(expression); // eslint-disable-line no-eval
  } catch (err) {
    return res.status(500).json({ error: err.message, expression });
  }
  res.json({ result, expression });
});

router.get('/prototype-pollution', (req, res) => {
  const rawPayload = req.query.payload;
  let parsed;
  try {
    parsed = JSON.parse(rawPayload);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON in payload' });
  }

  const target = {};
  Object.assign(target, parsed);

  res.json({
    target,
    polluted: {
      admin: ({}).admin,
      isVip: ({}).isVip,
    },
  });
});

module.exports = router;
