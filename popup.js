document.addEventListener('DOMContentLoaded', function() {
    const configForm = document.getElementById('config-form');
    const testConnectionBtn = document.getElementById('test-connection');
    const statusDiv = document.getElementById('status');

    // Utility function to extract database ID from Notion database link
    function extractDatabaseIdFromLink(notionLink) {
        try {
            // Handle different types of Notion database links
            
            // Remove the protocol and domain
            let path = notionLink.replace(/^https?:\/\/[^\/]+\//, '');
            
            // Extract the database ID (32 character hex string before ?v= or other parameters)
            const databaseIdMatch = path.match(/([a-f0-9]{32})/i);
            
            if (databaseIdMatch) {
                const rawId = databaseIdMatch[1];
                // Format as UUID with dashes: 8-4-4-4-12
                const formattedId = `${rawId.slice(0,8)}-${rawId.slice(8,12)}-${rawId.slice(12,16)}-${rawId.slice(16,20)}-${rawId.slice(20,32)}`;
                return formattedId;
            }
            
            // If it's already a formatted UUID, return as is
            const uuidMatch = notionLink.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
            if (uuidMatch) {
                return uuidMatch[1];
            }
            
            throw new Error('Could not extract database ID from the provided link');
        } catch (error) {
            console.error('Error extracting database ID:', error.message);
            return null;
        }
    }

    // Load saved configuration
    loadConfiguration();

    // Event listeners
    configForm.addEventListener('submit', handleSaveConfiguration);
    testConnectionBtn.addEventListener('click', handleTestConnection);

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

    async function handleSaveConfiguration(e) {
        e.preventDefault();
        
        const token = document.getElementById('notion-token').value.trim();
        const databaseInput = document.getElementById('database-id').value.trim();

        if (!token || !databaseInput) {
            showStatus('Please fill in both fields', 'error');
            return;
        }

        // Extract database ID from URL if it's a share link
        let databaseId;
        if (databaseInput.startsWith('http')) {
            databaseId = extractDatabaseIdFromLink(databaseInput);
            if (!databaseId) {
                showStatus('Invalid Notion database URL. Please check the format.', 'error');
                return;
            }
            showStatus(`Extracted Database ID: ${databaseId}`, 'success');
        } else {
            databaseId = databaseInput;
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
        const databaseInput = document.getElementById('database-id').value.trim();

        if (!token || !databaseInput) {
            showStatus('Please fill in both fields first', 'error');
            return;
        }

        // Extract database ID from URL if it's a share link
        let databaseId;
        if (databaseInput.startsWith('http')) {
            databaseId = extractDatabaseIdFromLink(databaseInput);
            if (!databaseId) {
                showStatus('Invalid Notion database URL. Please check the format.', 'error');
                return;
            }
        } else {
            databaseId = databaseInput;
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

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';

        // Hide after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
});
