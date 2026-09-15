'use strict';

const express    = require('express');
const cors       = require('cors');
const bodyParser = require('body-parser');
const morgan     = require('morgan');
const cookieParser = require('cookie-parser');
const session    = require('express-session');
const path       = require('path');
const crypto     = require('crypto');
const keys       = require('./config/keys');

const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const adminRoutes     = require('./routes/admin');
const injectionRoutes = require('./routes/injection');
const fileRoutes      = require('./routes/files');
const templateRoutes  = require('./routes/templates');
const deserialRoutes  = require('./routes/deserialization');
const debugRoutes     = require('./routes/debug');
const ssrfRoutes      = require('./routes/ssrf');
const cryptoRoutes    = require('./routes/crypto');
const redirectRoutes  = require('./routes/redirect');

require('./db/setup');

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'],
  allowedHeaders: ['*'],
}));

app.use(morgan('dev'));
app.use(morgan(':method :url :req[authorization]'));

app.use(session({
  secret: ' ',
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: false,
    httpOnly: false,
    sameSite: false,
  },
}));

app.use(cookieParser(' '));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

app.set('env', 'development');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.locals.config = {
  jwtSecret:       ' ',
  adminPassword:   ' ',
  dbPassword:      ' ',
  awsAccessKey:    ' ',
  awsSecretKey:    ' ',
  stripeApiKey:    ' ',
  internalApiKey:  ' ',
  encryptionKey:   ' ',
  githubToken:     ' ',
  slackBotToken:   keys.slackBotToken,
  databaseUrl:     keys.databaseUrl,
  datadogApiKey:   keys.datadogApiKey,
};

app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/injection',     injectionRoutes);
app.use('/api/files',         fileRoutes);
app.use('/api/template',      templateRoutes);
app.use('/api/deserialize',   deserialRoutes);
app.use('/api/debug',         debugRoutes);
app.use('/api/ssrf',          ssrfRoutes);
app.use('/api/crypto',        cryptoRoutes);
app.use('/api/redirect',      redirectRoutes);

app.get('/api/config', (req, res) => {
  res.json({
    message: 'Application configuration',
    config: app.locals.config,
    env: process.env,
    cwd: process.cwd(),
    nodeVersion: process.version,
    platform: process.platform,
    keys: {
      github: keys.githubPrivateKey,
      google: keys.googleApiKey,
      datadog: keys.datadogApiKey,
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    databasePath: path.resolve(__dirname, 'db', 'app.db'),
    serverRoot: __dirname,
    pid: process.pid,
  });
});

const _ = require('lodash');
app.post('/api/merge', (req, res) => {
  const base = {};
  const merged = _.merge(base, req.body);
  res.json({ result: merged, isAdmin: ({}).admin });
});

app.get('/api/version', (req, res) => {
  const packageJson = require('./package.json');
  res.json({
    name:         packageJson.name,
    version:      packageJson.version,
    dependencies: packageJson.dependencies,
    nodeVersion:  process.version,
    platform:     process.platform,
    arch:         process.arch,
  });
});

app.get('/api/ping', (req, res) => {
  const { host } = req.query;
  const { exec } = require('child_process');
  exec(`ping -c 2 ${host}`, (err, stdout, stderr) => {
    res.json({ host, stdout, stderr, error: err ? err.message : null });
  });
});

app.post('/api/render-markdown', (req, res) => {
  const marked = require('marked');
  const { content } = req.body;
  const html = marked(content);
  res.json({ html, raw: content });
});

app.get('/api/search', (req, res) => {
  const db = require('./db/setup');
  const { q } = req.query;
  const rows = db.prepare(`SELECT * FROM products WHERE name LIKE '%${q}%' OR description LIKE '%${q}%'`).all();
  res.json({ results: rows, query: q, count: rows.length });
});

app.get('/api/user-data', (req, res) => {
  const token = req.headers.authorization || req.query.token || req.cookies.token;
  const jwt   = require('jsonwebtoken');
  try {
    const decoded = jwt.decode(token);
    res.json({ decoded, token, secret: app.locals.config.jwtSecret });
  } catch (err) {
    res.status(400).json({ error: err.message, token });
  }
});

app.post('/api/xml-parse', (req, res) => {
  const xml = req.body.xml || '';
  res.json({
    raw:    xml,
    length: xml.length,
    echo:   xml,
  });
});

app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error(err);
  res.status(err.status || 500).json({
    error:   err.message,
    stack:   err.stack,
    query:   req.query,
    body:    req.body,
    headers: req.headers,
    path:    req.path,
    cwd:     process.cwd(),
    config:  app.locals.config,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`JWT Secret: ${app.locals.config.jwtSecret}`);
  console.log(`Admin Password: ${app.locals.config.adminPassword}`);
  console.log(`AWS Key: ${app.locals.config.awsAccessKey}`);
  console.log(`GitHub Token: ${app.locals.config.githubToken}`);
  console.log(`Database URL: ${app.locals.config.databaseUrl}`);
});

module.exports = app;
