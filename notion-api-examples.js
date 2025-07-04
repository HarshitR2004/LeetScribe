// Notion API Testing Examples
// Use these examples to test your Notion integration outside of the extension

// Utility function to extract database ID from Notion database link
function extractDatabaseIdFromLink(notionLink) {
    try {
        
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
        
        throw new Error('Could not extract database ID from the provided link');
    } catch (error) {
        console.error('Error extracting database ID:', error.message);
        console.log('Expected format: https://www.notion.so/[database-id]?v=[view-id]...');
        return null;
    }
}

// Example 1: Test basic connection to your database
async function testDatabaseConnection(token, databaseId) {
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Notion-Version': '2022-06-28'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error:', error);
            return false;
        }

        const database = await response.json();
        console.log('Database found:', database.title);
        console.log('Properties:', Object.keys(database.properties));
        return true;
    } catch (error) {
        console.error('Connection failed:', error);
        return false;
    }
}

// Example 2: Create a test page in your database
async function createTestPage(token, databaseId) {
    const testData = {
        parent: {
            database_id: databaseId
        },
        properties: {
            "Question Name": {
                title: [
                    {
                        text: {
                            content: "Test Problem - Two Sum"
                        }
                    }
                ]
            },
            "Topics": {
                rich_text: [
                    {
                        text: {
                            content: "Array, Hash Table"
                        }
                    }
                ]
            },
            "URL": {
                url: "https://leetcode.com/problems/two-sum/description/"
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
                                content: "Use a hash map to store the complement of each number. For each number, check if its complement exists in the hash map. If it does, return the indices. Otherwise, add the current number and its index to the hash map."
                            }
                        }
                    ]
                }
            }
        ]
    };

    try {
        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify(testData)
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error creating page:', error);
            return false;
        }

        const result = await response.json();
        console.log('Test page created successfully:', result.url);
        return true;
    } catch (error) {
        console.error('Failed to create test page:', error);
        return false;
    }
}

// Example 3: Query pages from your database
async function queryDatabase(token, databaseId) {
    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                page_size: 10
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error querying database:', error);
            return false;
        }

        const result = await response.json();
        console.log(`Found ${result.results.length} pages in database`);
        
        result.results.forEach((page, index) => {
            const title = page.properties["Question Name"]?.title?.[0]?.text?.content || 'No title';
            const topics = page.properties["Topics"]?.rich_text?.[0]?.text?.content || 'No topics';
            console.log(`${index + 1}. ${title} - Topics: ${topics}`);
        });
        
        return true;
    } catch (error) {
        console.error('Failed to query database:', error);
        return false;
    }
}


// Required Database Schema for the extension to work:
const requiredProperties = {
    "Question Name": "title",
    "Topics": "rich_text", 
    "URL": "url",
    "Date Added": "date"
};

// Example usage with your database link:
const exampleDatabaseLink = "https://www.notion.so/your-database-id-here?v=your-view-id&source=copy_link";
const extractedId = extractDatabaseIdFromLink(exampleDatabaseLink);
console.log("Example: Extracted Database ID:", extractedId);

console.log("Required database properties:", requiredProperties);
console.log("Make sure your Notion database has these exact property names and types.");
