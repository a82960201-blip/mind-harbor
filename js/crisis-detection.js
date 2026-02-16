// Crisis Detection System
const CRISIS_KEYWORDS = [
    'suicide', 'kill myself', 'end my life', 'want to die', 'better off dead',
    'suicidal', 'kill me', 'end it all', 'not worth living', 'cant go on',
    'hurt myself', 'self harm', 'cutting myself', 'overdose', 'jump off'
];

function detectCrisisKeywords(text) {
    const lowerText = text.toLowerCase();
    return CRISIS_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function showCrisisResources() {
    const modal = document.createElement('div');
    modal.className = 'crisis-modal';
    modal.innerHTML = `
        <div class="crisis-modal-content">
            <div class="crisis-header">
                <span class="crisis-icon">🆘</span>
                <h2>You're Not Alone - Help is Available</h2>
            </div>
            
            <div class="crisis-body">
                <p class="crisis-message">
                    If you're in crisis or thinking about suicide, please reach out to these resources immediately:
                </p>
                
                <div class="crisis-resource">
                    <h3>🇺🇸 United States</h3>
                    <div class="resource-item">
                        <strong>988 Suicide & Crisis Lifeline</strong>
                        <p>Call or Text: <a href="tel:988">988</a></p>
                        <p>Available 24/7, free and confidential</p>
                    </div>
                    <div class="resource-item">
                        <strong>Crisis Text Line</strong>
                        <p>Text "HELLO" to <a href="sms:741741">741741</a></p>
                        <p>Available 24/7</p>
                    </div>
                </div>
                
                <div class="crisis-resource">
                    <h3>🌍 International</h3>
                    <div class="resource-item">
                        <p>Find helplines in your country:</p>
                        <a href="https://findahelpline.com" target="_blank" class="crisis-link">
                            findahelpline.com
                        </a>
                    </div>
                </div>
                
                <div class="crisis-emergency">
                    <strong>⚠️ In immediate danger?</strong>
                    <p>Call emergency services: <a href="tel:911">911 (US)</a> or your local emergency number</p>
                </div>
            </div>
            
            <div class="crisis-footer">
                <button class="crisis-continue-btn" onclick="window.crisisDetection.close()">
                    Continue Chatting
                </button>
                <p class="crisis-note">This conversation will remain private and confidential</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeCrisisModal() {
    const modal = document.querySelector('.crisis-modal');
    if (modal) {
        modal.remove();
    }
}

// Export
window.crisisDetection = {
    detect: detectCrisisKeywords,
    showResources: showCrisisResources,
    close: closeCrisisModal
};
