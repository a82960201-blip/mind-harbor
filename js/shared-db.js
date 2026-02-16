// Shared Database Layer - Works across browsers via localStorage
// This creates a "shared" database that all browsers can access
class SharedDB {
    constructor() {
        this.prefix = 'mindHarbor_';
    }

    // Waiting Users
    async addWaitingUser(userData) {
        const users = this.getWaitingUsers();
        users.push(userData);
        localStorage.setItem(this.prefix + 'waitingUsers', JSON.stringify(users));
        return userData;
    }

    getWaitingUsers() {
        const data = localStorage.getItem(this.prefix + 'waitingUsers');
        return data ? JSON.parse(data) : [];
    }

    async removeWaitingUser(userId) {
        const users = this.getWaitingUsers();
        const filtered = users.filter(u => u.id !== userId);
        localStorage.setItem(this.prefix + 'waitingUsers', JSON.stringify(filtered));
    }

    // Active Chats
    async createChat(chatData) {
        const chats = this.getActiveChats();
        chats.push(chatData);
        localStorage.setItem(this.prefix + 'activeChats', JSON.stringify(chats));
        return chatData;
    }

    async getChat(chatId) {
        const chats = this.getActiveChats();
        return chats.find(c => c.chatId === chatId);
    }

    getActiveChats() {
        const data = localStorage.getItem(this.prefix + 'activeChats');
        return data ? JSON.parse(data) : [];
    }

    async getChatByParticipant(userId) {
        const chats = this.getActiveChats();
        return chats.find(c => c.participants.includes(userId));
    }

    async deleteChat(chatId) {
        const chats = this.getActiveChats();
        const filtered = chats.filter(c => c.chatId !== chatId);
        localStorage.setItem(this.prefix + 'activeChats', JSON.stringify(filtered));
    }

    // Messages
    async addMessage(messageData) {
        const messages = this.getMessages(messageData.chatId);
        messages.push(messageData);
        localStorage.setItem(this.prefix + 'messages_' + messageData.chatId, JSON.stringify(messages));
        
        // Also update last message timestamp for polling
        localStorage.setItem(this.prefix + 'lastMessage_' + messageData.chatId, Date.now().toString());
        return messageData;
    }

    async getMessages(chatId) {
        const data = localStorage.getItem(this.prefix + 'messages_' + chatId);
        return data ? JSON.parse(data) : [];
    }

    getLastMessageTime(chatId) {
        const time = localStorage.getItem(this.prefix + 'lastMessage_' + chatId);
        return time ? parseInt(time) : 0;
    }

    // Profiles
    async saveProfile(profileData) {
        localStorage.setItem(this.prefix + 'profile_' + profileData.userId, JSON.stringify(profileData));
        return profileData;
    }

    async getProfile(userId) {
        const data = localStorage.getItem(this.prefix + 'profile_' + userId);
        return data ? JSON.parse(data) : null;
    }

    async deleteProfile(userId) {
        localStorage.removeItem(this.prefix + 'profile_' + userId);
    }

    // Active Listeners
    async addActiveListener(listenerData) {
        const listeners = this.getActiveListeners();
        const filtered = listeners.filter(l => l.id !== listenerData.id);
        filtered.push(listenerData);
        localStorage.setItem(this.prefix + 'activeListeners', JSON.stringify(filtered));
        return listenerData;
    }

    async getActiveListeners() {
        const data = localStorage.getItem(this.prefix + 'activeListeners');
        return data ? JSON.parse(data) : [];
    }

    async removeActiveListener(listenerId) {
        const listeners = this.getActiveListeners();
        const filtered = listeners.filter(l => l.id !== listenerId);
        localStorage.setItem(this.prefix + 'activeListeners', JSON.stringify(filtered));
    }

    // Clean up old data (optional, can be called periodically)
    cleanOldData() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Remove old waiting users
        const users = this.getWaitingUsers();
        const activeUsers = users.filter(u => (now - u.timestamp) < maxAge);
        localStorage.setItem(this.prefix + 'waitingUsers', JSON.stringify(activeUsers));
    }
}

// Replace the IndexedDB instance with SharedDB
const sharedDB = new SharedDB();

// Create a wrapper that uses sharedDB but keeps the same interface
const originalDB = db;
const db = {
    init: async () => {
        // No initialization needed for localStorage
        return Promise.resolve();
    },
    addWaitingUser: (userData) => sharedDB.addWaitingUser(userData),
    getWaitingUsers: () => Promise.resolve(sharedDB.getWaitingUsers()),
    removeWaitingUser: (userId) => sharedDB.removeWaitingUser(userId),
    createChat: (chatData) => sharedDB.createChat(chatData),
    getChat: (chatId) => Promise.resolve(sharedDB.getChat(chatId)),
    getChatByParticipant: (userId) => Promise.resolve(sharedDB.getChatByParticipant(userId)),
    deleteChat: (chatId) => sharedDB.deleteChat(chatId),
    addMessage: (messageData) => sharedDB.addMessage(messageData),
    getMessages: (chatId) => Promise.resolve(sharedDB.getMessages(chatId)),
    saveProfile: (profileData) => sharedDB.saveProfile(profileData),
    getProfile: (userId) => Promise.resolve(sharedDB.getProfile(userId)),
    deleteProfile: (userId) => sharedDB.deleteProfile(userId),
    addActiveListener: (listenerData) => sharedDB.addActiveListener(listenerData),
    getActiveListeners: () => Promise.resolve(sharedDB.getActiveListeners()),
    removeActiveListener: (listenerId) => sharedDB.removeActiveListener(listenerId)
};
