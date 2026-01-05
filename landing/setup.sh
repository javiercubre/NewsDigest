#!/bin/bash

# NewsDigest Landing Page - Professional Setup Script
# This script will help you deploy to Vercel with Google Sheets integration

echo "🚀 NewsDigest Landing Page Setup"
echo "=================================="
echo ""

# Check if we're in the landing directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the /landing directory"
    echo "   cd landing && bash setup.sh"
    exit 1
fi

echo "✅ Found landing page files"
echo ""

# Check for required tools
echo "📋 Checking requirements..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi
echo "✅ Node.js found"

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✅ npm found"

echo ""
echo "📦 Installing dependencies..."
npm install googleapis

echo ""
echo "✅ Dependencies installed!"
echo ""

echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Create Google Sheet:"
echo "   → Go to https://sheets.google.com"
echo "   → Create new sheet: 'NewsDigest Signups'"
echo "   → Add headers: Email | Source | Timestamp"
echo "   → Copy the Sheet ID from URL (the long string after /d/)"
echo ""

echo "2. Create Google Service Account:"
echo "   → Go to https://console.cloud.google.com"
echo "   → Create new project: 'NewsDigest'"
echo "   → Enable Google Sheets API"
echo "   → Create Service Account"
echo "   → Download JSON key file"
echo ""

echo "3. Share Sheet with Service Account:"
echo "   → Open your Google Sheet"
echo "   → Click 'Share'"
echo "   → Paste service account email (from JSON: client_email)"
echo "   → Give 'Editor' permissions"
echo ""

echo "4. Deploy to Vercel:"
echo "   → Install Vercel CLI: npm install -g vercel"
echo "   → Run: vercel"
echo "   → Follow prompts to create project"
echo ""

echo "5. Set Environment Variables:"
echo "   → Go to Vercel dashboard → Project Settings → Environment Variables"
echo "   → Add these three variables from your service account JSON:"
echo "     GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com"
echo "     GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----"
echo "     GOOGLE_SHEET_ID=1abc...xyz"
echo ""

echo "6. Redeploy:"
echo "   → Run: vercel --prod"
echo ""

echo "📖 Full guide: See DEPLOY_NOW.md for detailed instructions"
echo ""

read -p "Press Enter to continue..."
