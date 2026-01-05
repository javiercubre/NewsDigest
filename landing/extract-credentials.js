#!/usr/bin/env node

/**
 * Helper script to extract credentials from Google Service Account JSON
 *
 * Usage: node extract-credentials.js path/to/service-account.json
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(color + message + colors.reset);
}

function main() {
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset);
  log(colors.cyan, '  Google Service Account Credential Extractor');
  console.log(colors.cyan + '═'.repeat(60) + colors.reset + '\n');

  // Get file path from arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    log(colors.red, '❌ Error: No file path provided\n');
    log(colors.yellow, 'Usage:');
    console.log('  node extract-credentials.js path/to/service-account.json\n');
    console.log('Example:');
    console.log('  node extract-credentials.js ~/Downloads/newsdigest-service-account.json\n');
    process.exit(1);
  }

  const filePath = args[0];

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    log(colors.red, `❌ Error: File not found: ${filePath}\n`);
    process.exit(1);
  }

  // Read and parse JSON
  let credentials;
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    credentials = JSON.parse(fileContent);
  } catch (error) {
    log(colors.red, `❌ Error: Could not parse JSON file\n`);
    console.error(error.message);
    process.exit(1);
  }

  // Validate required fields
  const requiredFields = ['client_email', 'private_key'];
  const missingFields = requiredFields.filter(field => !credentials[field]);

  if (missingFields.length > 0) {
    log(colors.red, `❌ Error: Missing required fields: ${missingFields.join(', ')}\n`);
    process.exit(1);
  }

  log(colors.green, '✅ Valid service account JSON file\n');

  // Extract values
  const email = credentials.client_email;
  const privateKey = credentials.private_key;
  const projectId = credentials.project_id || 'N/A';

  // Display values
  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  log(colors.blue, '1. GOOGLE_SERVICE_ACCOUNT_EMAIL');
  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  console.log(email);
  console.log('');

  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  log(colors.blue, '2. GOOGLE_PRIVATE_KEY');
  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  console.log(privateKey);
  console.log('');

  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  log(colors.blue, '3. Project Information');
  console.log(colors.cyan + '─'.repeat(60) + colors.reset);
  console.log(`Project ID: ${projectId}`);
  console.log('');

  // Instructions
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);
  log(colors.yellow, '📋 Next Steps:');
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);
  console.log('');

  console.log('1. Copy these values to Vercel:');
  console.log('   → Go to https://vercel.com/dashboard');
  console.log('   → Select your project');
  console.log('   → Settings → Environment Variables');
  console.log('');

  console.log('2. Add three environment variables:');
  console.log('');
  console.log('   Variable 1:');
  console.log('   Key:   GOOGLE_SERVICE_ACCOUNT_EMAIL');
  console.log('   Value: ' + email);
  console.log('');

  console.log('   Variable 2:');
  console.log('   Key:   GOOGLE_PRIVATE_KEY');
  console.log('   Value: (copy the entire private key above)');
  console.log('');

  console.log('   Variable 3:');
  console.log('   Key:   GOOGLE_SHEET_ID');
  console.log('   Value: (get from your Google Sheet URL)');
  console.log('');

  console.log('3. Make sure to:');
  console.log('   ✓ Check all environments (Production, Preview, Development)');
  console.log('   ✓ Share your Google Sheet with: ' + email);
  console.log('   ✓ Give Editor permissions');
  console.log('');

  console.log('4. Redeploy:');
  console.log('   vercel --prod');
  console.log('');

  // Validation warnings
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);
  log(colors.yellow, '⚠️  Security Reminders:');
  console.log(colors.cyan + '═'.repeat(60) + colors.reset);
  console.log('');
  console.log('• Never commit this JSON file to Git');
  console.log('• Never share these credentials publicly');
  console.log('• Store the file securely');
  console.log('• Add to .gitignore if not already there');
  console.log('');

  // Check private key format
  if (!privateKey.includes('\\n')) {
    log(colors.yellow, '\n⚠️  Warning: Your private key may not have proper newline characters');
    console.log('   Make sure to copy it exactly as shown above, including \\n');
    console.log('');
  }

  log(colors.green, '✅ Credentials extracted successfully!\n');
}

main();
