// Background script for handling Notion API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveToNotion') {
        handleSaveToNotion(request.data)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true; // Indicates we will respond asynchronously
    }
});

async function handleSaveToNotion(data) {
    try {
        // Get Notion configuration from storage
        const config = await getNotionConfig();
        
        if (!config.token || !config.databaseId) {
            throw new Error('Notion configuration not found. Please set up Notion integration in the extension popup.');
        }

        // Prepare the data for Notion
        const notionData = {
            parent: {
                database_id: config.databaseId
            },
            properties: {
                "Question Name": {
                    title: [
                        {
                            text: {
                                content: data.questionName
                            }
                        }
                    ]
                },
                "Topics": {
                    rich_text: [
                        {
                            text: {
                                content: data.topics || ""
                            }
                        }
                    ]
                },
                "URL": {
                    url: data.url
                },
                "Date Added": {
                    date: {
                        start: new Date().toISOString().split('T')[0]
                    }
                }
            },
            children: [
                {
                    object: "block",
                    type: "heading_2",
                    heading_2: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: "Intuition/Trick"
                                }
                            }
                        ]
                    }
                },
                {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                        rich_text: [
                            {
                                type: "text",
                                text: {
                                    content: data.intuition || "No notes provided."
                                }
                            }
                        ]
                    }
                }
            ]
        };

        // Make the API call to Notion
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify(notionData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Notion API error: ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        
        // Save to local storage as backup
        await saveToLocalStorage(data);
        
        return { success: true, notionPageId: result.id };
        
    } catch (error) {
        console.error('Error saving to Notion:', error);
        
        // Save to local storage as fallback
        try {
            await saveToLocalStorage(data);
            throw new Error(`Notion save failed but saved locally: ${error.message}`);
        } catch (localError) {
            throw new Error(`Failed to save to Notion and locally: ${error.message}`);
        }
    }
}

async function getNotionConfig() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['notionToken', 'notionDatabaseId'], (result) => {
            resolve({
                token: result.notionToken,
                databaseId: result.notionDatabaseId
            });
        });
    });
}

async function saveToLocalStorage(data) {
    return new Promise((resolve, reject) => {
        const key = `leetcode_${Date.now()}`;
        const storageData = {};
        storageData[key] = {
            ...data,
            savedAt: new Date().toISOString(),
            synced: false
        };
        
        chrome.storage.local.set(storageData, () => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve();
            }
        });
    });
}

// Function to test Notion connection
async function testNotionConnection() {
    try {
        const config = await getNotionConfig();
        
        if (!config.token || !config.databaseId) {
            return { success: false, error: 'Missing token or database ID' };
        }

        const response = await fetch(`https://api.notion.com/v1/databases/${config.databaseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.message || response.statusText };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'testNotionConnection') {
        testNotionConnection()
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
