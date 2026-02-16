const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// In-memory database (for demo - use MongoDB/PostgreSQL for production)
const database = {
    waitingUsers: [],
    activeChats: [],
    messages: {},
    profiles: {},
    activeListeners: []
};

// Socket.io connections
const connectedUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User registers their ID
    socket.on('register', (userId) => {
        connectedUsers.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // User adds themselves to waiting queue
    socket.on('add-waiting-user', (userData) => {
        database.waitingUsers.push(userData);
        console.log('New waiting user:', userData.username);
        
        // Notify all listeners
        io.emit('waiting-users-updated', database.waitingUsers);
    });

    // Get all waiting users
    socket.on('get-waiting-users', (callback) => {
        callback(database.waitingUsers);
    });

    // Remove from waiting queue
    socket.on('remove-waiting-user', (userId) => {
        database.waitingUsers = database.waitingUsers.filter(u => u.id !== userId);
        io.emit('waiting-users-updated', database.waitingUsers);
    });

    // Create chat
    socket.on('create-chat', (chatData, callback) => {
        database.activeChats.push(chatData);
        database.messages[chatData.chatId] = [];
        
        // Remove user from waiting
        database.waitingUsers = database.waitingUsers.filter(u => u.id !== chatData.userId);
        
        // Notify both participants
        const seekerSocket = connectedUsers.get(chatData.userId);
        const listenerSocket = connectedUsers.get(chatData.listenerId);
        
        if (seekerSocket) {
            io.to(seekerSocket).emit('match-found', chatData);
        }
        if (listenerSocket) {
            io.to(listenerSocket).emit('match-found', chatData);
        }
        
        // Update waiting users list for all listeners
        io.emit('waiting-users-updated', database.waitingUsers);
        
        callback({ success: true, chat: chatData });
    });

    // Get chat by ID
    socket.on('get-chat', (chatId, callback) => {
        const chat = database.activeChats.find(c => c.chatId === chatId);
        callback(chat);
    });

    // Get chat by participant
    socket.on('get-chat-by-participant', (userId, callback) => {
        const chat = database.activeChats.find(c => c.participants.includes(userId));
        callback(chat);
    });

    // Send message
    socket.on('send-message', (messageData) => {
        if (!database.messages[messageData.chatId]) {
            database.messages[messageData.chatId] = [];
        }
        
        database.messages[messageData.chatId].push(messageData);
        
        // Emit to chat room
        io.to(messageData.chatId).emit('new-message', messageData);
    });

    // Get messages for chat
    socket.on('get-messages', (chatId, callback) => {
        const messages = database.messages[chatId] || [];
        callback(messages);
    });

    // Join chat room
    socket.on('join-chat', (chatId) => {
        socket.join(chatId);
        console.log(`Socket ${socket.id} joined chat ${chatId}`);
    });

    // End chat
    socket.on('end-chat', (chatId) => {
        database.activeChats = database.activeChats.filter(c => c.chatId !== chatId);
        delete database.messages[chatId];
        
        // Notify chat room
        io.to(chatId).emit('chat-ended', chatId);
    });

    // Save profile
    socket.on('save-profile', (profileData, callback) => {
        database.profiles[profileData.userId] = profileData;
        callback({ success: true });
    });

    // Get profile
    socket.on('get-profile', (userId, callback) => {
        const profile = database.profiles[userId];
        callback(profile);
    });

    // Get profile by email
    socket.on('get-profile-by-email', (email, callback) => {
        const profile = Object.values(database.profiles).find(p => p.email === email);
        callback(profile);
    });

    // Listen request (with accept/decline)
    socket.on('send-listen-request', (requestData) => {
        // requestData = { seekerId, listenerId, listenerName }
        const seekerSocket = connectedUsers.get(requestData.seekerId);
        
        if (seekerSocket) {
            io.to(seekerSocket).emit('listen-request', requestData);
        }
    });

    // Accept listen request
    socket.on('accept-listen-request', (acceptData, callback) => {
        // Create chat
        const chatData = acceptData.chatData;
        database.activeChats.push(chatData);
        database.messages[chatData.chatId] = [];
        
        // Remove from waiting
        database.waitingUsers = database.waitingUsers.filter(u => u.id !== chatData.userId);
        
        // Notify both users
        const seekerSocket = connectedUsers.get(chatData.userId);
        const listenerSocket = connectedUsers.get(chatData.listenerId);
        
        if (seekerSocket) {
            io.to(seekerSocket).emit('request-accepted', chatData);
        }
        if (listenerSocket) {
            io.to(listenerSocket).emit('request-accepted', chatData);
        }
        
        // Update waiting list
        io.emit('waiting-users-updated', database.waitingUsers);
        
        callback({ success: true });
    });

    // Decline listen request
    socket.on('decline-listen-request', (declineData) => {
        const listenerSocket = connectedUsers.get(declineData.listenerId);
        
        if (listenerSocket) {
            io.to(listenerSocket).emit('request-declined', declineData);
        }
    });

    // Add active listener
    socket.on('add-active-listener', (listenerData) => {
        const existing = database.activeListeners.findIndex(l => l.id === listenerData.id);
        if (existing >= 0) {
            database.activeListeners[existing] = listenerData;
        } else {
            database.activeListeners.push(listenerData);
        }
        io.emit('active-listeners-updated', database.activeListeners);
    });

    // Remove active listener
    socket.on('remove-active-listener', (listenerId) => {
        database.activeListeners = database.activeListeners.filter(l => l.id !== listenerId);
        io.emit('active-listeners-updated', database.activeListeners);
    });

    // Get active listeners
    socket.on('get-active-listeners', (callback) => {
        callback(database.activeListeners);
    });

    // Get user's chat history
    socket.on('get-user-chats', (userId, callback) => {
        const userChats = database.activeChats.filter(chat => 
            chat.participants.includes(userId)
        );
        callback(userChats);
    });

    // Typing indicator
    socket.on('user-typing', (data) => {
        // Broadcast to chat room
        socket.to(data.chatId).emit('partner-typing', data);
    });

    socket.on('user-stop-typing', (data) => {
        // Broadcast to chat room
        socket.to(data.chatId).emit('partner-stop-typing', data);
    });

    // GROUP CHAT HANDLERS
    const groupRooms = {}; // roomId -> {users: Set, messages: []}

    socket.on('join-group', (data) => {
        const { roomId, userId, username } = data;
        
        // Initialize room if doesn't exist
        if (!groupRooms[roomId]) {
            groupRooms[roomId] = {
                users: new Map(),
                messages: []
            };
        }
        
        // Join socket.io room
        socket.join(roomId);
        
        // Add user to room
        groupRooms[roomId].users.set(userId, { userId, username, socketId: socket.id });
        
        console.log(`${username} joined group ${roomId}`);
        
        // Notify everyone in room
        io.to(roomId).emit('group-user-joined', { userId, username });
        
        // Send current online users to joiner
        const onlineUsers = Array.from(groupRooms[roomId].users.values());
        socket.emit('group-online-users', onlineUsers);
    });

    socket.on('leave-group', (data) => {
        const { roomId, userId } = data;
        
        if (groupRooms[roomId] && groupRooms[roomId].users.has(userId)) {
            const user = groupRooms[roomId].users.get(userId);
            groupRooms[roomId].users.delete(userId);
            socket.leave(roomId);
            
            // Notify others
            io.to(roomId).emit('group-user-left', { userId, username: user.username });
            
            console.log(`${user.username} left group ${roomId}`);
        }
    });

    socket.on('send-group-message', (messageData) => {
        const { roomId } = messageData;
        
        if (groupRooms[roomId]) {
            // Store message
            groupRooms[roomId].messages.push(messageData);
            
            // Keep last 200 messages only
            if (groupRooms[roomId].messages.length > 200) {
                groupRooms[roomId].messages.shift();
            }
            
            // Broadcast to everyone in room
            io.to(roomId).emit('group-message', messageData);
        }
    });

    socket.on('get-group-messages', (roomId, callback) => {
        if (groupRooms[roomId]) {
            callback(groupRooms[roomId].messages);
        } else {
            callback([]);
        }
    });

    socket.on('group-user-typing', (data) => {
        socket.to(data.roomId).emit('group-partner-typing', data);
    });

    socket.on('group-user-stop-typing', (data) => {
        socket.to(data.roomId).emit('group-partner-stop-typing', data);
    });

    // REPORT SYSTEM
    socket.on('submit-report', (reportData) => {
        // Store report (in production, save to database)
        console.log('Report received:', reportData);
        
        // In production, you would:
        // 1. Save to database
        // 2. Notify moderators
        // 3. Flag user if multiple reports
        // 4. Take automated action if severe
        
        // For now, just log and acknowledge
        socket.emit('report-submitted', { success: true });
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove from connected users
        for (const [userId, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                connectedUsers.delete(userId);
                break;
            }
        }
    });
});

// REST API endpoints (optional - for non-socket operations)
app.get('/api/waiting-users', (req, res) => {
    res.json(database.waitingUsers);
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        waitingUsers: database.waitingUsers.length,
        activeChats: database.activeChats.length,
        connectedSockets: io.engine.clientsCount
    });
});

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🌊 Mind Harbor server running on port ${PORT}`);
    console.log(`📡 Socket.io ready for connections`);
    console.log(`🌐 Visit http://localhost:${PORT}`);
});

// Cleanup old data every 5 minutes
setInterval(() => {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes
    
    // Remove old waiting users
    database.waitingUsers = database.waitingUsers.filter(u => 
        (now - u.timestamp) < maxAge
    );
    
    console.log('Cleanup completed. Active users:', database.waitingUsers.length);
}, 5 * 60 * 1000);
