document.addEventListener('DOMContentLoaded', function() {
    const configForm = document.getElementById('config-form');
    const testConnectionBtn = document.getElementById('test-connection');
    const viewBackupsBtn = document.getElementById('view-backups');
    const statusDiv = document.getElementById('status');
    const entryCountDiv = document.getElementById('entry-count');

    // Load saved configuration
    loadConfiguration();
    loadEntryCount();

    // Event listeners
    configForm.addEventListener('submit', handleSaveConfiguration);
    testConnectionBtn.addEventListener('click', handleTestConnection);
    viewBackupsBtn.addEventListener('click', handleViewBackups);

    async function loadConfiguration() {
        try {
            const result = await chrome.storage.sync.get(['notionToken', 'notionDatabaseId']);
            
            if (result.notionToken) {
                document.getElementById('notion-token').value = result.notionToken;
            }
            
            if (result.notionDatabaseId) {
                document.getElementById('database-id').value = result.notionDatabaseId;
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
        }
    }

    async function loadEntryCount() {
        try {
            const result = await chrome.storage.local.get(null);
            const leetcodeEntries = Object.keys(result).filter(key => key.startsWith('leetcode_'));
            entryCountDiv.textContent = `${leetcodeEntries.length} entries saved locally`;
        } catch (error) {
            entryCountDiv.textContent = 'Error loading entry count';
        }
    }

    async function handleSaveConfiguration(e) {
        e.preventDefault();
        
        const token = document.getElementById('notion-token').value.trim();
        const databaseId = document.getElementById('database-id').value.trim();

        if (!token || !databaseId) {
            showStatus('Please fill in both fields', 'error');
            return;
        }

        try {
            await chrome.storage.sync.set({
                notionToken: token,
                notionDatabaseId: databaseId
            });

            showStatus('Configuration saved successfully!', 'success');
        } catch (error) {
            showStatus('Error saving configuration: ' + error.message, 'error');
        }
    }

    async function handleTestConnection() {
        const token = document.getElementById('notion-token').value.trim();
        const databaseId = document.getElementById('database-id').value.trim();

        if (!token || !databaseId) {
            showStatus('Please fill in both fields first', 'error');
            return;
        }

        // Save configuration first
        try {
            await chrome.storage.sync.set({
                notionToken: token,
                notionDatabaseId: databaseId
            });
        } catch (error) {
            showStatus('Error saving configuration: ' + error.message, 'error');
            return;
        }

        // Test connection
        testConnectionBtn.disabled = true;
        testConnectionBtn.textContent = 'Testing...';

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'testNotionConnection'
            });

            if (response.success) {
                showStatus('Connection successful! ✅', 'success');
            } else {
                showStatus('Connection failed: ' + response.error, 'error');
            }
        } catch (error) {
            showStatus('Error testing connection: ' + error.message, 'error');
        } finally {
            testConnectionBtn.disabled = false;
            testConnectionBtn.textContent = 'Test Connection';
        }
    }

    async function handleViewBackups() {
        try {
            const result = await chrome.storage.local.get(null);
            const leetcodeEntries = Object.entries(result)
                .filter(([key]) => key.startsWith('leetcode_'))
                .map(([key, value]) => ({ key, ...value }))
                .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

            if (leetcodeEntries.length === 0) {
                showStatus('No saved entries found', 'error');
                return;
            }

            // Create a simple display of entries
            let entriesText = 'Saved Entries:\n\n';
            leetcodeEntries.forEach((entry, index) => {
                entriesText += `${index + 1}. ${entry.questionName}\n`;
                entriesText += `   Topics: ${entry.topics || 'None'}\n`;
                entriesText += `   URL: ${entry.url}\n`;
                entriesText += `   Saved: ${new Date(entry.savedAt).toLocaleDateString()}\n`;
                entriesText += `   Synced: ${entry.synced ? 'Yes' : 'No'}\n\n`;
            });

            // Open in new tab or show in alert
            const blob = new Blob([entriesText], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            // Try to open in new tab
            chrome.tabs.create({ url: url });
            
        } catch (error) {
            showStatus('Error loading backups: ' + error.message, 'error');
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';

        // Hide after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }

    // Function to clear all local storage (for debugging)
    window.clearLocalStorage = async function() {
        if (confirm('Are you sure you want to clear all local storage? This cannot be undone.')) {
            await chrome.storage.local.clear();
            loadEntryCount();
            showStatus('Local storage cleared', 'success');
        }
    };

    // Function to export all data
    window.exportData = async function() {
        try {
            const result = await chrome.storage.local.get(null);
            const leetcodeEntries = Object.entries(result)
                .filter(([key]) => key.startsWith('leetcode_'))
                .map(([key, value]) => ({ key, ...value }));

            const dataStr = JSON.stringify(leetcodeEntries, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `leetcode-notes-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showStatus('Data exported successfully!', 'success');
        } catch (error) {
            showStatus('Error exporting data: ' + error.message, 'error');
        }
    };
});
