const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, 'sheets-config.json');
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || path.resolve(__dirname, 'credentials.json');

const SHEET_TITLES = {
  student: 'Student Registrations',
  teacher: 'Teacher Registrations',
  hod: 'HOD Registrations',
  admin: 'Admin Registrations'
};

const HEADERS = ['Name', 'Email', 'Role', 'Department', 'Registered At', 'Source', 'Extra Info'];

let sheetsClient = null;
let authClient = null;

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return { student: '', teacher: '', hod: '', admin: '' };
  }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

function getAuth() {
  if (authClient) return authClient;

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.warn('[Sheets] credentials.json not found at', CREDENTIALS_PATH);
    return null;
  }

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_email, private_key } = creds.installed || creds;

  authClient = new google.auth.JWT(client_email, null, private_key, [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ]);

  return authClient;
}

function getSheets() {
  if (sheetsClient) return sheetsClient;
  const auth = getAuth();
  if (!auth) return null;
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

function getDrive() {
  const auth = getAuth();
  if (!auth) return null;
  return google.drive({ version: 'v3', auth });
}

async function initSheets() {
  const auth = getAuth();
  if (!auth) {
    console.warn('[Sheets] Skipping init — no credentials found');
    return false;
  }

  const config = loadConfig();
  const sheets = getSheets();
  if (!sheets) return false;

  for (const [role, title] of Object.entries(SHEET_TITLES)) {
    if (config[role]) {
      try {
        await sheets.spreadsheets.get({ spreadsheetId: config[role] });
        console.log(`[Sheets] Verified sheet for ${role}: ${config[role]}`);
        continue;
      } catch {
        console.log(`[Sheets] Sheet ${config[role]} no longer exists, recreating...`);
        config[role] = '';
      }
    }

    try {
      const res = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title },
          sheets: [{ properties: { title: 'Registrations' } }]
        }
      });

      const spreadsheetId = res.data.spreadsheetId;
      config[role] = spreadsheetId;

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Registrations!A1:G1',
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS] }
      });

      console.log(`[Sheets] Created sheet for ${role}: https://docs.google.com/spreadsheets/d/${spreadsheetId}`);
    } catch (err) {
      console.error(`[Sheets] Failed to create sheet for ${role}:`, err.message);
    }
  }

  saveConfig(config);
  return true;
}

async function appendToSheet(role, rowData) {
  const sheets = getSheets();
  const config = loadConfig();
  const spreadsheetId = config[role];

  if (!sheets || !spreadsheetId) {
    console.warn(`[Sheets] Cannot append — sheets not ready for role: ${role}`);
    return false;
  }

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Registrations!A:G',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [rowData] }
    });
    return true;
  } catch (err) {
    console.error(`[Sheets] Append failed for ${role}:`, err.message);
    return false;
  }
}

function getSheetUrl(role) {
  const config = loadConfig();
  const id = config[role];
  if (!id) return null;
  return `https://docs.google.com/spreadsheets/d/${id}`;
}

function getAllSheetUrls() {
  const config = loadConfig();
  const urls = {};
  for (const [role, id] of Object.entries(config)) {
    urls[role] = id ? `https://docs.google.com/spreadsheets/d/${id}` : null;
  }
  return urls;
}

module.exports = {
  initSheets,
  appendToSheet,
  getSheetUrl,
  getAllSheetUrls
};
