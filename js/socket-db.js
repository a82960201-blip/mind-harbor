// Socket.io Client Database - Connects to real server
class SocketDB {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentUserId = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            // Connect to server (change URL for production)
            const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : window.location.origin;
            
            this.socket = io(serverUrl);

            this.socket.on('connect', () => {
                console.log('✅ Connected to Mind Harbor server');
                this.isConnected = true;
                
                // Register current user if exists
                const userInfo = localStorage.getItem('currentUser');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    this.currentUserId = user.id;
                    this.socket.emit('register', user.id);
                }
                
                resolve();
            });

            this.socket.on('disconnect', () => {
                console.log('❌ Disconnected from server');
                this.isConnected = false;
            });

            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });
    }

    registerUser(userId) {
        this.currentUserId = userId;
        if (this.socket && this.isConnected) {
            this.socket.emit('register', userId);
        }
    }

    // Waiting Users
    async addWaitingUser(userData) {
        return new Promise((resolve) => {
            this.socket.emit('add-waiting-user', userData);
            resolve(userData);
        });
    }

    async getWaitingUsers() {
        return new Promise((resolve) => {
            this.socket.emit('get-waiting-users', (users) => {
                resolve(users);
            });
        });
    }

    async removeWaitingUser(userId) {
        this.socket.emit('remove-waiting-user', userId);
    }

    onWaitingUsersUpdated(callback) {
        this.socket.on('waiting-users-updated', callback);
    }

    // Chats
    async createChat(chatData) {
        return new Promise((resolve) => {
            this.socket.emit('create-chat', chatData, (response) => {
                resolve(response.chat);
            });
        });
    }

    async getChat(chatId) {
        return new Promise((resolve) => {
            this.socket.emit('get-chat', chatId, (chat) => {
                resolve(chat);
            });
        });
    }

    async getChatByParticipant(userId) {
        return new Promise((resolve) => {
            this.socket.emit('get-chat-by-participant', userId, (chat) => {
                resolve(chat);
            });
        });
    }

    async deleteChat(chatId) {
        this.socket.emit('end-chat', chatId);
    }

    // Messages
    async addMessage(messageData) {
        this.socket.emit('send-message', messageData);
        return messageData;
    }

    async getMessages(chatId) {
        return new Promise((resolve) => {
            this.socket.emit('get-messages', chatId, (messages) => {
                resolve(messages);
            });
        });
    }

    onNewMessage(callback) {
        this.socket.on('new-message', callback);
    }

    joinChat(chatId) {
        this.socket.emit('join-chat', chatId);
    }

    onChatEnded(callback) {
        this.socket.on('chat-ended', callback);
    }

    // Match notifications
    onMatchFound(callback) {
        this.socket.on('match-found', callback);
    }

    // Profiles
    async saveProfile(profileData) {
        return new Promise((resolve) => {
            this.socket.emit('save-profile', profileData, (response) => {
                resolve(profileData);
            });
        });
    }

    async getProfile(userId) {
        return new Promise((resolve) => {
            this.socket.emit('get-profile', userId, (profile) => {
                resolve(profile);
            });
        });
    }

    async getProfileByEmail(email) {
        return new Promise((resolve) => {
            this.socket.emit('get-profile-by-email', email, (profile) => {
                resolve(profile);
            });
        });
    }

    // Listen request system
    sendListenRequest(requestData) {
        this.socket.emit('send-listen-request', requestData);
    }

    onListenRequest(callback) {
        this.socket.on('listen-request', callback);
    }

    acceptListenRequest(acceptData, callback) {
        this.socket.emit('accept-listen-request', acceptData, callback);
    }

    onRequestAccepted(callback) {
        this.socket.on('request-accepted', callback);
    }

    declineListenRequest(declineData) {
        this.socket.emit('decline-listen-request', declineData);
    }

    onRequestDeclined(callback) {
        this.socket.on('request-declined', callback);
    }

    async deleteProfile(userId) {
        // Implement if needed
        return Promise.resolve();
    }

    // Active Listeners
    async addActiveListener(listenerData) {
        this.socket.emit('add-active-listener', listenerData);
        return listenerData;
    }

    async getActiveListeners() {
        return new Promise((resolve) => {
            this.socket.emit('get-active-listeners', (listeners) => {
                resolve(listeners);
            });
        });
    }

    async removeActiveListener(listenerId) {
        this.socket.emit('remove-active-listener', listenerId);
    }
}

// Create database instance
const socketDB = new SocketDB();

// Create wrapper with same interface as before
const db = {
    init: () => socketDB.init(),
    addWaitingUser: (userData) => socketDB.addWaitingUser(userData),
    getWaitingUsers: () => socketDB.getWaitingUsers(),
    removeWaitingUser: (userId) => socketDB.removeWaitingUser(userId),
    createChat: (chatData) => socketDB.createChat(chatData),
    getChat: (chatId) => socketDB.getChat(chatId),
    getChatByParticipant: (userId) => socketDB.getChatByParticipant(userId),
    deleteChat: (chatId) => socketDB.deleteChat(chatId),
    addMessage: (messageData) => socketDB.addMessage(messageData),
    getMessages: (chatId) => socketDB.getMessages(chatId),
    saveProfile: (profileData) => socketDB.saveProfile(profileData),
    getProfile: (userId) => socketDB.getProfile(userId),
    getProfileByEmail: (email) => socketDB.getProfileByEmail(email),
    deleteProfile: (userId) => socketDB.deleteProfile(userId),
    addActiveListener: (listenerData) => socketDB.addActiveListener(listenerData),
    getActiveListeners: () => socketDB.getActiveListeners(),
    removeActiveListener: (listenerId) => socketDB.removeActiveListener(listenerId)
};

// Export for use in other files
window.socketDB = socketDB;
window.db = db;
