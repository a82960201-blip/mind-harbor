// Load and display user profile
let userProfile = null;
let isAvailable = true;

async function loadProfile() {
    try {
        const currentUser = window.currentUser || JSON.parse(localStorage.getItem('userAccount'));
        
        if (!currentUser) {
            alert('Please log in first');
            window.location.href = '../index.html';
            return;
        }
        
        // Get profile from server
        userProfile = await db.getProfile(currentUser.userId);
        
        if (!userProfile) {
            // Create initial profile if doesn't exist
            userProfile = {
                userId: currentUser.userId,
                username: currentUser.username,
                email: currentUser.email,
                stats: {
                    conversations: 0,
                    totalTime: 0,
                    rating: 5.0,
                    helpedCount: 0
                },
                badges: [],
                createdAt: currentUser.createdAt || Date.now()
            };
            await db.saveProfile(userProfile);
        }
        
        // Display profile info
        document.getElementById('profileName').textContent = userProfile.username;
        document.getElementById('avatarIcon').textContent = '💙';
        document.getElementById('profileRole').textContent = 'Mind Harbor User';
        
        // Display stats
        document.querySelector('.stat-card:nth-child(1) .stat-value').textContent = userProfile.stats.conversations;
        document.querySelector('.stat-card:nth-child(2) .stat-value').textContent = Math.floor(userProfile.stats.totalTime) + 'm';
        document.querySelector('.stat-card:nth-child(3) .stat-value').textContent = userProfile.stats.rating.toFixed(1);
        document.querySelector('.stat-card:nth-child(4) .stat-value').textContent = 
            userProfile.stats.helpedCount > 0 ? userProfile.stats.helpedCount + ' people' : 'New';
        
        // Display account info
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('userName').textContent = currentUser.username;
        const memberDate = new Date(currentUser.createdAt).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('memberSince').textContent = memberDate;
        
        // Display badges
        displayBadges();
        
        // Set initial status
        const savedStatus = localStorage.getItem('listenerStatus');
        if (savedStatus === 'unavailable') {
            toggleStatus();
        }
        
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile. Please try again.');
    }
}

function displayBadges() {
    const badgesGrid = document.getElementById('badgesGrid');
    badgesGrid.innerHTML = '';
    
    if (!userProfile.badges || userProfile.badges.length === 0) {
        // Show message if no badges yet
        const noBadges = document.createElement('div');
        noBadges.className = 'no-badges';
        noBadges.innerHTML = `
            <p style="color: #a0c4ff; grid-column: 1/-1; text-align: center; padding: 20px;">
                Complete conversations to earn badges! 🏆
            </p>
        `;
        badgesGrid.appendChild(noBadges);
        return;
    }
    
    userProfile.badges.forEach(badgeId => {
        const badgeInfo = getBadgeInfo(badgeId);
        const badgeDiv = document.createElement('div');
        badgeDiv.className = 'badge-item';
        badgeDiv.innerHTML = `
            <span class="badge-emoji">${badgeInfo.emoji}</span>
            <span class="badge-name">${badgeInfo.name}</span>
        `;
        badgeDiv.title = badgeInfo.description;
        badgesGrid.appendChild(badgeDiv);
    });
}

function getBadgeInfo(badgeId) {
    const badgeData = {
        'first-chat': { emoji: '💬', name: 'First Chat', description: 'Completed your first conversation' },
        '10-chats': { emoji: '🔟', name: '10 Conversations', description: 'Helped 10 people' },
        '50-chats': { emoji: '⭐', name: '50 Conversations', description: 'A true helper' },
        '100-chats': { emoji: '💯', name: 'Century Club', description: '100 conversations!' },
        'helper': { emoji: '❤️', name: 'Compassionate', description: 'Helped 5+ people' },
        'highly-rated': { emoji: '🌟', name: 'Highly Rated', description: 'Maintained 4.8+ rating' }
    };
    
    return badgeData[badgeId] || { emoji: '🎖️', name: badgeId, description: 'Achievement unlocked' };
}

function toggleStatus() {
    const statusIndicator = document.querySelector('.status-indicator-large');
    const statusInfo = document.querySelector('.status-info');
    const toggleBtn = document.querySelector('.status-toggle');
    
    isAvailable = !isAvailable;
    
    if (isAvailable) {
        statusIndicator.classList.add('active');
        statusInfo.querySelector('h3').textContent = 'Currently Available';
        statusInfo.querySelector('p').textContent = 'Ready to listen to anyone who needs support';
        toggleBtn.textContent = 'Set Unavailable';
        toggleBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
        addAsActiveListener();
    } else {
        statusIndicator.classList.remove('active');
        statusInfo.querySelector('h3').textContent = 'Currently Unavailable';
        statusInfo.querySelector('p').textContent = 'Taking a break - will be back soon';
        toggleBtn.textContent = 'Set Available';
        toggleBtn.style.background = 'linear-gradient(135deg, #4ade80, #22c55e)';
        removeAsActiveListener();
    }
    
    localStorage.setItem('listenerStatus', isAvailable ? 'available' : 'unavailable');
}

async function addAsActiveListener() {
    if (!userProfile) return;
    
    await db.addActiveListener({
        id: userProfile.userId,
        name: userProfile.username,
        timestamp: Date.now(),
        status: 'available',
        stats: userProfile.stats
    });
}

async function removeAsActiveListener() {
    if (!userProfile) return;
    await db.removeActiveListener(userProfile.userId);
}

// Logout function
function logout() {
    const confirmed = confirm('Are you sure you want to log out?');
    if (confirmed) {
        // Clear localStorage
        localStorage.removeItem('userAccount');
        localStorage.removeItem('listenerStatus');
        
        // Redirect to home
        window.location.href = '../index.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Ensure database connection
    try {
        await db.init();
    } catch (error) {
        console.error('Database connection error:', error);
    }
    
    await loadProfile();
});

// Logout function
function logout() {
    const confirmed = confirm('Are you sure you want to log out?');
    
    if (confirmed) {
        // Clear localStorage
        localStorage.removeItem('userAccount');
        
        // Clear global user
        window.currentUser = null;
        
        // Redirect to home
        window.location.href = '../index.html';
    }
}
