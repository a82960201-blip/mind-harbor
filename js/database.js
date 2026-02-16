// Database Manager for Mind Harbor
class MindHarborDB {
    constructor() {
        this.dbName = 'MindHarborDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store for users waiting for listeners
                if (!db.objectStoreNames.contains('waitingUsers')) {
                    const waitingStore = db.createObjectStore('waitingUsers', { keyPath: 'id' });
                    waitingStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Store for active listeners
                if (!db.objectStoreNames.contains('activeListeners')) {
                    const listenerStore = db.createObjectStore('activeListeners', { keyPath: 'id' });
                    listenerStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Store for active chats
                if (!db.objectStoreNames.contains('activeChats')) {
                    const chatStore = db.createObjectStore('activeChats', { keyPath: 'chatId' });
                    chatStore.createIndex('participants', 'participants', { unique: false, multiEntry: true });
                }

                // Store for messages
                if (!db.objectStoreNames.contains('messages')) {
                    const messageStore = db.createObjectStore('messages', { keyPath: 'messageId' });
                    messageStore.createIndex('chatId', 'chatId', { unique: false });
                    messageStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                // Store for user profiles
                if (!db.objectStoreNames.contains('profiles')) {
                    const profileStore = db.createObjectStore('profiles', { keyPath: 'userId' });
                }
            };
        });
    }

    async addWaitingUser(userData) {
        const transaction = this.db.transaction(['waitingUsers'], 'readwrite');
        const store = transaction.objectStore('waitingUsers');
        return store.add(userData);
    }

    async getWaitingUsers() {
        const transaction = this.db.transaction(['waitingUsers'], 'readonly');
        const store = transaction.objectStore('waitingUsers');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeWaitingUser(userId) {
        const transaction = this.db.transaction(['waitingUsers'], 'readwrite');
        const store = transaction.objectStore('waitingUsers');
        return store.delete(userId);
    }

    async addActiveListener(listenerData) {
        const transaction = this.db.transaction(['activeListeners'], 'readwrite');
        const store = transaction.objectStore('activeListeners');
        return store.put(listenerData);
    }

    async getActiveListeners() {
        const transaction = this.db.transaction(['activeListeners'], 'readonly');
        const store = transaction.objectStore('activeListeners');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeActiveListener(listenerId) {
        const transaction = this.db.transaction(['activeListeners'], 'readwrite');
        const store = transaction.objectStore('activeListeners');
        return store.delete(listenerId);
    }

    async createChat(chatData) {
        const transaction = this.db.transaction(['activeChats'], 'readwrite');
        const store = transaction.objectStore('activeChats');
        return store.add(chatData);
    }

    async getChat(chatId) {
        const transaction = this.db.transaction(['activeChats'], 'readonly');
        const store = transaction.objectStore('activeChats');
        return new Promise((resolve, reject) => {
            const request = store.get(chatId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getChatByParticipant(userId) {
        const transaction = this.db.transaction(['activeChats'], 'readonly');
        const store = transaction.objectStore('activeChats');
        const index = store.index('participants');
        return new Promise((resolve, reject) => {
            const request = index.get(userId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addMessage(messageData) {
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        return store.add(messageData);
    }

    async getMessages(chatId) {
        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const index = store.index('chatId');
        return new Promise((resolve, reject) => {
            const request = index.getAll(chatId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async saveProfile(profileData) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        return store.put(profileData);
    }

    async getProfile(userId) {
        const transaction = this.db.transaction(['profiles'], 'readonly');
        const store = transaction.objectStore('profiles');
        return new Promise((resolve, reject) => {
            const request = store.get(userId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProfile(userId) {
        const transaction = this.db.transaction(['profiles'], 'readwrite');
        const store = transaction.objectStore('profiles');
        return store.delete(userId);
    }

    async deleteChat(chatId) {
        const transaction = this.db.transaction(['activeChats'], 'readwrite');
        const store = transaction.objectStore('activeChats');
        return store.delete(chatId);
    }

    async clearOldMessages(olderThan) {
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(olderThan);
        
        return new Promise((resolve, reject) => {
            const request = index.openCursor(range);
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }
}

// Global database instance
const db = new MindHarborDB();

// Initialize database on load
db.init().catch(console.error);
