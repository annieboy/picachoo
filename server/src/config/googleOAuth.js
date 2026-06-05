const { OAuth2Client } = require('google-auth-library');

// Single shared OAuth2Client instance — reuse across the app.
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// Narrowest scope that lets us create folders and upload files we created.
// drive.file only grants access to files/folders the app itself creates —
// the host's pre-existing Drive content is never visible to us.
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

module.exports = { oauth2Client, DRIVE_SCOPE };
