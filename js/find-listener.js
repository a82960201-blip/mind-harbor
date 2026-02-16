// Initialize database connection
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.init();
        console.log('Database connected');
    } catch (error) {
        console.error('Failed to connect to database:', error);
        alert('Failed to connect to server. Make sure server is running: npm start');
    }
});

// Ensure database is connected
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.init();
        console.log('Database ready for find-listener page');
    } catch (error) {
        console.error('Database error:', error);
    }
});

// Handle form submission
document.getElementById('userInfoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentUser = window.currentUser;
    
    if (!currentUser) {
        alert('Please refresh the page and log in again.');
        window.location.href = '../index.html';
        return;
    }
    
    const userData = {
        id: currentUser.userId,
        username: currentUser.username,
        email: currentUser.email,
        gender: formData.get('gender'),
        age: formData.get('age'),
        topic: formData.get('topic'),
        listenerPreference: formData.get('listenerPreference'),
        timestamp: Date.now(),
        status: 'waiting'
    };
    
    // Store in database
    try {
        await db.addWaitingUser(userData);
        console.log('User added to waiting list:', userData);
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Failed to add to waiting list. Please try again.');
        return;
    }
    
    // Hide form, show waiting screen
    document.getElementById('infoForm').style.display = 'none';
    document.getElementById('waitingScreen').style.display = 'block';
    document.getElementById('userAnonymousId').textContent = currentUser.username;
    
    // Listen for match
    waitForMatch(currentUser.userId);
});

function waitForMatch(userId) {
    // Register user with socket
    socketDB.registerUser(userId);
    
    // Listen for listen requests
    socketDB.onListenRequest((requestData) => {
        if (requestData.seekerId === userId) {
            // Show accept/decline notification
            showListenRequest(requestData);
        }
    });
}

function showListenRequest(requestData) {
    // Create custom notification overlay
    const overlay = document.createElement('div');
    overlay.className = 'request-overlay';
    overlay.innerHTML = `
        <div class="request-card">
            <div class="request-icon">💙</div>
            <h2>${requestData.listenerName} wants to listen to you</h2>
            <p>Do you want to talk to them?</p>
            <div class="request-buttons">
                <button class="accept-btn" onclick="acceptRequest('${requestData.listenerId}', '${requestData.listenerName}', '${requestData.seekerId}')">
                    Accept
                </button>
                <button class="decline-btn" onclick="declineRequest('${requestData.listenerId}')">
                    Decline
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // Browser notification too
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Mind Harbor', {
            body: `${requestData.listenerName} wants to listen to you`,
            icon: '💙'
        });
    }
}

async function acceptRequest(listenerId, listenerName, seekerId) {
    const currentUser = window.currentUser;
    
    // Create chat
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chatData = {
        chatId: chatId,
        userId: seekerId,
        userName: currentUser.username,
        listenerId: listenerId,
        listenerName: listenerName,
        participants: [seekerId, listenerId],
        startTime: Date.now(),
        status: 'active'
    };
    
    // Send acceptance to server
    await socketDB.acceptListenRequest({ chatData }, (response) => {
        if (response.success) {
            // Remove waiting screen overlay
            const overlay = document.querySelector('.request-overlay');
            if (overlay) overlay.remove();
            
            // Go to chat
            window.location.href = `chat.html?chatId=${chatId}`;
        }
    });
}

function declineRequest(listenerId) {
    const currentUser = window.currentUser;
    
    // Send decline
    socketDB.declineListenRequest({
        seekerId: currentUser.userId,
        listenerId: listenerId
    });
    
    // Remove overlay
    const overlay = document.querySelector('.request-overlay');
    if (overlay) overlay.remove();
    
    // Show message
    alert('Request declined. Waiting for other listeners...');
}

async function cancelSearch() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.id) {
        await db.removeWaitingUser(currentUser.id);
    }
    localStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
