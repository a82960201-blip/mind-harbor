// Get chat ID from URL
const urlParams = new URLSearchParams(window.location.search);
const chatId = urlParams.get('chatId');

if (!chatId) {
    alert('No chat session found');
    window.location.href = '../index.html';
}

let currentChat = null;
let currentUserId = null;
let currentUserRole = null;
let partnerId = null;
let messageCheckInterval = null;

// Initialize chat
async function initializeChat() {
    try {
        // Get current user info from window (set by HTML script)
        const userInfo = window.currentUser;

        if (!userInfo || !userInfo.userId) {
            alert('Session expired. Please start over.');
            window.location.href = '../index.html';
            return;
        }
        
        currentUserId = userInfo.userId;
        currentUserRole = userInfo.role || 'user';

        // Load chat data
        currentChat = await db.getChat(chatId);
        
        if (!currentChat) {
            alert('Chat not found');
            window.location.href = '../index.html';
            return;
        }

        // Determine partner
        partnerId = currentChat.participants.find(p => p !== currentUserId);
        
        // Get partner name from chat data
        let partnerName = partnerId;
        let partnerEmoji = '👤';
        
        // Figure out if we're the seeker or listener
        if (currentUserId === currentChat.listenerId) {
            // We are the listener
            partnerName = currentChat.userName || partnerId;
            partnerEmoji = '👤';
        } else {
            // We are the seeker
            partnerName = currentChat.listenerName || partnerId;
            partnerEmoji = '💙';
        }
        
        document.getElementById('chatPartner').textContent = `${partnerEmoji} ${partnerName}`;

        // Load existing messages
        await loadMessages();

        // Join chat room for real-time updates
        socketDB.joinChat(chatId);

        // Listen for new messages (REAL-TIME via Socket.io)
        socketDB.onNewMessage((messageData) => {
            if (messageData.chatId === chatId && messageData.senderId !== currentUserId) {
                displayMessage(messageData, true);
                
                // Show notification if not focused
                if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                    new Notification(`New message from ${messageData.senderName}`, {
                        body: messageData.text.substring(0, 50) + (messageData.text.length > 50 ? '...' : ''),
                        icon: '💬'
                    });
                }
            }
        });

        // Listen for chat ended
        socketDB.onChatEnded((endedChatId) => {
            if (endedChatId === chatId) {
                // Show system message that partner ended chat
                const chatMessages = document.getElementById('chatMessages');
                const systemMsg = document.createElement('div');
                systemMsg.className = 'system-message';
                systemMsg.innerHTML = `
                    <span class="system-icon">👋</span>
                    <p>The other person has ended the chat. You can still view the messages.</p>
                `;
                chatMessages.appendChild(systemMsg);
                scrollToBottom();
                
                // Disable message input
                const messageInput = document.getElementById('messageInput');
                const sendBtn = document.getElementById('sendBtn');
                messageInput.disabled = true;
                messageInput.placeholder = 'This chat has ended';
                sendBtn.disabled = true;
                sendBtn.style.opacity = '0.5';
                sendBtn.style.cursor = 'not-allowed';
            }
        });

        // Auto-scroll to bottom
        scrollToBottom();

    } catch (error) {
        console.error('Error initializing chat:', error);
        alert('Failed to load chat. Please try again.');
        window.location.href = '../index.html';
    }
}

// Load all messages for this chat
async function loadMessages() {
    try {
        const messages = await db.getMessages(chatId);
        const chatMessages = document.getElementById('chatMessages');
        
        // Clear existing messages except system message
        const systemMessages = chatMessages.querySelectorAll('.system-message');
        chatMessages.innerHTML = '';
        systemMessages.forEach(msg => chatMessages.appendChild(msg));

        // Add all messages
        messages.sort((a, b) => a.timestamp - b.timestamp);
        messages.forEach(msg => {
            displayMessage(msg, false);
        });

        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display a message in the chat
function displayMessage(messageData, animate = true) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Handle system messages
    if (messageData.senderId === 'SYSTEM') {
        const systemMsg = document.createElement('div');
        systemMsg.className = 'system-message';
        systemMsg.innerHTML = `
            <span class="system-icon">⚠️</span>
            <p>${messageData.text}</p>
        `;
        chatMessages.appendChild(systemMsg);
        scrollToBottom();
        return;
    }
    
    const messageDiv = document.createElement('div');
    const isSent = messageData.senderId === currentUserId;
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    messageDiv.dataset.messageId = messageData.messageId;
    messageDiv.dataset.timestamp = messageData.timestamp;
    if (animate) {
        messageDiv.style.opacity = '0';
    }
    
    const time = new Date(messageData.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${isSent ? '🙂' : '👤'}</div>
        <div class="message-content">
            <div class="message-sender">${isSent ? 'You' : messageData.senderName}</div>
            <div class="message-text">${escapeHtml(messageData.text)}</div>
            <div class="message-time">${time}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    
    if (animate) {
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transition = 'opacity 0.3s';
        }, 10);
    }
    
    scrollToBottom();
}

// Start listening for new messages
function startMessageListener() {
    // Listen via BroadcastChannel
    channel.on('new-message', (messageData) => {
        if (messageData.chatId === chatId && messageData.senderId !== currentUserId) {
            displayMessage(messageData);
            
            // Show notification if not focused
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                new Notification(`New message from ${messageData.senderName}`, {
                    body: messageData.text.substring(0, 50) + (messageData.text.length > 50 ? '...' : ''),
                    icon: '💬'
                });
            }
        }
    });

    // Also poll database every 2 seconds as fallback
    messageCheckInterval = setInterval(async () => {
        try {
            const messages = await db.getMessages(chatId);
            
            // Check if there are new messages
            if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const displayedMessages = document.querySelectorAll('.message:not(.system-message)');
                
                // If we have fewer displayed messages than in database, reload
                if (displayedMessages.length < messages.length) {
                    // Find and display only new messages
                    const lastDisplayedId = displayedMessages.length > 0 ? 
                        displayedMessages[displayedMessages.length - 1].dataset.messageId : null;
                    
                    let foundLast = !lastDisplayedId;
                    messages.forEach(msg => {
                        if (foundLast && msg.senderId !== currentUserId) {
                            displayMessage(msg, true);
                        }
                        if (msg.messageId === lastDisplayedId) {
                            foundLast = true;
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error checking for new messages:', error);
        }
    }, 1000); // Check every 1 second for real-time feel
}

// Send message
async function sendMessage(text) {
    if (!text.trim()) return;

    // Check for crisis keywords
    if (typeof detectCrisis !== 'undefined' && detectCrisis(text)) {
        showCrisisResources();
    }

    const messageData = {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chatId: chatId,
        senderId: currentUserId,
        senderName: currentUserId,
        text: text.trim(),
        timestamp: Date.now()
    };

    try {
        // Save to database
        await db.addMessage(messageData);
        
        // Display in current chat
        displayMessage(messageData);
        
        // Notify other participant
        channel.notifyNewMessage(messageData);
        
    } catch (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
    }
}

// Handle form submission
document.getElementById('messageForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (message) {
        await sendMessage(message);
        messageInput.value = '';
        messageInput.style.height = 'auto';
    }
});

// Auto-resize textarea and handle typing indicator
let typingTimeout = null;
let isTyping = false;

const messageInput = document.getElementById('messageInput');
messageInput.addEventListener('input', function() {
    // Auto-resize
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
    
    // Typing indicator
    const text = this.value.trim();
    
    if (text.length > 0 && !isTyping) {
        isTyping = true;
        // Emit typing event
        if (socketDB && socketDB.socket) {
            socketDB.socket.emit('user-typing', {
                chatId: chatId,
                userId: currentUserId,
                username: window.currentUser?.username || 'Someone'
            });
        }
    }
    
    // Reset timeout
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        if (isTyping) {
            isTyping = false;
            // Emit stop typing
            if (socketDB && socketDB.socket) {
                socketDB.socket.emit('user-stop-typing', {
                    chatId: chatId,
                    userId: currentUserId
                });
            }
        }
    }, 1000);
});

// Listen for partner typing
if (socketDB && socketDB.socket) {
    socketDB.socket.on('partner-typing', (data) => {
        if (data.chatId === chatId && data.userId !== currentUserId) {
            const indicator = document.getElementById('typingIndicator');
            const text = document.getElementById('typingText');
            text.textContent = `${data.username} is typing...`;
            indicator.style.display = 'flex';
        }
    });
    
    socketDB.socket.on('partner-stop-typing', (data) => {
        if (data.chatId === chatId && data.userId !== currentUserId) {
            const indicator = document.getElementById('typingIndicator');
            indicator.style.display = 'none';
        }
    });
}

// Allow Enter to send, Shift+Enter for new line
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('messageForm').dispatchEvent(new Event('submit'));
    }
});

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Scroll to bottom
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show guidelines modal
function showGuidelines() {
    document.getElementById('guidelinesModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('guidelinesModal').style.display = 'none';
}

// Close guidelines banner
function closeBanner() {
    document.getElementById('guidelinesBanner').style.display = 'none';
}

// Report user
async function reportUser() {
    const confirmed = confirm(`Report ${partnerId}?\n\nIf this user is violating community guidelines, they will be reviewed by our team.`);
    if (confirmed) {
        // In a real app, this would send to moderation system
        const reportData = {
            reportId: `report_${Date.now()}`,
            chatId: chatId,
            reportedUser: partnerId,
            reportedBy: currentUserId,
            timestamp: Date.now()
        };
        
        // Store in localStorage for demo
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        reports.push(reportData);
        localStorage.setItem('reports', JSON.stringify(reports));
        
        alert('Thank you for your report. Our team will review this conversation.');
    }
}

// End chat
async function endChat() {
    const confirmed = confirm('Are you sure you want to end this chat?');
    if (confirmed) {
        try {
            // Clear interval
            if (messageCheckInterval) {
                clearInterval(messageCheckInterval);
            }
            
            // Track stats if listener
            if (currentUserRole === 'listener') {
                const chatEndData = {
                    chatId: chatId,
                    startTime: currentChat.startTime,
                    endTime: Date.now()
                };
                localStorage.setItem('lastChatEnded', JSON.stringify(chatEndData));
            }
            
            // Notify partner
            channel.notifyChatEnded(chatId);
            
            // Delete chat from database
            await db.deleteChat(chatId);
            
            // Clear current user
            localStorage.removeItem('currentUser');
            
            // Show thank you message
            const chatMessages = document.getElementById('chatMessages');
            const systemMsg = document.createElement('div');
            systemMsg.className = 'system-message';
            systemMsg.innerHTML = `
                <span class="system-icon">👋</span>
                <p>Chat ended. Thank you for being part of Mind Harbor.</p>
            `;
            chatMessages.appendChild(systemMsg);
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        } catch (error) {
            console.error('Error ending chat:', error);
            window.location.href = '../index.html';
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeChat);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    // Socket.io handles cleanup automatically
});

// Inactivity Detection
let lastActivity = Date.now();
let inactivityWarningShown = false;
const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function resetActivityTimer() {
    lastActivity = Date.now();
    inactivityWarningShown = false;
}

// Reset on any user activity
document.addEventListener('keydown', resetActivityTimer);
document.addEventListener('click', resetActivityTimer);
document.addEventListener('touchstart', resetActivityTimer);

// Check for inactivity every minute
setInterval(() => {
    const timeSinceActivity = Date.now() - lastActivity;
    
    if (timeSinceActivity > INACTIVITY_TIMEOUT && !inactivityWarningShown) {
        inactivityWarningShown = true;
        
        // Show system message
        const chatMessages = document.getElementById('chatMessages');
        const systemMsg = document.createElement('div');
        systemMsg.className = 'system-message';
        systemMsg.innerHTML = `
            <span class="system-icon">⏰</span>
            <p>You seem to be inactive. The other person may think you've left.</p>
        `;
        chatMessages.appendChild(systemMsg);
        scrollToBottom();
    }
}, 60000); // Check every minute

// Rate Limiting
const messageTimestamps = [];
const MAX_MESSAGES = 5;
const TIME_WINDOW = 5000; // 5 seconds

function isRateLimited() {
    const now = Date.now();
    
    // Remove old timestamps
    while (messageTimestamps.length > 0 && now - messageTimestamps[0] > TIME_WINDOW) {
        messageTimestamps.shift();
    }
    
    // Check if limit exceeded
    if (messageTimestamps.length >= MAX_MESSAGES) {
        alert('Please slow down. You can send up to 5 messages every 5 seconds.');
        return true;
    }
    
    messageTimestamps.push(now);
    return false;
}

// Add to sendMessage check
const originalFormHandler = document.getElementById('messageForm').onsubmit;
document.getElementById('messageForm').addEventListener('submit', function(e) {
    if (isRateLimited()) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}, true);
