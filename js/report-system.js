// Report and Block System

function reportUser() {
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.id = 'reportModal';
    
    const partnerName = document.getElementById('chatPartner').textContent;
    
    modal.innerHTML = `
        <div class="report-content">
            <h2>🚨 Report User</h2>
            <p>Report ${partnerName} for violating community guidelines</p>
            
            <form id="reportForm">
                <label>Reason for report:</label>
                <select id="reportReason" required>
                    <option value="">Select a reason...</option>
                    <option value="harassment">Harassment or bullying</option>
                    <option value="hate-speech">Hate speech</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="spam">Spam or advertising</option>
                    <option value="personal-info">Sharing personal information</option>
                    <option value="threats">Threats or violence</option>
                    <option value="other">Other</option>
                </select>
                
                <label>Additional details (optional):</label>
                <textarea id="reportDetails" placeholder="Provide any additional context..." rows="4"></textarea>
                
                <div class="report-actions">
                    <button type="submit" class="report-submit-btn">Submit Report</button>
                    <button type="button" class="report-cancel-btn" onclick="closeReportModal()">Cancel</button>
                </div>
            </form>
            
            <div class="block-section">
                <p class="block-text">You can also block this user to prevent future matches:</p>
                <button class="block-btn" onclick="blockUser()">🚫 Block User</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle form submission
    document.getElementById('reportForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const reason = document.getElementById('reportReason').value;
        const details = document.getElementById('reportDetails').value;
        
        if (!reason) {
            alert('Please select a reason for reporting');
            return;
        }
        
        await submitReport(reason, details);
    });
}

async function submitReport(reason, details) {
    const reportData = {
        reportId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reporterId: window.currentUser?.userId,
        reporterName: window.currentUser?.username,
        reportedUserId: partnerId,
        reportedUserName: document.getElementById('chatPartner').textContent,
        chatId: chatId,
        reason: reason,
        details: details,
        timestamp: Date.now()
    };
    
    try {
        // Send to server
        if (socketDB && socketDB.socket) {
            socketDB.socket.emit('submit-report', reportData);
        }
        
        // Store locally
        const reports = JSON.parse(localStorage.getItem('reports') || '[]');
        reports.push(reportData);
        localStorage.setItem('reports', JSON.stringify(reports));
        
        closeReportModal();
        
        // Show confirmation
        alert('Thank you for your report. Our team will review it shortly. You can also block this user to prevent future matches.');
        
    } catch (error) {
        console.error('Error submitting report:', error);
        alert('Failed to submit report. Please try again.');
    }
}

function blockUser() {
    const partnerName = document.getElementById('chatPartner').textContent;
    
    if (confirm(`Are you sure you want to block ${partnerName}? You won't be matched with them again.`)) {
        const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
        
        if (!blockedUsers.includes(partnerId)) {
            blockedUsers.push(partnerId);
            localStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
            
            alert(`${partnerName} has been blocked. You won't be matched with them again.`);
            closeReportModal();
        } else {
            alert('This user is already blocked.');
        }
    }
}

function isUserBlocked(userId) {
    const blockedUsers = JSON.parse(localStorage.getItem('blockedUsers') || '[]');
    return blockedUsers.includes(userId);
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.remove();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { reportUser, blockUser, isUserBlocked, closeReportModal };
}
