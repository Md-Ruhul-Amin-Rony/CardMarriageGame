# 🎴 29 Card Game - Online Multiplayer

A real-time, multiplayer implementation of the classic **29 Card Game** (also known as Twenty-Nine), a popular trick-taking card game from South Asia. Built with **ASP.NET Core** and **SignalR** for seamless real-time gameplay.

![.NET Version](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)
![SignalR](https://img.shields.io/badge/SignalR-7.0-00ADD8?logo=dotnet)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [About the Game](#about-the-game)
- [Features](#features)
- [Getting Started](#getting-started)
- [Game Rules](#game-rules)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎮 About the Game

**29 Card Game** is a strategic trick-taking card game played by 4 players in 2 teams. The game uses a 32-card deck (7, 8, 9, 10, J, Q, K, A of all suits) and involves bidding, trump selection, and tactical card play. The first team to win **10 rounds** wins the entire game!

### Key Highlights:
- 🃏 **32-card deck** with unique card rankings
- 👥 **4 players** in 2 teams (Team 1: P1 & P3 | Team 2: P2 & P4)
- 🎯 **Strategic bidding** system (minimum bid: 16 points)
- 🔒 **Hidden trump** mechanism with reveal options
- 💬 **Live chat** system for player interaction
- 📱 **Fully responsive** design for mobile and desktop

---

### ✨ Features

### 🎲 Core Gameplay
- ✅ **Real-time multiplayer** with SignalR WebSocket
- ✅ **4-player room system** with reconnection support
- ✅ **Bidding phase** with pass/bid options
- ✅ **Double Challenge** - Opposing team can double the stakes! 🔥
- ✅ **Trump selection** by contractor (hidden from opponents)
- ✅ **7a Trump Option** - Let a random card decide trump 🎲
- ✅ **Ask for Trump** mechanism with foul detection
- ✅ **Turn-based card playing** with visual feedback
- ✅ **Automatic trick resolution** with 3-second reveal
- ✅ **Tournament mode** - First to 10 rounds wins
- ✅ **Opposing team marriage** affects contractor's target points

### 🎨 User Experience
- ✅ **Responsive UI** - Works on mobile, tablet, and desktop
- ✅ **Card sorting** - Organized by suit and rank automatically
- ✅ **Visual indicators** - Current player highlighting with pulse animation
- ✅ **Live score tracking** - Team points and rounds won (X/10)
- ✅ **Bid requirement display** - Shows contractor's target and current progress
- ✅ **Trump marriage bonus** - +4 points indicator with visual feedback
- ✅ **Room browser** - Browse and join active games with one click
- ✅ **Circular table layout** - Poker-style visual design
- ✅ **Player avatars** - Gradient colored with initials
- ✅ **Team badges** - Color-coded teams (Blue/Orange)

### 💬 Social Features
- ✅ **Real-time chat** - In-game messaging
- ✅ **Collapsible chat box** - Minimize/maximize support
- ✅ **Unread notifications** - Badge counter for new messages
- ✅ **Player names** - Displayed on cards and scoreboard

### ⚖️ Game Logic
- ✅ **Foul detection** - Instant round loss for illegal "Ask Trump"
- ✅ **Trump power execution** - Correct trump card mechanics (J > 9 > A > 10 > K > Q > 8 > 7)
- ✅ **Lead suit validation** - Must follow suit if possible
- ✅ **Marriage bonus** - Trump marriage scoring (+4 points)
- ✅ **Opposing marriage penalty** - Contractor needs +4 more if opponents have marriage
- ✅ **Point calculation** - Accurate trick scoring system (J=3, 9=2, A=1, 10=1)
- ✅ **Double stakes** - Win/lose 2 rounds instead of 1 when doubled
- ✅ **Turn enforcement** - Players can only act on their turn
- ✅ **Card validation** - Prevents illegal plays

---

## 🚀 Getting Started

### Prerequisites
- **.NET 9.0 SDK** or higher
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Md-Ruhul-Amin-Rony/CardMarriageGame.git
cd CardMarriageGame
```

2. **Restore dependencies**
```bash
dotnet restore
```

3. **Run the application**
```bash
dotnet run
```

4. **Open in browser**
```
http://localhost:5000
```

### Quick Start
1. Open 4 browser tabs/windows (or use with friends online)
2. Enter different player names in each
3. Use the same Room ID for all players (or browse active rooms)
4. Click "Join Room" in each tab
5. Once 4 players join, click "Start Game"
6. Enjoy playing!

### Testing Locally
- Open multiple private/incognito windows to simulate different players
- Use different browsers (Chrome, Firefox, Edge) for testing
- Each connection represents a unique player

---

## 📖 Game Rules

### Setup
- **4 players** in 2 teams: Team 1 (Position 0 & 2), Team 2 (Position 1 & 3)
- **32 cards**: 7, 8, 9, 10, J, Q, K, A in Hearts, Diamonds, Clubs, Spades
- Each player receives **4 cards** initially for bidding

### Card Rankings
**Trump Suit:** J > 9 > A > 10 > K > Q > 8 > 7  
**Other Suits:** A > 10 > K > Q > 9 > 8 > 7 > J (Jack is lowest)

### Point Values
- **Jacks (J):** 3 points each
- **Nines (9):** 2 points each
- **Aces (A):** 1 point each
- **Tens (10):** 1 point each
- **Total deck points:** 28 points

### Game Flow

#### 1️⃣ **Bidding Phase**
- Players bid in turn starting from Position 0
- Minimum bid: **16 points**
- Each player can bid higher or pass
- Last bidder becomes the **contractor**
- After bidding, each player receives **4 more cards** (total 8 cards)

#### 2️⃣ **Trump Selection**
- After bidding completes, **opposing team** can choose to **DOUBLE** the stakes
  - Accept Double: Winner gets **+2 rounds** instead of 1 (higher risk/reward)
  - Decline: Normal scoring continues (winner gets +1 round)
- Contractor chooses trump suit (hidden from others)
- **Trump Options:**
  - Select any suit: ♥ Hearts, ♦ Diamonds, ♣ Clubs, ♠ Spades
  - **🎲 7a Option:** Let the 7th card (contractor's 3rd from 2nd batch) decide trump
- Only contractor knows the trump initially

#### 3️⃣ **Playing Phase**
- Contractor leads the first trick
- Players must follow lead suit if possible
- Highest card of lead suit (or trump) wins the trick
- Winner leads next trick

#### 4️⃣ **Ask for Trump**
- Any player can ask for trump **when it's their turn**
- **Requirements:** 
  - A trick must have started (at least 1 card played)
  - Player must have **NO cards of the lead suit** (void)
- **Result:**
  - Trump suit is revealed to all
  - Contractor must play a trump card if they have one
- **⚠️ FOUL:** If a player asks for trump but has lead suit cards, opposing team wins the round instantly!

#### 5️⃣ **Trump Marriage Bonus**
- If contractor has **King and Queen of trump suit**
- Bonus: **+4 points** (if contractor's team scores ≥16 points)
- **⚠️ Important:** If opposing team also has trump marriage (K+Q), contractor needs **+4 additional points** to win

#### 6️⃣ **Scoring**
- Contractor's team must score **≥ bid amount** to win the round
- If opposing team has marriage: Required = Bid + 4
- If successful: Contractor's team wins the round (1 or 2 rounds if doubled)
- If failed: Opposing team wins the round (1 or 2 rounds if doubled)

#### 7️⃣ **Winning the Game**
- First team to win **10 rounds** wins the entire game!

---

## 🎓 Strategy Tips & Best Practices

### Bidding Strategy
- **Conservative Approach:** Only bid if you have strong high-value cards (J, 9, A, 10)
- **Trump Potential:** Bid higher if you have multiple cards of one suit (potential trump)
- **Marriage Power:** Bid aggressively if you have K+Q of a suit
- **Position Matters:** Last bidder has advantage (knows all other bids)
- **Minimum Risk:** Pass early if your hand is weak (< 3 point cards)

### Trump Selection
- **Strong Suit:** Choose suit where you have J, 9, or marriage (K+Q)
- **7a Option:** Use when unsure or to add unpredictability
- **Card Count:** Prefer suit with 4+ cards for better control
- **Avoid Weak Suits:** Don't choose trump if you only have low cards (7, 8)

### Double Challenge Decision
- **Accept Double When:**
  - Contractor's bid is high (23+) and you have strong cards
  - You have trump marriage in multiple suits
  - Contractor seems inexperienced
- **Decline Double When:**
  - Contractor's bid is conservative (16-18)
  - Your hand is weak
  - Risk/reward ratio is poor

### Playing Strategy
- **Lead Strong:** When leading, play high-value cards to win tricks
- **Trump Timing:** Save trump cards for crucial tricks
- **Ask for Trump Carefully:** Only ask when you're CERTAIN you have no lead suit cards (foul = instant loss!)
- **Track Cards:** Remember which cards have been played
- **Team Communication:** Use chat to coordinate (within game rules)
- **Marriage Reveal:** Play K or Q of trump to signal marriage to partner

### Common Mistakes to Avoid
- ❌ **Foul Risk:** Never ask for trump if you have even one lead suit card
- ❌ **Overbidding:** Don't bid too high with weak hands
- ❌ **Trump Waste:** Don't use trump on low-value tricks
- ❌ **Early Pass:** Don't pass too quickly in bidding if you have decent cards
- ❌ **Ignoring Marriage:** Always check for K+Q combinations when choosing trump

---

## 🛠️ Technology Stack

### Backend
- **Framework:** ASP.NET Core 9.0
- **Real-time:** SignalR 7.0
- **Language:** C# 12
- **Architecture:** Hub-Service pattern with in-memory state management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive design with Flexbox/Grid, gradient animations
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **SignalR Client** - Real-time bidirectional communication

### State Management
- **In-memory storage** - Dictionary-based game state (ConcurrentDictionary for thread safety)
- **Session persistence** - Reconnection support by player name
- **Real-time sync** - All clients updated via SignalR broadcasts
- **Personalized views** - Each player sees appropriate game information (trump visibility)

---

## 📁 Project Structure

```
CardMarriageGam/
│
├── Hubs/
│   └── GameHub.cs              # SignalR hub for real-time communication
│
├── Services/
│   └── GameService.cs          # Core game logic and state management
│
├── Models/
│   ├── Card.cs                 # Card model with suit and rank
│   ├── GameState.cs            # Main game state model
│   ├── Player.cs               # Player model with hand and position
│   └── Trick.cs                # Trick model for current round
│
├── wwwroot/
│   ├── index.html              # Main UI structure
│   ├── app.js                  # Client-side game logic
│   └── styles.css              # Responsive styling
│
├── Program.cs                  # Application entry point
├── TwentyNineGame.csproj       # Project configuration
└── README.md                   # This file
```

### Key Components

#### `GameHub.cs`
SignalR hub managing real-time events:
- `JoinRoom` - Player joins a game room
- `StartGame` - Initiates a new round
- `PlaceBid` - Handles bidding
- `ChooseTrump` - Contractor selects trump
- `PlayCard` - Player plays a card
- `AskForTrump` - Reveals trump with validation
- `SendChatMessage` - Broadcasts chat messages

#### `GameService.cs`
Core game logic:
- Room and player management
- Card dealing (4+4 system)
- Bidding validation
- Trick resolution
- Scoring calculation
- Round/game winner determination
- Foul detection for "Ask Trump"

#### `app.js`
Client-side features:
- SignalR connection management
- UI state synchronization
- Card sorting and rendering
- Turn-based interaction
- Chat functionality
- Responsive design handling

---

## 🌐 Deployment

### Local Development
```bash
# Run locally
dotnet run

# Access at http://localhost:5000
# Open multiple tabs for testing
```

### Docker Deployment
```bash
# Build Docker image
docker build -t twentynine-game .

# Run container
docker run -p 8080:8080 twentynine-game

# Access at http://localhost:8080
```

### Option 1: Railway.app (Recommended)
1. Push code to GitHub
2. Sign up at https://railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Select repository → Auto-deploys!
5. Free $5 credit monthly
6. **Note:** Railway supports .NET 9.0 natively

### Option 2: Render.com
1. Push to GitHub
2. Sign up at https://render.com
3. Create "New Web Service"
4. Configure:
   - **Build Command:** `dotnet publish -c Release -o ./publish`
   - **Start Command:** `cd publish && dotnet TwentyNineGame.dll`
   - **Environment:** Docker (uses Dockerfile)
5. Auto-deploys on git push

### Option 3: Azure App Service
```bash
# Install Azure CLI
az login

# Create resources
az group create --name CardGameRG --location eastus
az appservice plan create --name CardGamePlan --resource-group CardGameRG --sku F1
az webapp create --name cardgame29-yourname --resource-group CardGameRG --plan CardGamePlan --runtime "DOTNET|9.0"

# Publish and deploy
dotnet publish -c Release -o ./publish
cd publish
Compress-Archive -Path * -DestinationPath ../app.zip -Force
cd ..
az webapp deployment source config-zip --resource-group CardGameRG --name cardgame29-yourname --src app.zip
```

### Environment Variables
Configure these for production:
```bash
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:8080
```

---

## ❓ Frequently Asked Questions (FAQ)

### Gameplay Questions

**Q: Can I play with only 2 or 3 players?**  
A: No, the game requires exactly 4 players to start in a room. This is a core rule of the 29 card game.

**Q: What happens if someone disconnects during the game?**  
A: The game state is preserved. The disconnected player can rejoin using the same name. However, if the server restarts, all game data is lost.

**Q: Can I see the trump suit before it's revealed?**  
A: Only the contractor can see the trump suit initially. Others see it when someone successfully "Asks for Trump."

**Q: What is the "7a" option?**  
A: Instead of choosing a specific suit, the contractor can let the 7th card in the deck determine the trump. This adds randomness and excitement!

**Q: How does the double challenge work?**  
A: After bidding, the opposing team can choose to double the stakes. If they accept, the winner of that round gets +2 rounds instead of +1 (and loser loses -2).

**Q: What happens if I ask for trump but have cards of the lead suit?**  
A: This is called a FOUL. The opposing team instantly wins the round. Be very careful!

**Q: Can both teams have trump marriage?**  
A: Yes! If the opposing team has K+Q of trump, the contractor needs to score 4 additional points (Bid + 4) to win the round.

### Technical Questions

**Q: Do I need to create an account?**  
A: No, the game is completely anonymous. Just enter a name and start playing!

**Q: Can I play on mobile?**  
A: Yes! The UI is fully responsive and works great on phones and tablets.

**Q: Is there a time limit for turns?**  
A: Currently no, but this is on the roadmap for future updates.

**Q: Can spectators watch the game?**  
A: Not yet, but spectator mode is planned for a future release.

**Q: How many games can run simultaneously?**  
A: The server can handle around 100+ concurrent rooms depending on resources.

**Q: Is my game data saved?**  
A: No, all game state is in-memory and resets when the server restarts. Database persistence is planned.

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

---

## 🐛 Known Issues & Roadmap

### Current Limitations
- In-memory state (resets on server restart - no persistence)
- Single server only (no horizontal scaling due to in-memory state)
- No authentication (anonymous gameplay only)
- No game history or replay functionality

### Future Enhancements
- [ ] Persistent storage (MongoDB/Redis for game state)
- [ ] User authentication and profiles
- [ ] Game history and statistics tracking
- [ ] Spectator mode (watch games without playing)
- [ ] AI opponents for practice mode
- [ ] Sound effects and enhanced animations
- [ ] Multiple language support (i18n)
- [ ] Tournament brackets system
- [ ] Global leaderboards and player rankings
- [ ] Private rooms with password protection
- [ ] Mobile native apps (iOS/Android)
- [ ] Card dealing animations
- [ ] Undo last card (with team agreement)
- [ ] Time limits for turns
- [ ] Emoji reactions during gameplay

---

## 🎯 Troubleshooting

### Common Issues

**Connection Failed**
- Check if server is running on correct port (default: 5000)
- Ensure firewall allows the port
- Try refreshing the page

**Room Full Error**
- Maximum 4 players per room
- Create a new room or wait for players to leave

**Cards Not Showing**
- Clear browser cache and refresh
- Check console for JavaScript errors
- Ensure SignalR connection is established

**Trump Not Revealing**
- Trump only reveals when someone "Asks for Trump" correctly
- Player must have no cards of lead suit to ask
- Asking with lead suit cards = FOUL (opponent wins round)

**Reconnection Not Working**
- Use exact same player name when rejoining
- Room must still exist (not cleared)
- Connection ID will be updated automatically

---

## 🔒 Security Considerations

### Current Implementation
- No authentication (suitable for casual play)
- Room IDs are public (anyone can join with ID)
- No rate limiting on API calls
- In-memory state prevents data breaches

### Production Recommendations
- Implement JWT authentication
- Add rate limiting middleware
- Use HTTPS in production
- Validate all user inputs on server-side
- Implement CORS policies
- Add logging and monitoring
- Use environment variables for sensitive config

---

## 📊 Performance Optimization

### Current Performance
- WebSocket connections for low latency
- Minimal database overhead (in-memory)
- Client-side card sorting and rendering
- Personalized state reduces data transfer

### Scaling Considerations
- Current: Single server supports ~100 concurrent rooms
- For scaling: Consider Redis for shared state
- SignalR backplane for multi-server deployment
- CDN for static assets
- Implement connection pooling

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Traditional 29 card game community from South Asia (India, Bangladesh, Nepal)
- SignalR team at Microsoft for the excellent real-time framework
- ASP.NET Core team for the robust web framework
- All contributors, testers, and players who provided feedback
- Card game enthusiasts worldwide who keep traditional games alive

---

## 📞 Contact & Support

- **Issues:** Report bugs via [GitHub Issues](https://github.com/Md-Ruhul-Amin-Rony/CardMarriageGame/issues)
- **Discussions:** Join conversations in [GitHub Discussions](https://github.com/Md-Ruhul-Amin-Rony/CardMarriageGame/discussions)
- **Contributions:** See [Contributing](#-contributing) section above

---

## 📈 Project Stats

- **Language:** C# (.NET 9.0)
- **Code Lines:** ~2000+ lines
- **Last Updated:** December 2025
- **Status:** Active Development
- **License:** MIT

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ for card game enthusiasts

</div>
