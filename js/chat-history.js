// Load user's chat history
async function loadChatHistory() {
    const currentUser = window.currentUser;
    
    if (!currentUser) {
        alert('Please log in first');
        window.location.href = '../index.html';
        return;
    }
    
    try {
        // Get all chats from server where user is a participant
        const allChats = await getAllUserChats(currentUser.userId);
        
        const chatsContainer = document.getElementById('chatsContainer');
        const noChats = document.getElementById('noChats');
        
        if (!allChats || allChats.length === 0) {
            chatsContainer.style.display = 'none';
            noChats.style.display = 'block';
            return;
        }
        
        chatsContainer.style.display = 'flex';
        noChats.style.display = 'none';
        chatsContainer.innerHTML = '';
        
        // Sort by most recent
        allChats.sort((a, b) => b.startTime - a.startTime);
        
        allChats.forEach(chat => {
            const chatCard = createChatCard(chat, currentUser);
            chatsContainer.appendChild(chatCard);
        });
        
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

async function getAllUserChats(userId) {
    // This would normally be a server call
    // For now, we'll use a workaround to get chats from database
    return new Promise((resolve) => {
        // Request all chats where user is participant
        socketDB.socket.emit('get-user-chats', userId, (chats) => {
            resolve(chats || []);
        });
    });
}

function createChatCard(chat, currentUser) {
    const card = document.createElement('div');
    card.className = 'chat-card';
    
    // Determine partner info
    const isListener = chat.listenerId === currentUser.userId;
    const partnerName = isListener ? chat.userName : chat.listenerName;
    const partnerId = isListener ? chat.userId : chat.listenerId;
    
    // Format time
    const timeAgo = getTimeAgo(chat.startTime);
    
    card.innerHTML = `
        <div class="chat-avatar">💬</div>
        <div class="chat-info">
            <div class="chat-name">${partnerName}</div>
            <div class="chat-preview">Chat started ${timeAgo}</div>
            <div class="chat-time">${new Date(chat.startTime).toLocaleString()}</div>
        </div>
    `;
    
    // Click to open chat - always allow access
    card.onclick = () => {
        window.location.href = `chat.html?chatId=${chat.chatId}`;
    };
    
    return card;
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Load on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.init();
        await loadChatHistory();
    } catch (error) {
        console.error('Error:', error);
    }
});
