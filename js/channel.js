// Real-time Communication System using BroadcastChannel
class MindHarborChannel {
    constructor() {
        this.channel = new BroadcastChannel('mind-harbor-channel');
        this.listeners = new Map();
        this.setupMessageHandler();
    }

    setupMessageHandler() {
        this.channel.onmessage = (event) => {
            const { type, data } = event.data;
            const handlers = this.listeners.get(type) || [];
            handlers.forEach(handler => handler(data));
        };
    }

    on(eventType, handler) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(handler);
    }

    off(eventType, handler) {
        if (this.listeners.has(eventType)) {
            const handlers = this.listeners.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(eventType, data) {
        this.channel.postMessage({ type: eventType, data });
    }

    // Specific event emitters
    notifyNewWaitingUser(userData) {
        this.emit('new-waiting-user', userData);
    }

    notifyListenerAvailable(listenerData) {
        this.emit('listener-available', listenerData);
    }

    notifyMatchFound(matchData) {
        this.emit('match-found', matchData);
    }

    notifyNewMessage(messageData) {
        this.emit('new-message', messageData);
    }

    notifyChatEnded(chatId) {
        this.emit('chat-ended', chatId);
    }

    notifyUserLeft(userId) {
        this.emit('user-left', userId);
    }
}

// Global channel instance
const channel = new MindHarborChannel();
