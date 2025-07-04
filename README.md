# LeetScribe - Chrome Extension

A Chrome extension that allows you to save LeetCode problem notes directly to your Notion database with a single click.

## Features

- 🎯 **Smart Detection**: Automatically detects when you're on a LeetCode problem page
- 💾 **Local Backup**: Saves entries locally as backup in case Notion fails
- 🔄 **Real-time Sync**: Instantly syncs your notes to Notion
- 🎨 **Compatiable UI**: Clean, modern interface that doesn't interfere with LeetCode

## Installation

1. **Download the Extension**
   - Clone or download this repository
   - Ensure all files are in the same folder

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select the extension folder

3. **Set Up Notion Integration**
   - Follow the setup instructions below

## Notion Setup

### Step 1: Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "New integration"
3. Give it a name (e.g., "LeetScribe")
4. Select your workspace
5. Click "Submit"
6. **Copy the "Internal Integration Secret"** - you'll need this later

### Step 2: Create a Database

Create a new database in Notion with these **exact** property names:

| Property Name | Type |
|---------------|------|
| Question Name | Title |
| Topics | Text |
| URL | URL |
| Date Added | Date |

**Database Template:**

1. Create a new page in Notion
2. Type `/database` and select "Table - Full page"
3. Add the properties listed above

### Step 3: Share Database with Integration

1. Open your Database page
2. Click "Share" in the top right
3. Click "Copy link" to get the database share URL

### Step 4: Configure Extension

1. Click the extension icon in your Chrome toolbar
2. Paste your Integration Token
3. Paste your Database Share URL (the extension will automatically extract the Database ID)
4. Click "Save Configuration"
5. Click "Test Connection" to verify everything works

## Usage

1. **Navigate to any LeetCode problem** (e.g., https://leetcode.com/problems/two-sum/description/)

2. **Click the "Save to Notion" button** that appears in the top-right corner

3. **Fill in the form:**
   - **Question Name**: Enter the problem name manually (e.g., "Two Sum", "Valid Parentheses")
   - **Topics**: Auto-filled if available, or add manually (e.g., "Array, Hash Table")
   - **Intuition/Trick**: Your solution approach, key insights, or tricks

4. **Click "Save to Notion"** and you're done! ✅

## Data Storage Structure

### Database Properties (Table Columns)
- **Question Name**: Stored as the page title
- **Topics**: Stored as text in the Topics column  
- **URL**: Direct link to the LeetCode problem
- **Date Added**: Automatically set to today's date

### Page Content (Inside Each Notion Page)
- **Intuition/Trick**: Saved as formatted content blocks inside each page
  - Creates a "Intuition/Trick" heading
  - Followed by your notes in paragraph format
  - This allows for rich formatting and unlimited text length

## File Structure

```
LeetScribe/
├── manifest.json          # Extension configuration
├── content.js             # Main script that runs on LeetCode pages
├── background.js          # Handles Notion API calls
├── styles.css             # Styling for the save button and modal
├── popup.html             # Extension settings popup
├── popup.js               # Popup functionality
└── README.md              # This file
```

## How It Works

1. **Content Script** (`content.js`): Runs on LeetCode problem pages, adds the save button and modal
2. **Background Script** (`background.js`): Handles secure API calls to Notion
3. **Popup** (`popup.html/js`): Provides interface for configuration and viewing saved entries
4. **Local Storage**: Keeps backup copies of all saved entries


## Privacy & Security

- Your Notion token is stored securely in Chrome's sync storage
- All data is encrypted in transit to Notion's servers
- No data is sent to any third-party servers other than Notion
- Local backups are stored only on your device


**Happy coding!** 🚀 If you find this extension helpful, consider starring the repository and sharing it with fellow developers.
