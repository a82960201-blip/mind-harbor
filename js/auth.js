// Authentication and Username Assignment
let isSignupMode = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user already has account
    const existingUser = localStorage.getItem('userAccount');
    
    if (existingUser) {
        // User already logged in
        const user = JSON.parse(existingUser);
        showMainContent(user);
    } else {
        // Show email modal
        document.getElementById('authModal').style.display = 'flex';
    }
});

function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    
    const authText = document.getElementById('authText');
    const authBtn = document.getElementById('authBtn');
    const toggleText = document.querySelector('.toggle-text');
    
    if (isSignupMode) {
        authText.textContent = 'Create your account';
        authBtn.textContent = 'Sign Up';
        toggleText.innerHTML = 'Already have an account? <span class="toggle-link" onclick="toggleAuthMode()">Log In</span>';
    } else {
        authText.textContent = 'Log in with your email';
        authBtn.textContent = 'Log In';
        toggleText.innerHTML = 'Don\'t have an account? <span class="toggle-link" onclick="toggleAuthMode()">Sign Up</span>';
    }
    
    // Clear error if any
    hideError();
}

function showError(message) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        document.querySelector('#emailForm').prepend(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError() {
    const errorDiv = document.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

// Handle email form submission
document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    // Connect to server
    try {
        await db.init();
    } catch (error) {
        console.error('Connection error:', error);
        showError('Unable to connect to server. Please make sure the server is running with: npm start');
        return;
    }
    
    if (isSignupMode) {
        // SIGN UP MODE
        const existingProfile = await db.getProfileByEmail(email);
        
        if (existingProfile) {
            showError('Email already registered. Please log in instead.');
            return;
        }
        
        // Create new account
        const username = generatePermanentUsername();
        const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const userAccount = {
            email: email,
            password: password, // In production, hash this!
            username: username,
            userId: userId,
            createdAt: Date.now()
        };
        
        // Save to database
        await db.saveProfile({
            userId: userId,
            email: email,
            password: password, // In production, hash this!
            username: username,
            createdAt: Date.now(),
            stats: {
                conversations: 0,
                totalTime: 0,
                messagesStored: 0
            }
        });
        
        // Save to localStorage
        localStorage.setItem('userAccount', JSON.stringify(userAccount));
        
        showMainContent(userAccount);
        
    } else {
        // LOG IN MODE
        const existingProfile = await db.getProfileByEmail(email);
        
        if (!existingProfile) {
            showError('No account found with this email. Please sign up first.');
            return;
        }
        
        // Verify password
        if (existingProfile.password !== password) {
            showError('Incorrect password. Please try again.');
            return;
        }
        
        // Login successful
        const userAccount = {
            email: email,
            password: password,
            username: existingProfile.username,
            userId: existingProfile.userId,
            createdAt: existingProfile.createdAt
        };
        
        localStorage.setItem('userAccount', JSON.stringify(userAccount));
        showMainContent(userAccount);
    }
});

function generatePermanentUsername() {
    const colors = ['Purple', 'Blue', 'Red', 'Green', 'Pink', 'Orange', 'Yellow', 'Silver', 'Golden', 'Crimson', 
                   'Azure', 'Violet', 'Emerald', 'Amber', 'Jade', 'Ruby', 'Sapphire', 'Pearl', 'Coral', 'Indigo'];
    const adjectives = ['Speedy', 'Swift', 'Brave', 'Gentle', 'Calm', 'Bright', 'Silent', 'Peaceful', 'Bold', 'Kind',
                       'Quick', 'Strong', 'Wise', 'Serene', 'Noble', 'True', 'Pure', 'Free', 'Wild', 'Soft'];
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const number = Math.floor(Math.random() * 9000) + 1000; // 4 digit number
    
    return `${color}${adj}${number}`;
}

function showMainContent(userAccount) {
    // Make username globally available FIRST
    window.currentUser = userAccount;
    
    // Hide modal
    document.getElementById('authModal').style.display = 'none';
    
    // Show main content
    document.getElementById('mainContent').style.display = 'block';
    
    // Display username
    document.getElementById('currentUsername').textContent = userAccount.username;
    
    console.log('User logged in:', userAccount);
}

// Password Reset
function showPasswordReset() {
    const email = document.getElementById('emailInput').value.trim();
    
    if (!email) {
        alert('Please enter your email address first');
        return;
    }
    
    // In production, send email with reset link
    // For now, show instructions
    alert(`Password reset instructions would be sent to ${email}.\n\nFor this demo version, please contact support or create a new account.`);
}
