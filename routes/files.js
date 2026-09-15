'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');
const router  = express.Router();

const upload = multer({ limits: { fileSize: 100 * 1024 * 1024 } });

router.get('/read', (req, res) => {
  const filename  = req.query.file;
  const baseDir   = path.join(__dirname, '..', 'public');

  if (!filename) {
    return res.status(400).json({
      error: 'file parameter required',
      baseDir,
    });
  }

  const filePath = path.join(baseDir, filename);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({
      file:     filename,
      resolved: filePath,
      content,
    });
  } catch (err) {
    res.status(500).json({
      error:    err.message,
      code:     err.code,
      resolved: filePath,
    });
  }
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const dest = path.join(uploadsDir, req.file.originalname);
  fs.writeFileSync(dest, req.file.buffer);

  res.json({
    message:      'File uploaded',
    originalName: req.file.originalname,
    savedPath:    dest,
    mimetype:     req.file.mimetype,
    size:         req.file.size,
  });
});

router.get('/execute', (req, res) => {
  const filename = req.query.file;
  const filePath = path.join(__dirname, '..', 'uploads', filename);

  try {
    const result = require(filePath);
    res.json({ message: 'File executed', result });
  } catch (err) {
    res.status(500).json({ error: err.message, path: filePath });
  }
});

router.get('/list', (req, res) => {
  const dir = req.query.dir || '.';
  const target = path.join(__dirname, '..', dir);

  try {
    const entries = fs.readdirSync(target, { withFileTypes: true });
    res.json({
      directory: target,
      entries: entries.map(e => ({ name: e.name, isDir: e.isDirectory() })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message, path: target });
  }
});

module.exports = router;
