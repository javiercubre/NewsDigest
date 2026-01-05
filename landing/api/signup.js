// Vercel Serverless Function for email signup
// Deploy to Vercel or adapt for other platforms

// Option 1: Save to Google Sheets (recommended for MVP)
// Option 2: Save to Airtable
// Option 3: Save to database (PostgreSQL/Supabase)

import { google } from 'googleapis';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, source = 'landing' } = req.body;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  try {
    // Option 1: Save to Google Sheets
    await saveToGoogleSheets(email, source);

    // Option 2: Save to Airtable (uncomment if using)
    // await saveToAirtable(email, source);

    // Option 3: Save to Supabase (uncomment if using)
    // await saveToSupabase(email, source);

    return res.status(200).json({
      success: true,
      message: 'Email registered successfully'
    });
  } catch (error) {
    console.error('Error saving email:', error);
    return res.status(500).json({ error: 'Failed to save email' });
  }
}

// Google Sheets integration
async function saveToGoogleSheets(email, source) {
  // 1. Create a Google Service Account
  // 2. Share your spreadsheet with the service account email
  // 3. Set environment variables: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID

  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );

  const sheets = google.sheets({ version: 'v4', auth });

  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Sheet1!A:C',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[email, source, timestamp]]
    }
  });
}

// Airtable integration (alternative)
async function saveToAirtable(email, source) {
  const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Signups';

  const response = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          Email: email,
          Source: source,
          Timestamp: new Date().toISOString(),
          Status: 'New'
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error('Failed to save to Airtable');
  }
}

// Supabase integration (alternative)
async function saveToSupabase(email, source) {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { error } = await supabase
    .from('signups')
    .insert([
      {
        email,
        source,
        created_at: new Date().toISOString(),
        status: 'new'
      }
    ]);

  if (error) {
    throw error;
  }
}
