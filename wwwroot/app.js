let connection = null;
let currentRoomId = null;
let myPosition = -1;
let gameState = null;

const suitSymbols = {
    'Hearts': '♥',
    'Diamonds': '♦',
    'Clubs': '♣',
    'Spades': '♠'
};

const suitColors = {
    'Hearts': 'red',
    'Diamonds': 'red',
    'Clubs': 'black',
    'Spades': 'black'
};

const suitOrder = {
    'Hearts': 1,
    'Diamonds': 2,
    'Clubs': 3,
    'Spades': 4
};

const rankOrder = {
    'J': 8, '9': 7, 'A': 6, '10': 5, 'K': 4, 'Q': 3, '8': 2, '7': 1
};

function sortCards(cards) {
    return cards.sort((a, b) => {
        if (suitOrder[a.suit] !== suitOrder[b.suit]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
        }
        return rankOrder[b.rank] - rankOrder[a.rank];
    });
}

function initConnection() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("/gamehub")
        .build();

    connection.on("GameState", updateGameState);
    connection.on("Error", showError);
    connection.on("TrumpAsked", handleTrumpAsked);
    connection.on("ReceiveChatMessage", displayChatMessage);

    connection.start()
        .then(() => console.log('SignalR Connected'))
        .catch(err => {
            console.error('SignalR Connection Error:', err);
            showError('Failed to connect to server. Please refresh the page.');
        });
}

document.getElementById('joinBtn').addEventListener('click', joinRoom);
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('placeBidBtn').addEventListener('click', placeBid);
document.getElementById('passBtn').addEventListener('click', passBid);
document.getElementById('askTrumpBtn').addEventListener('click', askForTrump);
document.getElementById('newRoundBtn').addEventListener('click', startGame);
document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// Chat toggle for mobile and minimize/maximize functionality
let unreadCount = 0;

document.getElementById('chatToggle').addEventListener('click', () => {
    const chatBox = document.getElementById('chatBox');
    const isMinimized = chatBox.classList.contains('minimized');

    if (isMinimized) {
        // Maximize the chat
        chatBox.classList.remove('minimized');
        unreadCount = 0;
        updateChatBadge();
    }

    // Mobile toggle
    chatBox.classList.toggle('collapsed');
    document.body.classList.toggle('chat-open', !chatBox.classList.contains('collapsed'));

    // Clear unread when opening
    if (!chatBox.classList.contains('collapsed')) {
        unreadCount = 0;
        updateChatBadge();
    }
});

document.getElementById('minimizeChat').addEventListener('click', (e) => {
    e.stopPropagation();
    const chatBox = document.getElementById('chatBox');
    chatBox.classList.add('minimized');

    // On mobile, also collapse it
    if (window.innerWidth <= 768) {
        chatBox.classList.add('collapsed');
        document.body.classList.remove('chat-open');
    }
});

function updateChatBadge() {
    const badge = document.getElementById('chatBadge');
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

document.querySelectorAll('.trump-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('Trump button clicked!', btn.dataset.suit, 'Disabled?', btn.disabled);
        if (!btn.disabled) {
            chooseTrump(btn.dataset.suit);
        } else {
            console.log('Button is disabled, not calling chooseTrump');
        }
    });
});

async function joinRoom() {
    console.log('joinRoom function called');
    const playerName = document.getElementById('playerName').value;
    const roomId = document.getElementById('roomId').value;

    console.log('Player Name:', playerName, 'Room ID:', roomId);

    if (!playerName || !roomId) {
        alert('Please enter name and room ID');
        return;
    }

    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        alert('Connection not ready. Please wait a moment and try again.');
        console.log('Connection state:', connection?.state);
        return;
    }

    try {
        console.log('Invoking JoinRoom...');
        currentRoomId = roomId;
        await connection.invoke("JoinRoom", roomId, playerName);
        console.log('JoinRoom invoked successfully');
    } catch (err) {
        console.error('Join Room Error:', err);
        alert('Failed to join room: ' + err.message);
    }
}

async function startGame() {
    await connection.invoke("StartGame", currentRoomId);
}

async function placeBid() {
    const bidAmount = parseInt(document.getElementById('bidAmount').value);
    if (bidAmount < 16) {
        alert('Minimum bid is 16');
        return;
    }
    await connection.invoke("PlaceBid", currentRoomId, bidAmount);
}

async function passBid() {
    await connection.invoke("PlaceBid", currentRoomId, null);
}

async function chooseTrump(suit) {
    console.log('Choosing trump suit:', suit, 'Room:', currentRoomId, 'My position:', myPosition);
    try {
        await connection.invoke("ChooseTrump", currentRoomId, suit);
        console.log('Trump chosen successfully');
    } catch (err) {
        console.error('Error choosing trump:', err);
        alert('Failed to choose trump: ' + err.message);
    }
}

async function playCard(cardId) {
    console.log('Playing card:', cardId);
    try {
        await connection.invoke("PlayCard", currentRoomId, cardId);
        console.log('Card played successfully');
    } catch (err) {
        console.error('Error playing card:', err);
        alert('Failed to play card: ' + err.message);
    }
}

async function askForTrump() {
    await connection.invoke("AskForTrump", currentRoomId);
}

function updateGameState(state) {
    console.log('updateGameState called with state:', state);
    gameState = state;

    console.log('Finding player...');
    const me = state.players?.find(p => p.isYou) || state.Players?.find(p => p.IsYou);
    if (me) myPosition = me.position !== undefined ? me.position : me.Position;
    console.log('My position:', myPosition, 'Phase:', state.phase || state.Phase);

    // Activate chat box after joining room
    const chatBox = document.getElementById('chatBox');
    if (!chatBox.classList.contains('active')) {
        chatBox.classList.add('active');
        // Start collapsed on mobile
        if (window.innerWidth <= 768) {
            chatBox.classList.add('collapsed');
        }
    }

    document.getElementById('roomInfo').textContent = `Room: ${state.roomId}`;
    document.getElementById('phaseInfo').textContent = `Phase: ${state.phase}`;

    // Display contractor and bid info
    let contractorInfo = '';
    if (state.contractorPosition !== undefined && state.contractorPosition !== null) {
        const contractor = state.players.find(p => p.position === state.contractorPosition);
        if (contractor) {
            contractorInfo = ` | Contractor: ${contractor.name} (Bid: ${state.contractorBid || 'N/A'})`;
        }
    }

    let trumpText = 'Trump: ';
    if (state.trumpRevealed && state.trumpSuit) {
        trumpText += `${suitSymbols[state.trumpSuit]} ${state.trumpSuit} (Revealed)`;
    } else if (state.trumpSuit && myPosition === state.contractorPosition) {
        trumpText += `${suitSymbols[state.trumpSuit]} ${state.trumpSuit} (Hidden)`;
    } else {
        trumpText += 'Hidden';
    }
    document.getElementById('trumpInfo').textContent = trumpText + contractorInfo;

    // Get player names for teams
    const team1Players = state.players.filter(p => p.position === 0 || p.position === 2).map(p => p.name).join(' & ');
    const team2Players = state.players.filter(p => p.position === 1 || p.position === 3).map(p => p.name).join(' & ');

    // Build bid requirement text
    let bidRequirement = '';
    if (state.contractorPosition !== undefined && state.contractorBid) {
        const contractor = state.players.find(p => p.position === state.contractorPosition);
        const isContractorTeam1 = (state.contractorPosition === 0 || state.contractorPosition === 2);
        const contractorTeamPoints = isContractorTeam1 ? state.team1Points : state.team2Points;
        bidRequirement = `
            <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-bottom: 10px; border-left: 4px solid #ffc107;">
                <strong>Bid Requirement:</strong> ${contractor?.name} must score <strong>${state.contractorBid}</strong> points to win this round
                <br><strong>Current Score:</strong> ${contractorTeamPoints} points
                ${state.hasTrumpMarriage ? '<br><span style="color: #4CAF50;">★ Trump Marriage available (+4 bonus)</span>' : ''}
            </div>
        `;
    }

    document.getElementById('scoreInfo').innerHTML = `
        ${bidRequirement}
        <div style="font-size: 1.1em; margin-bottom: 10px;">
            <strong>Rounds Won:</strong> 
            <span style="color: #2196F3;">Team 1: ${state.team1RoundsWon || 0}/10</span> | 
            <span style="color: #FF9800;">Team 2: ${state.team2RoundsWon || 0}/10</span>
        </div>
        <div>
            <strong>This Round Points:</strong><br>
            <strong>Team 1</strong> (${team1Players}): ${state.team1Points} |
            <strong>Team 2</strong> (${team2Players}): ${state.team2Points}
        </div>
        ${state.hasTrumpMarriage ? '<div style="color: #4CAF50; margin-top: 5px;">★ Trump Marriage: +4 bonus available</div>' : ''}
    `;

    if (state.phase === 'Waiting') {
        console.log('Phase is Waiting, showing lobby');
        document.getElementById('lobby').style.display = 'block';
        document.getElementById('game').style.display = 'none';
        updateLobby(state);
        console.log('Lobby updated');
    } else {
        document.getElementById('lobby').style.display = 'none';
        document.getElementById('game').style.display = 'block';

        document.getElementById('biddingSection').style.display = state.phase === 'Bidding' ? 'block' : 'none';
        document.getElementById('trumpChoiceSection').style.display = state.phase === 'ChooseTrump' ? 'block' : 'none';
        document.getElementById('playingSection').style.display = state.phase === 'Playing' ? 'block' : 'none';
        document.getElementById('roundEndSection').style.display = state.phase === 'RoundEnd' ? 'block' : 'none';

        if (state.phase === 'Bidding') {
            updateBidding(state);
        } else if (state.phase === 'ChooseTrump') {
            updateTrumpChoice(state);
        } else if (state.phase === 'Playing') {
            updatePlaying(state);
        } else if (state.phase === 'RoundEnd') {
            updateRoundEnd(state);
        }
    }
}

function updateLobby(state) {
    console.log('updateLobby called, players:', state.players);
    const playersDiv = document.getElementById('lobbyPlayers');
    playersDiv.innerHTML = '<h3>Players:</h3>' +
        state.players.map(p => `<div>${p.position + 1}. ${p.name}${p.isYou ? ' (You)' : ''}</div>`).join('');

    document.getElementById('startBtn').style.display =
        state.players.length === 4 ? 'block' : 'none';
    console.log('Start button display:', document.getElementById('startBtn').style.display);
}

function updateBidding(state) {
    const me = state.players.find(p => p.isYou);
    const isMyTurn = me && me.position === state.currentBidderPosition;

    let bidInfo = '<div class="players-status">';
    state.players.forEach(p => {
        const isCurrent = p.position === state.currentBidderPosition;
        bidInfo += `<div class="player-bid ${isCurrent ? 'current' : ''}">
            ${p.name}: ${p.hasPassed ? 'Passed' : (p.currentBid || 'Waiting')}
        </div>`;
    });
    bidInfo += '</div>';

    // Show player's hand during bidding (sorted by suit)
    bidInfo += '<div style="margin-top: 20px;"><h3>Your Hand (4 cards for bidding):</h3><div class="hand-cards">';
    if (state.yourHand && state.yourHand.length > 0) {
        const sortedHand = sortCards([...state.yourHand]);
        sortedHand.forEach(card => {
            bidInfo += `<span class="card" style="margin: 5px; padding: 10px; border: 1px solid #ccc; display: inline-block; background: white; border-radius: 5px;">
                ${renderCard(card)}
            </span>`;
        });
    }
    bidInfo += '</div></div>';

    document.getElementById('currentBidInfo').innerHTML = bidInfo;

    document.getElementById('bidControls').style.display = isMyTurn ? 'block' : 'none';

    if (isMyTurn) {
        const currentHighest = Math.max(...state.players.map(p => p.currentBid || 0), 15);
        document.getElementById('bidAmount').min = currentHighest + 1;
        document.getElementById('bidAmount').value = currentHighest + 1;
    }
}

function updateTrumpChoice(state) {
    const isContractor = myPosition === state.contractorPosition;
    console.log('updateTrumpChoice called. My position:', myPosition, 'Contractor position:', state.contractorPosition, 'Am I contractor?', isContractor);

    document.querySelectorAll('.trump-btn').forEach(btn => {
        btn.disabled = !isContractor;
        if (isContractor) {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        } else {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    });

    // Show player's hand when choosing trump
    const trumpSection = document.getElementById('trumpChoiceSection');
    let existingHandDiv = trumpSection.querySelector('.trump-hand-display');
    if (!existingHandDiv) {
        existingHandDiv = document.createElement('div');
        existingHandDiv.className = 'trump-hand-display';
        existingHandDiv.style.marginTop = '20px';
        trumpSection.appendChild(existingHandDiv);
    }

    existingHandDiv.innerHTML = '<h3>Your Hand (4 cards):</h3><div class="hand-cards" style="margin: 10px 0;">';
    if (state.yourHand && state.yourHand.length > 0) {
        const sortedHand = sortCards([...state.yourHand]);
        sortedHand.forEach(card => {
            existingHandDiv.innerHTML += `<span class="card" style="margin: 5px; padding: 10px; border: 1px solid #ccc; display: inline-block; background: white; border-radius: 5px;">
                ${renderCard(card)}
            </span>`;
        });
    }
    existingHandDiv.innerHTML += '</div>';
}

function updatePlaying(state) {
    console.log('updatePlaying - My position:', myPosition, 'Current player position:', state.currentPlayerPosition, 'My hand count:', state.yourHand?.length);
    console.log('Trump revealed?', state.trumpRevealed, 'Trump suit:', state.trumpSuit);

    const trickDiv = document.getElementById('currentTrick');
    trickDiv.innerHTML = '<h3>Current Trick</h3><div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">';
    state.currentTrick.forEach(pc => {
        const player = state.players.find(p => p.position === pc.playerPosition);
        trickDiv.innerHTML += `
            <div class="played-card" style="text-align: center; padding: 10px; border: 2px solid #333; border-radius: 8px; background: #f9f9f9;">
                <div style="font-weight: bold; margin-bottom: 5px;">${player.name}</div>
                <div style="font-size: 1.8em;">${renderCard(pc.card)}</div>
            </div>
        `;
    });
    trickDiv.innerHTML += '</div>';

    const handDiv = document.getElementById('handCards');
    handDiv.innerHTML = '';
    const isMyTurn = myPosition === state.currentPlayerPosition;
    console.log('Is my turn?', isMyTurn);

    if (state.yourHand) {
        const sortedHand = sortCards([...state.yourHand]);
        sortedHand.forEach(card => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            cardEl.style.cssText = 'display: inline-block; margin: 5px; padding: 12px; border: 2px solid #ccc; border-radius: 8px; background: white; cursor: pointer; transition: all 0.2s;';
            cardEl.innerHTML = renderCard(card);

            if (isMyTurn) {
                cardEl.classList.add('playable');
                cardEl.style.borderColor = '#4CAF50';
                cardEl.style.boxShadow = '0 2px 5px rgba(76,175,80,0.3)';
                cardEl.addEventListener('click', () => playCard(card.id));
                cardEl.addEventListener('mouseenter', () => {
                    cardEl.style.transform = 'translateY(-5px)';
                    cardEl.style.boxShadow = '0 5px 15px rgba(76,175,80,0.5)';
                });
                cardEl.addEventListener('mouseleave', () => {
                    cardEl.style.transform = 'translateY(0)';
                    cardEl.style.boxShadow = '0 2px 5px rgba(76,175,80,0.3)';
                });
            } else {
                cardEl.style.opacity = '0.6';
                cardEl.style.cursor = 'not-allowed';
            }

            handDiv.appendChild(cardEl);
        });
    }

    // Show "Ask for Trump" button when:
    // 1. It's my turn to play a card
    // 2. Trump has not been revealed yet
    // 3. We're in Playing phase (trick is active)
    const canShowAskTrump = myPosition === state.currentPlayerPosition &&
        !state.trumpRevealed;

    console.log('Ask Trump button visibility - My turn:', isMyTurn, 'Trump revealed:', state.trumpRevealed, 'Trick started:', state.currentTrick?.length >= 0, 'Show button:', canShowAskTrump);
    document.getElementById('askTrumpBtn').style.display = canShowAskTrump ? 'inline-block' : 'none';

    const currentPlayer = state.players.find(p => p.position === state.currentPlayerPosition);
    document.getElementById('phaseInfo').innerHTML = `Playing - Current Turn: <strong style="color: ${isMyTurn ? '#4CAF50' : '#333'};">${currentPlayer ? currentPlayer.name : ''}</strong>${isMyTurn ? ' (YOUR TURN!)' : ''}`;
}

function updateRoundEnd(state) {
    const messageLines = state.winMessage ? state.winMessage.split('\n') : [];
    const isGameOver = state.gameWinner != null;

    document.getElementById('winMessage').innerHTML = `
        <div style="white-space: pre-line;">${state.winMessage || ''}</div>
        <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
            <p><strong>This Round Points:</strong></p>
            <p>Team 1: ${state.team1Points} points | Team 2: ${state.team2Points} points</p>
            ${state.hasTrumpMarriage ? '<p style="color: #4CAF50;">★ Trump Marriage bonus included (+4)</p>' : ''}
            <p style="margin-top: 15px; font-size: 1.2em;"><strong>Rounds Won:</strong></p>
            <p>Team 1: ${state.team1RoundsWon || 0}/10 | Team 2: ${state.team2RoundsWon || 0}/10</p>
        </div>
    `;

    // Update button text based on whether game is over or just round
    const newRoundBtn = document.getElementById('newRoundBtn');
    if (isGameOver) {
        newRoundBtn.textContent = 'Start New Game';
        newRoundBtn.style.background = '#4CAF50';
        newRoundBtn.style.fontSize = '1.2em';
        newRoundBtn.style.padding = '15px 30px';
    } else {
        newRoundBtn.textContent = 'Next Round';
        newRoundBtn.style.background = '';
        newRoundBtn.style.fontSize = '';
        newRoundBtn.style.padding = '';
    }
}

function renderCard(card) {
    const symbol = suitSymbols[card.suit];
    const color = suitColors[card.suit];
    return `<span style="color: ${color}; font-size: 1.5em;">${card.rank}${symbol}</span>`;
}

function handleTrumpAsked(data) {
    showMessage(`Trump revealed: ${suitSymbols[data.trumpSuit]} ${data.trumpSuit}! ` +
        (data.contractorPlayedTrump ? `Contractor played ${data.trumpCard}` : 'Contractor has no trump'));
}

function showError(message) {
    showMessage('Error: ' + message, 'error');
}

function showMessage(message, type = 'info') {
    const messagesDiv = document.getElementById('messages');
    const msgEl = document.createElement('div');
    msgEl.className = `message ${type}`;
    msgEl.textContent = message;
    messagesDiv.appendChild(msgEl);

    setTimeout(() => msgEl.remove(), 5000);
}

// Chat functions
async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();

    if (!message || !currentRoomId) return;

    try {
        await connection.invoke("SendChatMessage", currentRoomId, message);
        input.value = '';
    } catch (err) {
        console.error('Error sending chat message:', err);
    }
}

function displayChatMessage(data) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.padding = '8px';
    messageDiv.style.background = 'white';
    messageDiv.style.borderRadius = '5px';
    messageDiv.style.borderLeft = '3px solid #2196F3';

    messageDiv.innerHTML = `
        <div style="font-weight: bold; color: #2196F3; font-size: 0.9em;">${data.playerName}</div>
        <div style="margin-top: 3px;">${data.message}</div>
        <div style="font-size: 0.75em; color: #999; margin-top: 3px;">${data.timestamp}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Show notification if chat is minimized or collapsed
    const chatBox = document.getElementById('chatBox');
    const isMinimized = chatBox.classList.contains('minimized');
    const isCollapsed = chatBox.classList.contains('collapsed');

    if (isMinimized || isCollapsed) {
        unreadCount++;
        updateChatBadge();

        // Visual notification
        const chatToggle = document.getElementById('chatToggle');
        chatToggle.style.animation = 'pulse 0.5s ease-in-out 3';
        setTimeout(() => {
            chatToggle.style.animation = '';
        }, 1500);
    }
}

initConnection();
