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
    connection.on("TrumpChosen7a", handleTrumpChosen7a);
    connection.on("ReceiveChatMessage", displayChatMessage);
    connection.on("RoomList", updateRoomList);
    connection.on("RoomCleared", handleRoomCleared);

    connection.start()
        .then(() => {
            console.log('SignalR Connected');
            loadRooms();
        })
        .catch(err => {
            console.error('SignalR Connection Error:', err);
            showError('Failed to connect to server. Please refresh the page.');
        });
}

function loadRooms() {
    if (connection && connection.state === 'Connected') {
        connection.invoke("GetRooms").catch(err => console.error('Get Rooms Error:', err));
    }
}

function updateRoomList(rooms) {
    const roomListDiv = document.getElementById('roomList');

    if (!rooms || rooms.length === 0) {
        roomListDiv.innerHTML = '<p class="no-rooms">No active rooms yet. Create one above!</p>';
        return;
    }

    roomListDiv.innerHTML = rooms.map(room => `
        <div class="room-card ${room.isFull ? 'full' : ''}" onclick="${room.isFull ? '' : `joinRoomById('${room.roomId}')`}">
            <div class="room-info">
                <div class="room-id">🎮 Room: ${room.roomId}</div>
                <div class="room-players">
                    <span>👥 ${room.playerCount}/4 players</span>
                    ${room.playerNames.length > 0 ? `<br><span class="player-names">${room.playerNames.join(', ')}</span>` : ''}
                </div>
            </div>
            <div class="room-status ${room.isFull ? 'full' : (room.phase === 'Playing' ? 'playing' : 'waiting')}">
                ${room.isFull ? '🔒 FULL' : (room.phase === 'Waiting' ? '🟢 JOIN' : '🎯 PLAYING')}
            </div>
        </div>
    `).join('');
}

function joinRoomById(roomId) {
    const playerNameInput = document.getElementById('playerName');
    const roomIdInput = document.getElementById('roomId');

    if (!playerNameInput.value.trim()) {
        showError('Please enter your name first');
        return;
    }

    roomIdInput.value = roomId;
    joinRoom();
}

function handleRoomCleared() {
    showMessage('Game ended. Room has been cleared. Returning to lobby...');
    setTimeout(() => {
        location.reload();
    }, 2000);
}

document.getElementById('joinBtn').addEventListener('click', joinRoom);
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('placeBidBtn').addEventListener('click', placeBid);
document.getElementById('passBtn').addEventListener('click', passBid);
document.getElementById('acceptDoubleBtn').addEventListener('click', () => respondToDouble(true));
document.getElementById('declineDoubleBtn').addEventListener('click', () => respondToDouble(false));
document.getElementById('askTrumpBtn').addEventListener('click', askForTrump);
document.getElementById('newRoundBtn').addEventListener('click', startGame);
document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});
document.getElementById('refreshRoomsBtn').addEventListener('click', () => {
    loadRooms();
    showMessage('🔄 Refreshing rooms...');
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

async function respondToDouble(accept) {
    console.log('Responding to double:', accept);
    try {
        await connection.invoke("RespondToDouble", currentRoomId, accept);
        console.log('Double response sent');
    } catch (err) {
        console.error('Error responding to double:', err);
        alert('Failed to respond: ' + err.message);
    }
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

    // Update player positions on the table
    updatePlayerPositions(state);

    // Activate chat box after joining room (start minimized)
    const chatBox = document.getElementById('chatBox');
    if (!chatBox.classList.contains('active')) {
        chatBox.classList.add('active');
        chatBox.classList.add('minimized'); // Start minimized by default
        // Also collapsed on mobile
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
        document.getElementById('doubleChallengeSection').style.display = state.phase === 'DoubleChallenge' ? 'block' : 'none';
        document.getElementById('trumpChoiceSection').style.display = state.phase === 'ChooseTrump' ? 'block' : 'none';
        document.getElementById('playingSection').style.display = (state.phase === 'Playing' || state.phase === 'TrickComplete') ? 'block' : 'none';
        document.getElementById('roundEndSection').style.display = state.phase === 'RoundEnd' ? 'block' : 'none';

        if (state.phase === 'Bidding') {
            updateBidding(state);
        } else if (state.phase === 'DoubleChallenge') {
            updateDoubleChallenge(state);
        } else if (state.phase === 'ChooseTrump') {
            updateTrumpChoice(state);
        } else if (state.phase === 'Playing') {
            updatePlaying(state);
        } else if (state.phase === 'TrickComplete') {
            updateTrickComplete(state);
        } else if (state.phase === 'RoundEnd') {
            updateRoundEnd(state);
        }
    }
}

function updateLobby(state) {
    console.log('updateLobby called, players:', state.players);
    const playersDiv = document.getElementById('lobbyPlayers');

    // Find current player
    const me = state.players.find(p => p.isYou);
    const allTeamsSelected = state.players.every(p => p.selectedTeam !== null && p.selectedTeam !== undefined);
    const team1Count = state.players.filter(p => p.selectedTeam === 1).length;
    const team2Count = state.players.filter(p => p.selectedTeam === 2).length;
    const teamsBalanced = team1Count === 2 && team2Count === 2;

    // Build team-based display
    let playersHTML = '<h3>Players & Teams:</h3>';
    playersHTML += '<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px;">';
    playersHTML += '<p style="color: #666; font-size: 0.9em; margin-bottom: 15px;">🎯 Choose your team (2 players per team)</p>';

    // Team 1
    playersHTML += '<div style="background: #e3f2fd; padding: 12px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #2196F3;">';
    playersHTML += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
    playersHTML += '<strong style="color: #2196F3;">👥 Team 1:</strong>';
    if (me && (me.selectedTeam === null || me.selectedTeam === undefined)) {
        const team1Full = team1Count >= 2;
        playersHTML += `<button onclick="selectTeam(1)" ${team1Full ? 'disabled' : ''} style="padding: 5px 15px; background: ${team1Full ? '#ccc' : '#2196F3'}; color: white; border: none; border-radius: 5px; cursor: ${team1Full ? 'not-allowed' : 'pointer'}; font-size: 0.9em;">${team1Full ? 'Full' : 'Join Team 1'}</button>`;
    } else if (me && me.selectedTeam === 1) {
        playersHTML += '<span style="color: #4CAF50; font-weight: bold; font-size: 0.9em;">✓ Your Team</span>';
    }
    playersHTML += '</div>';
    const team1Players = state.players.filter(p => p.selectedTeam === 1);
    if (team1Players.length > 0) {
        team1Players.forEach(p => {
            playersHTML += `<div style="margin-top: 5px;">• ${p.name}${p.isYou ? ' <strong>(You)</strong>' : ''}</div>`;
        });
    } else {
        playersHTML += '<div style="color: #999; font-style: italic; margin-top: 5px;">Waiting for players...</div>';
    }
    playersHTML += `<div style="margin-top: 5px; font-size: 0.85em; color: #666;">${team1Count}/2 players</div>`;
    playersHTML += '</div>';

    // Team 2
    playersHTML += '<div style="background: #fff3e0; padding: 12px; border-radius: 6px; border-left: 4px solid #FF9800;">';
    playersHTML += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">';
    playersHTML += '<strong style="color: #FF9800;">👥 Team 2:</strong>';
    if (me && (me.selectedTeam === null || me.selectedTeam === undefined)) {
        const team2Full = team2Count >= 2;
        playersHTML += `<button onclick="selectTeam(2)" ${team2Full ? 'disabled' : ''} style="padding: 5px 15px; background: ${team2Full ? '#ccc' : '#FF9800'}; color: white; border: none; border-radius: 5px; cursor: ${team2Full ? 'not-allowed' : 'pointer'}; font-size: 0.9em;">${team2Full ? 'Full' : 'Join Team 2'}</button>`;
    } else if (me && me.selectedTeam === 2) {
        playersHTML += '<span style="color: #4CAF50; font-weight: bold; font-size: 0.9em;">✓ Your Team</span>';
    }
    playersHTML += '</div>';
    const team2Players = state.players.filter(p => p.selectedTeam === 2);
    if (team2Players.length > 0) {
        team2Players.forEach(p => {
            playersHTML += `<div style="margin-top: 5px;">• ${p.name}${p.isYou ? ' <strong>(You)</strong>' : ''}</div>`;
        });
    } else {
        playersHTML += '<div style="color: #999; font-style: italic; margin-top: 5px;">Waiting for players...</div>';
    }
    playersHTML += `<div style="margin-top: 5px; font-size: 0.85em; color: #666;">${team2Count}/2 players</div>`;
    playersHTML += '</div>';

    // Status message
    if (!allTeamsSelected) {
        playersHTML += '<div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center; color: #856404;">⏳ Waiting for all players to select teams...</div>';
    } else if (!teamsBalanced) {
        playersHTML += '<div style="background: #ffebee; padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center; color: #c62828;">⚠️ Teams must be balanced (2 vs 2)</div>';
    } else {
        playersHTML += '<div style="background: #e8f5e9; padding: 10px; border-radius: 5px; margin-top: 10px; text-align: center; color: #2e7d32;">✅ All teams ready! Click Start Game</div>';
    }

    playersHTML += '</div>';

    playersDiv.innerHTML = playersHTML;

    // Only show start button if all conditions are met
    document.getElementById('startBtn').style.display =
        state.players.length === 4 && allTeamsSelected && teamsBalanced ? 'block' : 'none';
    console.log('Start button display:', document.getElementById('startBtn').style.display);
}

async function selectTeam(teamNumber) {
    try {
        await connection.invoke("SelectTeam", currentRoomId, teamNumber);
        console.log('Team selected:', teamNumber);
    } catch (err) {
        console.error('Error selecting team:', err);
        alert('Failed to select team: ' + err.message);
    }
}

function updateDoubleChallenge(state) {
    const me = state.players.find(p => p.isYou);
    const contractor = state.players.find(p => p.position === state.contractorPosition);

    // Check if I'm on the opposing team
    const isContractorTeam1 = (state.contractorPosition === 0 || state.contractorPosition === 2);
    const isMyTeamOpposing = isContractorTeam1 ?
        (myPosition === 1 || myPosition === 3) :
        (myPosition === 0 || myPosition === 2);

    const team1Players = state.players.filter(p => p.position === 0 || p.position === 2).map(p => p.name).join(' & ');
    const team2Players = state.players.filter(p => p.position === 1 || p.position === 3).map(p => p.name).join(' & ');
    const opposingTeamNames = isContractorTeam1 ? team2Players : team1Players;

    document.getElementById('doubleInfo').innerHTML = `
        <h3 style="color: #764ba2; margin-bottom: 15px;">💰 Bidding Complete!</h3>
        <p><strong>Contractor:</strong> ${contractor.name} (Bid: ${state.contractorBid} points)</p>
        <p style="margin-top: 10px;"><strong>Opposing Team:</strong> ${opposingTeamNames}</p>
        <hr style="margin: 15px 0; border-color: #ffc107;">
        <p style="font-size: 0.95em; color: #666;">The opposing team can now choose to <strong style="color: #f5576c;">DOUBLE</strong> the stakes!</p>
    `;

    // Only show buttons to opposing team members
    document.getElementById('acceptDoubleBtn').style.display = isMyTeamOpposing ? 'inline-block' : 'none';
    document.getElementById('declineDoubleBtn').style.display = isMyTeamOpposing ? 'inline-block' : 'none';

    if (!isMyTeamOpposing) {
        document.getElementById('doubleInfo').innerHTML += `
            <p style="margin-top: 15px; text-align: center; color: #999; font-style: italic;">
                ⏳ Waiting for opposing team to decide...
            </p>
        `;
    }
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
    // 3. At least one card has been played (not leading the trick)
    const canShowAskTrump = myPosition === state.currentPlayerPosition &&
        !state.trumpRevealed &&
        state.currentTrick && state.currentTrick.length > 0;

    console.log('Ask Trump button visibility - My turn:', isMyTurn, 'Trump revealed:', state.trumpRevealed, 'Trick cards:', state.currentTrick?.length, 'Show button:', canShowAskTrump);
    document.getElementById('askTrumpBtn').style.display = canShowAskTrump ? 'inline-block' : 'none';

    const currentPlayer = state.players.find(p => p.position === state.currentPlayerPosition);
    document.getElementById('phaseInfo').innerHTML = `Playing - Current Turn: <strong style="color: ${isMyTurn ? '#4CAF50' : '#333'};">${currentPlayer ? currentPlayer.name : ''}</strong>${isMyTurn ? ' (YOUR TURN!)' : ''}`;
}

function updateTrickComplete(state) {
    // Show all 4 cards for 3 seconds before resolving
    console.log('Trick Complete! Showing all cards...');

    const trickDiv = document.getElementById('currentTrick');
    trickDiv.innerHTML = '<h3>🎯 Trick Complete!</h3><div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; animation: cardReveal 0.5s ease-in-out;">';
    state.currentTrick.forEach(pc => {
        const player = state.players.find(p => p.position === pc.playerPosition);
        trickDiv.innerHTML += `
            <div class="played-card" style="text-align: center; padding: 15px; border: 3px solid #FFD700; border-radius: 10px; background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%); animation: cardFlip 0.6s ease;">
                <div style="font-weight: bold; margin-bottom: 8px; color: #667eea;">${player.name}</div>
                <div style="font-size: 2.2em;">${renderCard(pc.card)}</div>
            </div>
        `;
    });
    trickDiv.innerHTML += '</div><p style="text-align: center; margin-top: 15px; color: #764ba2; font-weight: bold; animation: blink 1s infinite;">⏳ Calculating winner...</p>';

    // Hide hand and ask trump button during trick resolution
    document.getElementById('handCards').style.opacity = '0.5';
    document.getElementById('askTrumpBtn').style.display = 'none';
    document.getElementById('phaseInfo').innerHTML = '🎲 Resolving trick...';

    // After 3 seconds, resolve the trick
    setTimeout(() => {
        connection.invoke("ResolveTrick", currentRoomId).catch(err => console.error('Resolve Trick Error:', err));
    }, 3000);
}

function updateRoundEnd(state) {
    const messageLines = state.winMessage ? state.winMessage.split('\n') : [];
    const isGameOver = state.gameWinner != null;
    const isFoul = state.winMessage && state.winMessage.includes('FOUL');

    document.getElementById('winMessage').innerHTML = `
        <div style="white-space: pre-line; ${isFoul ? 'background: #ffebee; border: 3px solid #f44336; padding: 20px; border-radius: 10px; color: #c62828; font-weight: bold;' : ''}">${state.winMessage || ''}</div>
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
        newRoundBtn.textContent = '🏆 Game Over - Return to Lobby';
        newRoundBtn.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
        newRoundBtn.style.fontSize = '1.2em';
        newRoundBtn.style.padding = '15px 30px';
        newRoundBtn.onclick = () => {
            connection.invoke("ClearRoom", currentRoomId)
                .then(() => {
                    showMessage('🎉 Thanks for playing! Returning to lobby...');
                    setTimeout(() => location.reload(), 1500);
                })
                .catch(err => console.error('Clear Room Error:', err));
        };
    } else {
        newRoundBtn.textContent = '▶️ Next Round';
        newRoundBtn.style.background = '';
        newRoundBtn.style.fontSize = '';
        newRoundBtn.style.padding = '';
        newRoundBtn.onclick = startGame;
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

function handleTrumpChosen7a(data) {
    showMessage(`🎲 7a Card selected! You are the contractor. Trump is: ${suitSymbols[data.trumpSuit]} ${data.trumpSuit} (Only you know this)`);
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

function updatePlayerPositions(state) {
    if (!state.players || state.players.length === 0) return;

    // Generate avatar initial from name
    function getAvatar(name) {
        if (!name) return '👤';
        return name.charAt(0).toUpperCase();
    }

    // Get avatar color based on position
    function getAvatarColor(position) {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',  // Position 0 - Purple
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',  // Position 1 - Pink
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',  // Position 2 - Blue
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'   // Position 3 - Green
        ];
        return colors[position] || colors[0];
    }

    state.players.forEach(player => {
        const position = player.position !== undefined ? player.position : player.Position;
        const playerDiv = document.getElementById(`player-${position}`);
        if (!playerDiv) return;

        const avatarDiv = playerDiv.querySelector('.player-avatar');
        const nameDiv = playerDiv.querySelector('.player-name');
        const cardCountDiv = playerDiv.querySelector('.player-card-count');

        // Update avatar
        avatarDiv.textContent = getAvatar(player.name);
        avatarDiv.style.background = getAvatarColor(position);

        // Update name
        const isYou = player.isYou || player.IsYou;
        nameDiv.textContent = isYou ? `${player.name} (You)` : player.name;

        // Update card count
        const handCount = player.handCount !== undefined ? player.handCount : player.HandCount;
        cardCountDiv.textContent = handCount ? `${handCount} cards` : '';

        // Add team badge if not already present
        let teamBadge = playerDiv.querySelector('.player-team-badge');
        if (!teamBadge) {
            teamBadge = document.createElement('div');
            teamBadge.className = 'player-team-badge';
            playerDiv.appendChild(teamBadge);
        }

        const isTeam1 = position === 0 || position === 2;
        teamBadge.className = `player-team-badge ${isTeam1 ? 'team1-badge' : 'team2-badge'}`;
        teamBadge.textContent = isTeam1 ? 'Team 1' : 'Team 2';

        // Highlight current player's turn
        const currentPlayerPosition = state.currentPlayerPosition !== undefined ? state.currentPlayerPosition : state.CurrentPlayerPosition;
        if (position === currentPlayerPosition) {
            playerDiv.classList.add('active-turn');
        } else {
            playerDiv.classList.remove('active-turn');
        }

        // Highlight contractor
        const contractorPosition = state.contractorPosition !== undefined ? state.contractorPosition : state.ContractorPosition;
        if (position === contractorPosition) {
            playerDiv.classList.add('contractor');
        } else {
            playerDiv.classList.remove('contractor');
        }
    });
}

initConnection();
