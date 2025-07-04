# LeetScribe - Chrome Extension

A Chrome extension that allows you to save LeetCode problem notes directly to your Notion database with a single click.

## Features

- 🎯 **Smart Detection**: Automatically detects when you're on a LeetCode problem page
- 🚀 **One-Click Save**: Floating save button for quick access
- 📝 **Auto-Fill**: Automatically extracts question name and topics from the page
- 💾 **Local Backup**: Saves entries locally as backup in case Notion fails
- 🔄 **Real-time Sync**: Instantly syncs your notes to Notion
- 🎨 **Beautiful UI**: Clean, modern interface that doesn't interfere with LeetCode

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
6. **Copy the "Internal Integration Token"** - you'll need this later

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

1. Open your database page
2. Click "Share" in the top right
3. Click "Invite" and search for your integration name
4. Give it "Edit" permissions
5. **Copy the Database ID** from the URL (the long string of characters)

### Step 4: Configure Extension

1. Click the extension icon in your Chrome toolbar
2. Paste your Integration Token
3. Paste your Database ID
4. Click "Save Configuration"
5. Click "Test Connection" to verify everything works

## Usage

1. **Navigate to any LeetCode problem** (e.g., https://leetcode.com/problems/two-sum/description/)

2. **Click the "Save to Notion" button** that appears in the top-right corner

3. **Fill in the form:**
   - **Question Name**: Auto-filled from the page title
   - **Topics**: Auto-filled if available, or add manually (e.g., "Array, Hash Table")
   - **Intuition/Trick**: Your solution approach, key insights, or tricks

4. **Click "Save to Notion"** and you're done! ✅

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

## API Integration Example

The extension uses the Notion API to create new pages in your database. Here's the core API call structure:

```javascript
const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
    },
    body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
            "Question Name": {
                title: [{ text: { content: questionName } }]
            },
            "Topics": {
                rich_text: [{ text: { content: topics } }]
            },
            "URL": { url: problemUrl },
            "Date Added": {
                date: { start: new Date().toISOString().split('T')[0] }
            }
        },
        children: [
            {
                object: "block",
                type: "paragraph",
                paragraph: {
                    rich_text: [{ text: { content: intuition } }]
                }
            }
        ]
    })
});
```

## Troubleshooting

### Common Issues

1. **"Notion configuration not found" error**
   - Make sure you've entered both the Integration Token and Database ID
   - Click "Test Connection" to verify your setup

2. **"Failed to save to Notion" error**
   - Check that your integration has access to the database
   - Verify the database has the correct property names (case-sensitive)
   - Ensure your integration token is valid

3. **Save button not appearing**
   - Make sure you're on a LeetCode problem page (URL contains `/problems/`)
   - Try refreshing the page
   - Check that the extension is enabled

4. **Database properties don't match**
   - Property names must be exactly: "Question Name", "Topics", "URL", "Date Added"
   - Property types must match the specification above

### Debug Tools

Open the extension popup and use these console commands in the developer tools:

```javascript
// Clear all local storage
clearLocalStorage()

// Export all saved data
exportData()
```

## Privacy & Security

- Your Notion token is stored securely in Chrome's sync storage
- All data is encrypted in transit to Notion's servers
- No data is sent to any third-party servers other than Notion
- Local backups are stored only on your device

## Contributing

Feel free to submit issues and enhancement requests! Some ideas for future improvements:

- [ ] Edit saved entries
- [ ] Bulk export/import
- [ ] Multiple database support
- [ ] Custom field mapping
- [ ] Solution code saving
- [ ] Difficulty and company tags extraction

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy coding!** 🚀 If you find this extension helpful, consider starring the repository and sharing it with fellow developers.
