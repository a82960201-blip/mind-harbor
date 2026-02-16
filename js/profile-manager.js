// Profile Manager - Generates and manages user profiles
class ProfileManager {
    constructor() {
        this.currentProfile = null;
    }

    // Generate a unique profile for new users
    generateProfile(role = 'seeker') {
        const adjectives = ['Gentle', 'Calm', 'Quiet', 'Peaceful', 'Silent', 'Soft', 'Kind', 'Warm', 'Bright', 'Serene', 
                           'Glittery', 'Masked', 'Mystic', 'Hidden', 'Shadow', 'Whisper', 'Brave', 'Wise', 'Swift', 'Noble'];
        const nouns = ['Panda', 'Dolphin', 'Owl', 'Deer', 'Fox', 'Rabbit', 'Swan', 'Dove', 'Butterfly', 'Goat', 
                      'Rose', 'Cloud', 'Star', 'Moon', 'River', 'Ocean', 'Mountain', 'Forest', 'Phoenix', 'Dragon'];
        const colors = ['#4fc3f7', '#00b4d8', '#4361ee', '#7209b7', '#f72585', '#06ffa5', '#ffe66d'];
        
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const number = Math.floor(Math.random() * 900) + 100;
        const username = `${adj}${noun}${number}`;
        
        const profile = {
            userId: username,
            username: username,
            role: role, // 'seeker' or 'listener'
            avatarColor: colors[Math.floor(Math.random() * colors.length)],
            avatarEmoji: this.getRandomEmoji(),
            createdAt: Date.now(),
            stats: {
                conversations: 0,
                totalTime: 0, // in minutes
                rating: 5.0,
                helpedCount: 0, // for listeners
                receivedHelpCount: 0 // for seekers
            },
            badges: ['newbie'],
            isOnline: true,
            lastActive: Date.now()
        };

        return profile;
    }

    getRandomEmoji() {
        const emojis = ['😊', '🌟', '💙', '🦋', '🌸', '🌙', '✨', '🌺', '🍀', '🌈', '☀️', '🌻', '🎭', '🎨', '🎵'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    // Get or create current user profile
    async getCurrentProfile(role = 'seeker') {
        // Check if profile exists in localStorage
        let profileData = localStorage.getItem('myProfile');
        
        if (profileData) {
            this.currentProfile = JSON.parse(profileData);
            this.currentProfile.isOnline = true;
            this.currentProfile.lastActive = Date.now();
        } else {
            // Generate new profile
            this.currentProfile = this.generateProfile(role);
            localStorage.setItem('myProfile', JSON.stringify(this.currentProfile));
        }

        // Save to database
        await db.saveProfile(this.currentProfile);
        
        return this.currentProfile;
    }

    // Update profile stats after chat
    async updateStats(updates) {
        if (!this.currentProfile) {
            await this.getCurrentProfile();
        }

        // Update stats
        Object.assign(this.currentProfile.stats, updates);

        // Check for new badges
        this.checkBadges();

        // Save updates
        localStorage.setItem('myProfile', JSON.stringify(this.currentProfile));
        await db.saveProfile(this.currentProfile);
    }

    checkBadges() {
        const stats = this.currentProfile.stats;
        const badges = this.currentProfile.badges;

        // Add badges based on achievements
        if (stats.conversations >= 1 && !badges.includes('first-chat')) {
            badges.push('first-chat');
        }
        if (stats.conversations >= 10 && !badges.includes('10-chats')) {
            badges.push('10-chats');
        }
        if (stats.conversations >= 50 && !badges.includes('50-chats')) {
            badges.push('50-chats');
        }
        if (stats.conversations >= 100 && !badges.includes('100-chats')) {
            badges.push('100-chats');
        }
        if (stats.totalTime >= 60 && !badges.includes('1-hour')) {
            badges.push('1-hour');
        }
        if (stats.totalTime >= 600 && !badges.includes('10-hours')) {
            badges.push('10-hours');
        }
        if (this.currentProfile.role === 'listener' && stats.helpedCount >= 5 && !badges.includes('helper')) {
            badges.push('helper');
        }
        if (stats.rating >= 4.8 && !badges.includes('highly-rated')) {
            badges.push('highly-rated');
        }
    }

    // Get badge info
    getBadgeInfo(badgeId) {
        const badgeData = {
            'newbie': { emoji: '🌱', name: 'Newbie', description: 'Welcome to Mind Harbor!' },
            'first-chat': { emoji: '💬', name: 'First Chat', description: 'Completed your first conversation' },
            '10-chats': { emoji: '🔟', name: '10 Conversations', description: 'Helped 10 people' },
            '50-chats': { emoji: '⭐', name: '50 Conversations', description: 'A true helper' },
            '100-chats': { emoji: '💯', name: 'Century Club', description: '100 conversations!' },
            '1-hour': { emoji: '⏰', name: 'One Hour', description: 'Spent 1 hour helping' },
            '10-hours': { emoji: '🏆', name: 'Ten Hours', description: 'Dedicated listener' },
            'helper': { emoji: '❤️', name: 'Compassionate', description: 'Helped 5+ people' },
            'highly-rated': { emoji: '🌟', name: 'Highly Rated', description: 'Maintained 4.8+ rating' }
        };

        return badgeData[badgeId] || { emoji: '🎖️', name: badgeId, description: 'Achievement unlocked' };
    }

    // Set profile offline
    async setOffline() {
        if (this.currentProfile) {
            this.currentProfile.isOnline = false;
            this.currentProfile.lastActive = Date.now();
            localStorage.setItem('myProfile', JSON.stringify(this.currentProfile));
            await db.saveProfile(this.currentProfile);
        }
    }

    // Delete profile (for reset)
    async deleteProfile() {
        localStorage.removeItem('myProfile');
        if (this.currentProfile) {
            await db.deleteProfile(this.currentProfile.userId);
        }
        this.currentProfile = null;
    }

    // Get formatted display name with emoji
    getDisplayName() {
        if (!this.currentProfile) return 'Anonymous';
        return `${this.currentProfile.avatarEmoji} ${this.currentProfile.username}`;
    }
}

// Global profile manager
const profileManager = new ProfileManager();
