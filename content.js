// Content script that runs on LeetCode problem pages
(function() {
    'use strict';

    // Check if we're on a LeetCode problem page
    if (!window.location.href.includes('leetcode.com/problems/')) {
        return;
    }

    let saveButton = null;
    let modal = null;

    // Function to extract question name from the page
    function getQuestionName() {
        // Try multiple selectors for question title
        const selectors = [
            '[data-cy="question-title"]',
            'h1',
            '.css-v3d350',
            '.question-title'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                return element.textContent.trim();
            }
        }
        
        // Fallback to URL parsing
        const urlParts = window.location.pathname.split('/');
        const problemSlug = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
        return problemSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // Function to extract topics/tags from the page
    function getTopics() {
        const topics = [];
        
        // Try to find tags/topics on the page
        const tagSelectors = [
            '[class*="tag"]',
            '[class*="topic"]',
            '.topic-tag',
            '.difficulty-tag'
        ];
        
        tagSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const text = el.textContent.trim();
                if (text && text.length < 50 && !topics.includes(text)) {
                    topics.push(text);
                }
            });
        });
        
        return topics.join(', ');
    }

    // Create floating save button
    function createSaveButton() {
        if (saveButton) return;

        saveButton = document.createElement('div');
        saveButton.id = 'leetcode-notion-save-btn';
        saveButton.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 7L10 16L5 11" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Save to Notion
        `;
        
        saveButton.addEventListener('click', showModal);
        document.body.appendChild(saveButton);
    }

    // Create modal for input
    function createModal() {
        if (modal) return;

        modal = document.createElement('div');
        modal.id = 'leetcode-notion-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Save to Notion</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="notion-save-form">
                        <div class="form-group">
                            <label for="question-name">Question Name:</label>
                            <input type="text" id="question-name" name="questionName" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="topics">Topics (comma-separated):</label>
                            <input type="text" id="topics" name="topics" placeholder="Array, Dynamic Programming, etc.">
                        </div>
                        
                        <div class="form-group">
                            <label for="intuition">Intuition/Trick behind the solution:</label>
                            <textarea id="intuition" name="intuition" rows="6" placeholder="Describe your approach, key insights, or tricks used..."></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-cancel">Cancel</button>
                            <button type="submit" class="btn-save">Save to Notion</button>
                        </div>
                    </form>
                    
                    <div id="save-status" class="save-status hidden"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.modal-close').addEventListener('click', hideModal);
        modal.querySelector('.btn-cancel').addEventListener('click', hideModal);
        modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                hideModal();
            }
        });
        
        modal.querySelector('#notion-save-form').addEventListener('submit', handleSave);
    }

    // Show modal with pre-filled data
    function showModal() {
        if (!modal) createModal();
        
        // Pre-fill the form
        const questionName = getQuestionName();
        const topics = getTopics();
        
        modal.querySelector('#question-name').value = questionName;
        modal.querySelector('#topics').value = topics;
        modal.querySelector('#intuition').value = '';
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Focus on the intuition field
        setTimeout(() => {
            modal.querySelector('#intuition').focus();
        }, 100);
    }

    // Hide modal
    function hideModal() {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            
            // Clear status
            const status = modal.querySelector('#save-status');
            status.classList.add('hidden');
            status.textContent = '';
        }
    }

    // Handle form submission
    async function handleSave(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const saveButton = form.querySelector('.btn-save');
        const status = modal.querySelector('#save-status');
        
        // Disable save button and show loading
        saveButton.disabled = true;
        saveButton.textContent = 'Saving...';
        
        const data = {
            questionName: formData.get('questionName'),
            topics: formData.get('topics'),
            intuition: formData.get('intuition'),
            url: window.location.href,
            timestamp: new Date().toISOString()
        };

        try {
            // Send data to background script
            const response = await chrome.runtime.sendMessage({
                action: 'saveToNotion',
                data: data
            });

            if (response.success) {
                status.textContent = 'Saved successfully to Notion!';
                status.className = 'save-status success';
                status.classList.remove('hidden');
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    hideModal();
                }, 2000);
            } else {
                throw new Error(response.error || 'Failed to save to Notion');
            }
        } catch (error) {
            console.error('Error saving to Notion:', error);
            status.textContent = 'Error: ' + error.message;
            status.className = 'save-status error';
            status.classList.remove('hidden');
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = 'Save to Notion';
        }
    }

    // Initialize the extension
    function init() {
        // Wait for the page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Create the save button and modal
        createSaveButton();
        createModal();
    }

    // Start the extension
    init();

    // Handle page navigation (for SPA)
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            if (currentUrl.includes('leetcode.com/problems/')) {
                setTimeout(init, 1000); // Delay to let content load
            }
        }
    }, 1000);

})();
