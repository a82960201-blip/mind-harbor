// First-Time Tutorial System

function showFirstTimeWelcome() {
    // Check if user has seen tutorial
    if (localStorage.getItem('tutorialCompleted')) {
        return;
    }
    
    const tutorial = document.createElement('div');
    tutorial.className = 'tutorial-overlay';
    tutorial.id = 'tutorialOverlay';
    
    const slides = [
        {
            icon: '💙',
            title: 'Welcome to Mind Harbor',
            text: 'A safe space where you can talk to someone anonymously. Built in memory of someone who deserved to be heard.',
            button: 'Next'
        },
        {
            icon: '🎭',
            title: 'How It Works',
            text: '<strong>Find a Listener:</strong> Share what\'s on your mind<br><br><strong>Be a Listener:</strong> Support someone who needs it<br><br><strong>Group Chat:</strong> Connect with the community',
            button: 'Next'
        },
        {
            icon: '🔒',
            title: 'Your Privacy Matters',
            text: 'You have a permanent anonymous username. No real names. No judgments. Everything is confidential.',
            button: 'Next'
        },
        {
            icon: '🛡️',
            title: 'Stay Safe',
            text: 'Never share personal information. You can report or block anyone. Crisis resources are always available if needed.',
            button: 'Get Started'
        }
    ];
    
    let currentSlide = 0;
    
    tutorial.innerHTML = `
        <div class="tutorial-content">
            <div class="tutorial-slide" id="tutorialSlide">
                <div class="tutorial-icon">${slides[0].icon}</div>
                <h2 class="tutorial-title">${slides[0].title}</h2>
                <p class="tutorial-text">${slides[0].text}</p>
                <div class="tutorial-dots" id="tutorialDots"></div>
                <button class="tutorial-btn" id="tutorialBtn">${slides[0].button}</button>
                <button class="tutorial-skip" id="tutorialSkip">Skip Tutorial</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(tutorial);
    
    // Update dots
    function updateDots() {
        const dotsContainer = document.getElementById('tutorialDots');
        dotsContainer.innerHTML = slides.map((_, i) => 
            `<span class="tutorial-dot ${i === currentSlide ? 'active' : ''}"></span>`
        ).join('');
    }
    updateDots();
    
    // Next button
    document.getElementById('tutorialBtn').onclick = () => {
        currentSlide++;
        
        if (currentSlide >= slides.length) {
            completeTutorial();
        } else {
            const slide = slides[currentSlide];
            document.querySelector('.tutorial-icon').textContent = slide.icon;
            document.querySelector('.tutorial-title').textContent = slide.title;
            document.querySelector('.tutorial-text').innerHTML = slide.text;
            document.getElementById('tutorialBtn').textContent = slide.button;
            updateDots();
        }
    };
    
    // Skip button
    document.getElementById('tutorialSkip').onclick = completeTutorial;
}

function completeTutorial() {
    localStorage.setItem('tutorialCompleted', 'true');
    const tutorial = document.getElementById('tutorialOverlay');
    if (tutorial) {
        tutorial.remove();
    }
}

// Show on first visit
if (!localStorage.getItem('tutorialCompleted') && window.currentUser) {
    // Wait a moment after login
    setTimeout(showFirstTimeWelcome, 1000);
}
