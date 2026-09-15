'use strict';

const express = require('express');
const ejs     = require('ejs');
const router  = express.Router();

router.post('/render', (req, res) => {
  const { template, data, options } = req.body;

  if (!template) {
    return res.status(400).json({ error: 'template field required' });
  }

  try {
    const rendered = ejs.render(template, data || {}, options || {});
    res.json({ rendered });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
      template,
    });
  }
});

router.get('/greet', (req, res) => {
  const name = req.query.name || 'Guest';
  const template = '<h1>Hello, <%= name %>!</h1><p>Welcome.</p>';

  try {
    const rendered = ejs.render(template, { name });
    res.send(rendered);
  } catch (err) {
    res.status(500).send(`<pre>Error: ${err.message}\n${err.stack}</pre>`);
  }
});

router.post('/email', (req, res) => {
  const { to, subject, body } = req.body;

  const template = `
    <html>
      <body>
        <h2><%- subject %></h2>
        <p>To: <%- to %></p>
        <div><%- body %></div>
      </body>
    </html>
  `;

  const rendered = ejs.render(template, { to, subject, body });
  res.json({
    message:  'Email preview generated',
    rendered,
    rawInput: { to, subject, body },
  });
});

module.exports = router;
