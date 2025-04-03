document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const textInput = document.getElementById('text-input');
    const generateBtn = document.getElementById('generate-btn');
    const flashcardsSection = document.getElementById('flashcards-section');
    const flashcardsContainer = document.getElementById('flashcards-container');
    const inputSection = document.getElementById('input-section');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const cardCounter = document.getElementById('card-counter');
    const saveBtn = document.getElementById('save-btn');
    const newTextBtn = document.getElementById('new-text-btn');
    const savedDecksContainer = document.getElementById('saved-decks-container');
    const loadingElement = document.getElementById('loading');

    // State variables
    let currentFlashcards = [];
    let currentCardIndex = 0;
    let savedDecks = JSON.parse(localStorage.getItem('memorizeDecks')) || [];
    let cardThemes = ['math', 'science', 'history', 'languages', 'arts'];
    let currentProgress = 0;
    let streakCount = localStorage.getItem('streakCount') || 0;
    let lastStudied = localStorage.getItem('lastStudied') || null;

    // Initialize
    renderSavedDecks();
    updateStreakCount();
    enhanceUIWithAnimation();

    // Event Listeners
    generateBtn.addEventListener('click', generateFlashcards);
    prevBtn.addEventListener('click', showPreviousCard);
    nextBtn.addEventListener('click', showNextCard);
    saveBtn.addEventListener('click', saveCurrentDeck);
    newTextBtn.addEventListener('click', resetToInputSection);
    
    // Make sure text input has nice placeholder animation
    textInput.addEventListener('focus', function() {
        this.classList.add('focused');
    });
    
    textInput.addEventListener('blur', function() {
        if (this.value === '') {
            this.classList.remove('focused');
        }
    });

    // Add modern loading effect
    function updateLoadingDisplay() {
        if (loadingElement.classList.contains('hidden')) {
            return;
        }
        
        // Update loading message with a more engaging one
        const loadingMessages = [
            "Analyzing your text...",
            "Identifying key concepts...",
            "Creating question patterns...",
            "Generating flashcards...",
            "Almost ready..."
        ];
        
        loadingElement.innerHTML = `
            <div class="spinner"></div>
            <div class="progress-bar">
                <div class="progress-bar-fill"></div>
            </div>
            <p id="loading-message">${loadingMessages[0]}</p>
        `;
        
        let messageIndex = 0;
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % loadingMessages.length;
            document.getElementById('loading-message').textContent = loadingMessages[messageIndex];
        }, 1500);
        
        // Clear interval when loading is complete
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && loadingElement.classList.contains('hidden')) {
                    clearInterval(messageInterval);
                    observer.disconnect();
                }
            });
        });
        
        observer.observe(loadingElement, { attributes: true });
    }

    // Function to update streak count
    function updateStreakCount() {
        const today = new Date().toDateString();
        
        if (lastStudied) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (lastStudied === today) {
                // Already studied today, do nothing
            } else if (lastStudied === yesterdayString) {
                // Studied yesterday, increment streak
                streakCount++;
                localStorage.setItem('streakCount', streakCount);
                localStorage.setItem('lastStudied', today);
            } else {
                // Streak broken
                streakCount = 1;
                localStorage.setItem('streakCount', streakCount);
                localStorage.setItem('lastStudied', today);
            }
        } else {
            // First time studying
            streakCount = 1;
            localStorage.setItem('streakCount', streakCount);
            localStorage.setItem('lastStudied', today);
        }
        
        // Add streak count to UI if it exists in the DOM
        if (document.getElementById('streak-count')) {
            document.getElementById('streak-count').textContent = streakCount;
        }
    }

    // Add animations to UI
    function enhanceUIWithAnimation() {
        // Add streak counter to header if it doesn't exist
        const header = document.querySelector('header');
        if (!document.getElementById('streak-info')) {
            const streakInfo = document.createElement('div');
            streakInfo.id = 'streak-info';
            streakInfo.className = 'streak-badge';
            streakInfo.innerHTML = `
                <span>🔥 ${streakCount} day streak</span>
            `;
            header.appendChild(streakInfo);
        }
        
        // Add animated background to sections
        document.querySelectorAll('section').forEach(section => {
            if (!section.querySelector('.section-bg')) {
                const bg = document.createElement('div');
                bg.className = 'section-bg';
                section.appendChild(bg);
            }
        });
    }

    function generateFlashcards() {
        const text = textInput.value.trim();
        
        if (!text) {
            showNotification('Please enter some text first.', 'error');
            return;
        }
        
        // Show loading spinner
        loadingElement.classList.remove('hidden');
        updateLoadingDisplay();
        generateBtn.disabled = true;
        
        // Update streak count as user is actively using the app
        updateStreakCount();
        
        // Call the backend API to generate flashcards
        fetch('/api/generate-flashcards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            currentFlashcards = data.flashcards;
            applyDynamicThemes();
            renderFlashcards();
            inputSection.classList.add('hidden');
            flashcardsSection.classList.remove('hidden');
            
            // Add a learning progress tracker
            addProgressTracker();
            
            // Show a small confetti animation
            showConfetti(20);
        })
        .catch(error => {
            console.error('Error generating flashcards:', error);
            showNotification('Server error. Using local generation instead.', 'warning');
            
            // Fallback to client-side generation if the server is unavailable
            currentFlashcards = clientSideGenerateFlashcards(text);
            applyDynamicThemes();
            renderFlashcards();
            inputSection.classList.add('hidden');
            flashcardsSection.classList.remove('hidden');
            
            // Add a learning progress tracker
            addProgressTracker();
        })
        .finally(() => {
            loadingElement.classList.add('hidden');
            generateBtn.disabled = false;
        });
    }

    // Apply themes to flashcards based on content
    function applyDynamicThemes() {
        const subjectKeywords = {
            math: ['math', 'equation', 'calculate', 'number', 'formula', 'geometry', 'algebra'],
            science: ['science', 'biology', 'chemistry', 'physics', 'experiment', 'theory', 'scientific'],
            history: ['history', 'past', 'ancient', 'century', 'war', 'civilization', 'historical'],
            languages: ['language', 'word', 'grammar', 'vocabulary', 'speak', 'write', 'meaning'],
            arts: ['art', 'music', 'paint', 'draw', 'creative', 'design', 'color']
        };
        
        currentFlashcards.forEach(card => {
            // Default theme
            card.theme = 'default';
            
            // Try to detect subject from card content
            const combined = (card.question + ' ' + card.answer).toLowerCase();
            
            for (const [subject, keywords] of Object.entries(subjectKeywords)) {
                if (keywords.some(keyword => combined.includes(keyword))) {
                    card.theme = subject;
                    break;
                }
            }
        });
    }

    function addProgressTracker() {
        if (!document.getElementById('progress-tracker')) {
            const progressTracker = document.createElement('div');
            progressTracker.id = 'progress-tracker';
            progressTracker.className = 'progress-stats';
            
            progressTracker.innerHTML = `
                <h3 class="progress-title">Learning Progress</h3>
                <div class="progress-diagram">
                    <div class="progress-step completed" data-step="1">
                        <div class="progress-step-label">Start</div>
                    </div>
                    <div class="progress-step" data-step="2">
                        <div class="progress-step-label">25%</div>
                    </div>
                    <div class="progress-step" data-step="3">
                        <div class="progress-step-label">50%</div>
                    </div>
                    <div class="progress-step" data-step="4">
                        <div class="progress-step-label">75%</div>
                    </div>
                    <div class="progress-step" data-step="5">
                        <div class="progress-step-label">Complete</div>
                    </div>
                </div>
            `;
            
            // Insert progress tracker before the flashcards container
            flashcardsSection.insertBefore(progressTracker, flashcardsContainer);
            
            // Initialize progress
            updateLearningProgress(0);
        }
    }

    function updateLearningProgress(percentage) {
        const progressSteps = document.querySelectorAll('.progress-step');
        if (!progressSteps.length) return;
        
        // Mark steps as completed based on percentage
        progressSteps.forEach(step => {
            const stepNum = parseInt(step.getAttribute('data-step'));
            const stepPercentage = (stepNum - 1) * 25;
            
            if (percentage >= stepPercentage) {
                step.classList.add('completed');
            } else {
                step.classList.remove('completed');
            }
        });
    }

    // Render the flashcards in the container
    function renderFlashcards() {
        if (currentFlashcards.length === 0) {
            flashcardsContainer.innerHTML = '<p>No flashcards available. Please generate some first.</p>';
            return;
        }
        
        currentCardIndex = 0;
        showCurrentCard();
    }

    // Show the current flashcard
    function showCurrentCard() {
        if (currentFlashcards.length === 0) return;
        
        const card = currentFlashcards[currentCardIndex];
        const cardTheme = card.theme || 'default';
        
        // Update card counter
        cardCounter.textContent = `Card ${currentCardIndex + 1} of ${currentFlashcards.length}`;
        
        // Calculate progress percentage
        const progressPercentage = (currentCardIndex / (currentFlashcards.length - 1)) * 100;
        updateLearningProgress(progressPercentage);
        
        // Create flashcard HTML
        flashcardsContainer.innerHTML = `
            <div class="flashcard theme-${cardTheme}">
                <div class="flashcard-front">
                    <span class="flashcard-icon">❓</span>
                    <h3>Question</h3>
                    <p>${card.question}</p>
                    <span class="hint">Click to reveal answer</span>
                    <div class="card-visualization">
                        ${generateCardDots()}
                    </div>
                </div>
                <div class="flashcard-back">
                    <span class="flashcard-icon">💡</span>
                    <h3>Answer</h3>
                    <p>${card.answer}</p>
                    <span class="hint">Click to see question</span>
                </div>
            </div>
        `;
        
        // Add event listener to flip card
        const flashcard = document.querySelector('.flashcard');
        flashcard.addEventListener('click', function() {
            this.classList.toggle('flipped');
        });
    }

    // Generate visual dots representing cards
    function generateCardDots() {
        let dots = '';
        for (let i = 0; i < currentFlashcards.length; i++) {
            dots += `<div class="card-dot${i === currentCardIndex ? ' active' : ''}"></div>`;
        }
        return dots;
    }

    // Show previous card
    function showPreviousCard() {
        if (currentCardIndex > 0) {
            currentCardIndex--;
            showCurrentCard();
        }
    }

    // Show next card
    function showNextCard() {
        if (currentCardIndex < currentFlashcards.length - 1) {
            currentCardIndex++;
            showCurrentCard();
        } else {
            // Completed all cards
            completeDeck();
        }
    }

    // Mark deck as completed
    function completeDeck() {
        showNotification('Congratulations! You\'ve completed this deck!', 'success');
        showConfetti(100);
        
        // Update learning progress to 100%
        updateLearningProgress(100);
        
        // Add a small delay before allowing to restart
        setTimeout(() => {
            // Show a completion modal or message
            if (!document.getElementById('completion-message')) {
                const completionMessage = document.createElement('div');
                completionMessage.id = 'completion-message';
                completionMessage.className = 'completion-modal';
                completionMessage.innerHTML = `
                    <div class="completion-content">
                        <h3>🎉 Deck Completed!</h3>
                        <p>You've successfully studied all cards in this deck.</p>
                        <p>Ready for another round?</p>
                        <button id="restart-deck-btn">Start Over</button>
                        <button id="new-deck-btn">New Deck</button>
                    </div>
                `;
                document.body.appendChild(completionMessage);
                
                // Add event listeners to the buttons
                document.getElementById('restart-deck-btn').addEventListener('click', function() {
                    document.body.removeChild(completionMessage);
                    currentCardIndex = 0;
                    showCurrentCard();
                });
                
                document.getElementById('new-deck-btn').addEventListener('click', function() {
                    document.body.removeChild(completionMessage);
                    resetToInputSection();
                });
            }
        }, 1000);
    }

    // Create confetti animation
    function showConfetti(particleCount) {
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        document.body.appendChild(confettiContainer);
        
        const colors = ['#f2d74e', '#95c3de', '#ff7096', '#87f5a7', '#8e54e9'];
        
        for (let i = 0; i < particleCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            
            // Random shapes for confetti
            const shapes = ['circle', 'square', 'triangle'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            
            if (shape === 'circle') {
                confetti.style.borderRadius = '50%';
            } else if (shape === 'triangle') {
                confetti.style.width = '0';
                confetti.style.height = '0';
                confetti.style.backgroundColor = 'transparent';
                confetti.style.borderLeft = `${Math.random() * 10 + 5}px solid transparent`;
                confetti.style.borderRight = `${Math.random() * 10 + 5}px solid transparent`;
                confetti.style.borderBottom = `${Math.random() * 10 + 10}px solid ${colors[Math.floor(Math.random() * colors.length)]}`;
            }
            
            confetti.style.animation = `confetti-fall ${Math.random() * 3 + 2}s ease-out forwards`;
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            
            confettiContainer.appendChild(confetti);
        }
        
        // Remove confetti container after animations complete
        setTimeout(() => {
            document.body.removeChild(confettiContainer);
        }, 6000);
    }

    // Save the current deck
    function saveCurrentDeck() {
        if (currentFlashcards.length === 0) {
            showNotification('No flashcards to save.', 'error');
            return;
        }
        
        // Show prompt for deck name
        const deckName = prompt('Enter a name for this deck:', 'My Deck ' + (savedDecks.length + 1));
        
        if (!deckName) return; // User cancelled
        
        const newDeck = {
            id: Date.now(),
            name: deckName,
            cards: currentFlashcards,
            created: new Date().toISOString(),
            lastStudied: new Date().toISOString()
        };
        
        // Save to server if available
        fetch('/api/decks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: deckName,
                cards: currentFlashcards
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Update local deck with server ID
            newDeck.id = data.id;
            
            // Add to local storage as backup
            savedDecks.push(newDeck);
            localStorage.setItem('memorizeDecks', JSON.stringify(savedDecks));
            
            renderSavedDecks();
            showNotification('Deck saved successfully!', 'success');
        })
        .catch(error => {
            console.error('Error saving deck to server:', error);
            
            // Fallback to local storage only
            savedDecks.push(newDeck);
            localStorage.setItem('memorizeDecks', JSON.stringify(savedDecks));
            
            renderSavedDecks();
            showNotification('Deck saved locally (offline mode).', 'warning');
        });
    }

    // Render saved decks in the container
    function renderSavedDecks() {
        // First try to load from server
        fetch('/api/decks')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Merge server decks with local decks (for offline created ones)
            const serverDeckIds = data.map(deck => deck.id);
            const localOnlyDecks = savedDecks.filter(deck => !serverDeckIds.includes(deck.id));
            
            // Combine and de-duplicate
            const combinedDecks = [...data, ...localOnlyDecks];
            
            // Update savedDecks to the combined list
            savedDecks = combinedDecks;
            localStorage.setItem('memorizeDecks', JSON.stringify(savedDecks));
            
            renderDecksList(combinedDecks);
        })
        .catch(error => {
            console.error('Error loading decks from server:', error);
            // Fallback to local storage
            renderDecksList(savedDecks);
        });
    }

    // Render the actual decks list
    function renderDecksList(decks) {
        if (decks.length === 0) {
            savedDecksContainer.innerHTML = '<p>No saved decks yet. Generate and save some flashcards!</p>';
            return;
        }
        
        savedDecksContainer.innerHTML = '';
        
        decks.forEach(deck => {
            const deckElement = document.createElement('div');
            deckElement.className = 'saved-deck';
            
            // Format the date
            const created = new Date(deck.created || Date.now());
            const formattedDate = created.toLocaleDateString();
            
            // Calculate card count
            const cardCount = deck.cards ? deck.cards.length : 0;
            
            deckElement.innerHTML = `
                <div class="deck-info">
                    <h3>${deck.name}</h3>
                    <p>${cardCount} cards • Created ${formattedDate}</p>
                </div>
                <div class="deck-actions">
                    <button class="load-deck-btn" data-id="${deck.id}">Study</button>
                    <button class="delete-deck-btn" data-id="${deck.id}">Delete</button>
                </div>
            `;
            
            savedDecksContainer.appendChild(deckElement);
        });
        
        // Add event listeners to the buttons
        document.querySelectorAll('.load-deck-btn').forEach(button => {
            button.addEventListener('click', function() {
                const deckId = parseInt(this.getAttribute('data-id'));
                loadDeck(deckId);
            });
        });
        
        document.querySelectorAll('.delete-deck-btn').forEach(button => {
            button.addEventListener('click', function() {
                const deckId = parseInt(this.getAttribute('data-id'));
                deleteDeck(deckId);
            });
        });
    }

    // Load a saved deck
    function loadDeck(deckId) {
        const deck = savedDecks.find(d => d.id === deckId);
        
        if (deck && deck.cards) {
            currentFlashcards = deck.cards;
            renderFlashcards();
            inputSection.classList.add('hidden');
            flashcardsSection.classList.remove('hidden');
            
            // Add progress tracker
            addProgressTracker();
            
            // Update last studied timestamp
            updateDeckStudyTime(deckId);
            
            // Update streak
            updateStreakCount();
            
            showNotification(`Loaded deck: ${deck.name}`, 'success');
        } else {
            showNotification('Could not load deck, it may be corrupted.', 'error');
        }
    }

    // Update the last studied time for a deck
    function updateDeckStudyTime(deckId) {
        const now = new Date().toISOString();
        
        // Update locally first
        const deckIndex = savedDecks.findIndex(d => d.id === deckId);
        if (deckIndex !== -1) {
            savedDecks[deckIndex].lastStudied = now;
            localStorage.setItem('memorizeDecks', JSON.stringify(savedDecks));
        }
        
        // Then try to update on server
        fetch(`/api/decks/${deckId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                lastStudied: now
            }),
        }).catch(error => {
            console.error('Error updating deck study time:', error);
            // No need for user notification, this is a background operation
        });
    }

    // Delete a saved deck
    function deleteDeck(deckId) {
        if (!confirm('Are you sure you want to delete this deck?')) {
            return;
        }
        
        // Try to delete from server first
        fetch(`/api/decks/${deckId}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(() => {
            // Remove from local storage too
            savedDecks = savedDecks.filter(d => d.id !== deckId);
            localStorage.setItem('memorizeDecks', JSON.stringify(savedDecks));
            
            renderSavedDecks();
            showNotification('Deck deleted successfully!', 'success');
        })
        .catch(error => {
            console.error('Error deleting deck from server:', error);
            
            // Fallback to local deletion only
            savedDecks = savedDecks.filter(d => d.id !== deckId);
            localStorage.setItem('memorizeDecks', JSON.stringify(savedDecks));
            
            renderSavedDecks();
            showNotification('Deck deleted from local storage.', 'warning');
        });
    }

    // Reset UI to input section
    function resetToInputSection() {
        flashcardsSection.classList.add('hidden');
        inputSection.classList.remove('hidden');
        textInput.value = '';
        currentFlashcards = [];
    }

    // Client-side flashcard generation (fallback for server errors)
    function clientSideGenerateFlashcards(text) {
        // Simple algorithm to extract key sentences and convert to Q&A
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length === 0) {
            showNotification('Text is too short to generate meaningful flashcards.', 'error');
            return [];
        }
        
        // Take at most 10 sentences
        const selectedSentences = sentences.slice(0, Math.min(10, sentences.length));
        
        // Generate flashcards from sentences
        return selectedSentences.map(sentence => {
            // Clean the sentence
            sentence = sentence.trim();
            
            // Skip short sentences
            if (sentence.split(' ').length < 5) {
                return null;
            }
            
            // Get key terms (longer words)
            const words = sentence.split(' ');
            const keyTerms = words.filter(word => word.length > 5).map(word => word.replace(/[,.;:?!"']/g, ''));
            
            // Skip if no key terms
            if (keyTerms.length === 0) {
                return null;
            }
            
            // Choose a random key term
            const keyTerm = keyTerms[Math.floor(Math.random() * keyTerms.length)];
            
            // Create question
            const questionTemplates = [
                `What does "${keyTerm}" refer to in this context?`,
                `Explain the concept of ${keyTerm}.`,
                `What is meant by "${keyTerm}"?`,
                `Define ${keyTerm}.`,
                `Describe what ${keyTerm} means.`
            ];
            
            const question = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
            
            return {
                question: question,
                answer: sentence
            };
        }).filter(card => card !== null);
    }

    // Show notification toast
    function showNotification(message, type = 'info') {
        // Remove existing notification if present
        const existingNotification = document.getElementById('notification-toast');
        if (existingNotification) {
            document.body.removeChild(existingNotification);
        }
        
        const notification = document.createElement('div');
        notification.id = 'notification-toast';
        notification.className = `notification ${type}`;
        
        // Icon based on notification type
        let icon = '💬';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'warning') icon = '⚠️';
        
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <p>${message}</p>
            <button class="close-notification">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Add slide-in animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Auto-remove after 4 seconds
        const timeout = setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 4000);
        
        // Close button event
        notification.querySelector('.close-notification').addEventListener('click', function() {
            clearTimeout(timeout);
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        });
    }

    // Add key event listeners for keyboard navigation
    document.addEventListener('keydown', function(e) {
        // Only if we're in the flashcards section
        if (flashcardsSection.classList.contains('hidden')) {
            return;
        }
        
        // Space bar to flip card
        if (e.key === ' ' || e.code === 'Space') {
            const flashcard = document.querySelector('.flashcard');
            if (flashcard) {
                flashcard.classList.toggle('flipped');
                e.preventDefault();
            }
        }
        
        // Left arrow for previous card
        if (e.key === 'ArrowLeft') {
            showPreviousCard();
            e.preventDefault();
        }
        
        // Right arrow for next card
        if (e.key === 'ArrowRight') {
            showNextCard();
            e.preventDefault();
        }
    });
});