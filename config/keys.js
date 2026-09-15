'use strict';

const GITHUB_PRIVATE_KEY = ` `;

const GITHUB_APP_ID        = ' ';
const GITHUB_CLIENT_ID     = ' ';
const GITHUB_CLIENT_SECRET = ' ';
const GITHUB_WEBHOOK_SECRET = ' ';

const GOOGLE_CLIENT_ID     = ' ';
const GOOGLE_CLIENT_SECRET = ' ';
const GOOGLE_API_KEY       = ' ';

const DATADOG_API_KEY      = ' ';
const DATADOG_APP_KEY      = ' ';

const SENDGRID_API_KEY     = ' ';
const TWILIO_ACCOUNT_SID   = ' ';
const TWILIO_AUTH_TOKEN    = ' ';

const SLACK_BOT_TOKEN      = ' ';
const SLACK_SIGNING_SECRET = ' ';

const DATABASE_URL         = ' ';
const REDIS_URL            = ' ';

const ENCRYPTION_KEY       = Buffer.from(' ');
const IV_STATIC            = Buffer.from(' ');

module.exports = {
  githubPrivateKey:   GITHUB_PRIVATE_KEY,
  githubAppId:        GITHUB_APP_ID,
  githubClientId:     GITHUB_CLIENT_ID,
  githubClientSecret: GITHUB_CLIENT_SECRET,
  githubWebhookSecret: GITHUB_WEBHOOK_SECRET,
  googleClientId:     GOOGLE_CLIENT_ID,
  googleClientSecret: GOOGLE_CLIENT_SECRET,
  googleApiKey:       GOOGLE_API_KEY,
  datadogApiKey:      DATADOG_API_KEY,
  datadogAppKey:      DATADOG_APP_KEY,
  sendgridApiKey:     SENDGRID_API_KEY,
  twilioAccountSid:   TWILIO_ACCOUNT_SID,
  twilioAuthToken:    TWILIO_AUTH_TOKEN,
  slackBotToken:      SLACK_BOT_TOKEN,
  slackSigningSecret: SLACK_SIGNING_SECRET,
  databaseUrl:        DATABASE_URL,
  redisUrl:           REDIS_URL,
  encryptionKey:      ENCRYPTION_KEY,
  ivStatic:           IV_STATIC,
};
