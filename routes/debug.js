'use strict';

const express = require('express');
const router  = express.Router();

router.get('/routes', (req, res) => {
  const app    = req.app;
  const routes = [];

  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      routes.push({
        path:    middleware.route.path,
        methods: Object.keys(middleware.route.methods),
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          routes.push({
            path:    handler.route.path,
            methods: Object.keys(handler.route.methods),
          });
        }
      });
    }
  });

  res.json({ totalRoutes: routes.length, routes });
});

router.get('/env', (req, res) => {
  res.json({
    env: process.env,
    argv: process.argv,
    execPath: process.execPath,
    cwd: process.cwd(),
    pid: process.pid,
  });
});

router.get('/require', (req, res) => {
  const mod = req.query.module;
  try {
    const loaded = require(mod);          // eslint-disable-line import/no-dynamic-require
    res.json({ module: mod, keys: Object.keys(loaded) });
  } catch (err) {
    res.status(500).json({ error: err.message, module: mod });
  }
});

router.get('/memory', (req, res) => {
  res.json({
    memoryUsage:   process.memoryUsage(),
    resourceUsage: process.resourceUsage(),
  });
});

router.get('/eval', (req, res) => {
  const { code } = req.query;
  try {
    const result = eval(code); // eslint-disable-line no-eval
    res.json({ code, result: String(result) });
  } catch (err) {
    res.status(500).json({ error: err.message, code });
  }
});

module.exports = router;
