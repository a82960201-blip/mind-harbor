// Group chat - single general room for everyone
const GROUP_ROOM_ID = 'general-group-chat';
let currentUserId = null;
let onlineUsers = new Set();

// Initialize group chat
async function initializeGroupChat() {
    try {
        const userInfo = window.currentUser;

        if (!userInfo || !userInfo.userId) {
            alert('Please log in first');
            window.location.href = '../index.html';
            return;
        }
        
        currentUserId = userInfo.userId;

        // Join the group room
        socketDB.socket.emit('join-group', {
            roomId: GROUP_ROOM_ID,
            userId: currentUserId,
            username: userInfo.username
        });

        // Load existing messages
        await loadGroupMessages();

        // Listen for new messages
        socketDB.socket.on('group-message', (messageData) => {
            displayMessage(messageData, true);
        });

        // Listen for user join/leave
        socketDB.socket.on('group-user-joined', (data) => {
            onlineUsers.add(data.userId);
            updateOnlineCount();
            showSystemMessage(`${data.username} joined the chat`);
        });

        socketDB.socket.on('group-user-left', (data) => {
            onlineUsers.delete(data.userId);
            updateOnlineCount();
            showSystemMessage(`${data.username} left the chat`);
        });

        // Get current online users
        socketDB.socket.on('group-online-users', (users) => {
            onlineUsers = new Set(users.map(u => u.userId));
            updateOnlineCount();
        });

        // Typing indicator
        setupTypingIndicator();

    } catch (error) {
        console.error('Error initializing group chat:', error);
        alert('Failed to load group chat. Please try again.');
    }
}

// Load group messages
async function loadGroupMessages() {
    try {
        socketDB.socket.emit('get-group-messages', GROUP_ROOM_ID, (messages) => {
            const chatMessages = document.getElementById('chatMessages');
            
            // Keep system message, clear rest
            const systemMsg = chatMessages.querySelector('.system-message');
            chatMessages.innerHTML = '';
            if (systemMsg) chatMessages.appendChild(systemMsg);

            // Display all messages
            messages.forEach(msg => displayMessage(msg, false));
            scrollToBottom();
        });
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display a message
function displayMessage(messageData, animate = true) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Handle system messages
    if (messageData.senderId === 'SYSTEM') {
        showSystemMessage(messageData.text);
        return;
    }
    
    const messageDiv = document.createElement('div');
    const isSent = messageData.senderId === currentUserId;
    messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
    
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

// Show system message
function showSystemMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const systemMsg = document.createElement('div');
    systemMsg.className = 'system-message';
    systemMsg.innerHTML = `
        <span class="system-icon">💙</span>
        <p>${text}</p>
    `;
    chatMessages.appendChild(systemMsg);
    scrollToBottom();
}

// Send message
async function sendMessage(text) {
    // Check for crisis keywords
    if (detectCrisis(text)) {
        showCrisisResources();
    }
    
    const messageData = {
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        roomId: GROUP_ROOM_ID,
        senderId: currentUserId,
        senderName: window.currentUser?.username || 'Anonymous',
        text: text,
        timestamp: Date.now()
    };
    
    // Send to server
    socketDB.socket.emit('send-group-message', messageData);
}

// Form submission
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

// Typing indicator
function setupTypingIndicator() {
    let typingTimeout = null;
    let isTyping = false;

    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        const text = this.value.trim();
        
        if (text.length > 0 && !isTyping) {
            isTyping = true;
            socketDB.socket.emit('group-user-typing', {
                roomId: GROUP_ROOM_ID,
                userId: currentUserId,
                username: window.currentUser?.username || 'Someone'
            });
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            if (isTyping) {
                isTyping = false;
                socketDB.socket.emit('group-user-stop-typing', {
                    roomId: GROUP_ROOM_ID,
                    userId: currentUserId
                });
            }
        }, 1000);
    });

    // Listen for others typing
    socketDB.socket.on('group-partner-typing', (data) => {
        if (data.userId !== currentUserId) {
            const indicator = document.getElementById('typingIndicator');
            const text = document.getElementById('typingText');
            text.textContent = `${data.username} is typing...`;
            indicator.style.display = 'flex';
        }
    });
    
    socketDB.socket.on('group-partner-stop-typing', (data) => {
        if (data.userId !== currentUserId) {
            const indicator = document.getElementById('typingIndicator');
            indicator.style.display = 'none';
        }
    });
}

// Keyboard shortcuts
document.getElementById('messageInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('messageForm').dispatchEvent(new Event('submit'));
    }
});

// Update online count
function updateOnlineCount() {
    document.getElementById('onlineCount').textContent = onlineUsers.size;
}

// Close banner
function closeBanner() {
    document.getElementById('guidelinesBanner').style.display = 'none';
}

// Utils
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Leave group on page unload
window.addEventListener('beforeunload', () => {
    if (socketDB && socketDB.socket) {
        socketDB.socket.emit('leave-group', {
            roomId: GROUP_ROOM_ID,
            userId: currentUserId
        });
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', initializeGroupChat);
