// Load users from database
async function loadUsers() {
    try {
        const users = await db.getWaitingUsers();
        displayUsers(users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function getWaitTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min';
    return `${minutes} min`;
}

async function connectToUser(user) {
    const currentUser = window.currentUser;
    
    if (!currentUser) {
        alert('Please refresh the page and log in again.');
        window.location.href = '../index.html';
        return;
    }
    
    console.log('Connecting to user:', user.username);
    console.log('Current user:', currentUser.username);
    
    // Ensure socket is connected
    if (!socketDB.isConnected) {
        alert('Not connected to server. Please wait and try again.');
        return;
    }
    
    // Set up listeners FIRST
    socketDB.onRequestAccepted((chatData) => {
        console.log('Request accepted event received:', chatData);
        if (chatData.listenerId === currentUser.userId) {
            // Request was accepted!
            console.log('Match! Going to chat:', chatData.chatId);
            
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Mind Harbor', {
                    body: `${user.username} accepted! Starting chat...`,
                    icon: '💙'
                });
            }
            
            // Go to chat
            window.location.href = `chat.html?chatId=${chatData.chatId}`;
        }
    });
    
    socketDB.onRequestDeclined((declineData) => {
        console.log('Request declined:', declineData);
        if (declineData.listenerId === currentUser.userId) {
            alert(`${user.username} declined your request.`);
        }
    });
    
    // THEN send listen request to the seeker
    const requestData = {
        seekerId: user.id,
        seekerName: user.username,
        listenerId: currentUser.userId,
        listenerName: currentUser.username
    };
    
    console.log('Sending listen request:', requestData);
    socketDB.sendListenRequest(requestData);
    
    // Show waiting message
    alert(`Request sent to ${user.username}. Waiting for them to accept...`);
}

// Listen for new waiting users (real-time via Socket.io)
socketDB.onWaitingUsersUpdated((users) => {
    displayUsers(users);
});

// Load users on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.init();
        console.log('Database connected');
        await loadUsers();
    } catch (error) {
        console.error('Failed to connect:', error);
        alert('Failed to connect to server. Make sure server is running: npm start');
    }
});

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Helper function to display users
function displayUsers(users) {
    const usersGrid = document.getElementById('usersGrid');
    const noUsers = document.getElementById('noUsers');
    
    if (users.length === 0) {
        usersGrid.style.display = 'none';
        noUsers.style.display = 'block';
        return;
    }
    
    usersGrid.style.display = 'grid';
    noUsers.style.display = 'none';
    usersGrid.innerHTML = '';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        userCard.onclick = () => connectToUser(user);
        
        const waitTime = getWaitTime(user.timestamp);
        const topicHtml = user.topic 
            ? `<div class="user-topic">"${user.topic}"</div>`
            : `<div class="user-topic no-topic">No specific topic mentioned</div>`;
        
        const displayName = user.emoji ? `${user.emoji} ${user.username}` : user.username;
        
        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-id">${displayName}</div>
                <div class="waiting-badge">${waitTime}</div>
            </div>
            <div class="user-info">
                <div class="info-item">
                    <span class="info-icon">👤</span>
                    <span>${user.gender}</span>
                </div>
                <div class="info-item">
                    <span class="info-icon">📅</span>
                    <span>${user.age} years old</span>
                </div>
            </div>
            ${topicHtml}
            <button class="listen-btn">
                <span>💙</span>
                <span>Listen to ${user.username.split(/(?=[0-9])/)[0]}</span>
            </button>
        `;
        
        usersGrid.appendChild(userCard);
    });
}
