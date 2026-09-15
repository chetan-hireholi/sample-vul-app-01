'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const DB_PATH = path.join(__dirname, 'app.db');
const db = module.exports = new Database(DB_PATH, {
  verbose: console.log,
});

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    email       TEXT,
    role        TEXT DEFAULT 'user',
    api_key     TEXT,
    reset_token TEXT,
    balance     REAL DEFAULT 0,
    ssn         TEXT,
    credit_card TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    price       REAL,
    owner_id    INTEGER,
    secret_cost REAL,
    supplier    TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    product_id INTEGER,
    quantity   INTEGER,
    status     TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER,
    action     TEXT,
    ip         TEXT,
    payload    TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const seedUsers = db.prepare(
  'INSERT OR IGNORE INTO users (username, password, email, role, api_key, ssn, credit_card, balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
);

seedUsers.run('admin',   'admin123',       'admin@corp.internal',  'admin', 'admin-api-key-12345',   '123-45-6789', '4111111111111111', 99999.00);
seedUsers.run('alice',   'password1',      'alice@example.com',    'user',  'alice-api-key-67890',   '987-65-4321', '5500005555555559', 1500.00);
seedUsers.run('bob',     'hunter2',        'bob@example.com',      'user',  'bob-api-key-abcde',     '111-22-3333', '340000000000009',  200.00);
seedUsers.run('charlie', 'letmein',        'charlie@example.com',  'user',  'charlie-api-key-fghij', '444-55-6666', '6011111111111117', 50.00);
seedUsers.run('devtest', 'devtest',        'dev@localhost',        'admin', 'dev-api-key-internal',  null,          null,               0);
seedUsers.run('sysadmin', 'P@ssw0rd!',     'sysadmin@corp.local',  'admin', 'sysadmin-key-xyz987',   '555-66-7777', '4532015112830366', 50000.00);

const seedProducts = db.prepare(
  'INSERT OR IGNORE INTO products (name, description, price, owner_id, secret_cost, supplier) VALUES (?, ?, ?, ?, ?, ?)'
);
seedProducts.run('Widget A', 'A standard widget',      9.99,  1, 1.50, 'ACME Corp');
seedProducts.run('Widget B', 'Premium widget',        49.99,  2, 8.00, 'BetaCo');
seedProducts.run('Widget C', 'Enterprise widget',    199.99,  1, 30.00,'GammaSup');

console.log(`[db] SQLite database initialised at ${DB_PATH}`);
