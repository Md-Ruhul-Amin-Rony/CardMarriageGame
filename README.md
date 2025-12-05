# 🎴 29 Card Game - Online Multiplayer

A real-time, multiplayer implementation of the classic **29 Card Game** (also known as Twenty-Nine), a popular trick-taking card game from South Asia. Built with **ASP.NET Core** and **SignalR** for seamless real-time gameplay.

![.NET Version](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet)
![SignalR](https://img.shields.io/badge/SignalR-7.0-00ADD8?logo=dotnet)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [About the Game](#-about-the-game)
- [Features](#-features)
- [Getting Started](#-getting-started)
- [Game Rules](#-game-rules)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

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

## ✨ Features

### 🎲 Core Gameplay
- ✅ **Real-time multiplayer** with SignalR
- ✅ **4-player room system** with reconnection support
- ✅ **Bidding phase** with pass/bid options
- ✅ **Trump selection** by contractor (hidden from opponents)
- ✅ **Ask for Trump** mechanism with foul detection
- ✅ **Turn-based card playing** with visual feedback
- ✅ **Automatic trick resolution** and scoring
- ✅ **Tournament mode** - First to 10 rounds wins

### 🎨 User Experience
- ✅ **Responsive UI** - Works on mobile, tablet, and desktop
- ✅ **Card sorting** - Organized by suit and rank
- ✅ **Visual indicators** - Current player highlighting
- ✅ **Live score tracking** - Team points and rounds won
- ✅ **Bid requirement display** - Shows contractor's target
- ✅ **Trump marriage bonus** - +4 points indicator

### 💬 Social Features
- ✅ **Real-time chat** - In-game messaging
- ✅ **Collapsible chat box** - Minimize/maximize support
- ✅ **Unread notifications** - Badge counter for new messages
- ✅ **Player names** - Displayed on cards and scoreboard

### ⚖️ Game Logic
- ✅ **Foul detection** - Instant round loss for illegal "Ask Trump"
- ✅ **Trump power execution** - Correct trump card mechanics
- ✅ **Lead suit validation** - Must follow suit if possible
- ✅ **Marriage bonus** - Trump marriage scoring (+4 points)
- ✅ **Point calculation** - Accurate trick scoring system

---

## 🚀 Getting Started

### Prerequisites
- **.NET 9.0 SDK** or higher
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/card-game-29.git
cd card-game-29
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
1. Open 4 browser tabs/windows
2. Enter different player names in each
3. Use the same Room ID for all players
4. Click "Join Room" in each tab
5. Once 4 players join, click "Start Game"
6. Enjoy playing!

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
- Contractor chooses trump suit (hidden from others)
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

#### 6️⃣ **Scoring**
- Contractor's team must score **≥ bid amount** to win the round
- If successful: Contractor's team wins the round
- If failed: Opposing team wins the round

#### 7️⃣ **Winning the Game**
- First team to win **10 rounds** wins the entire game!

---

## 🛠️ Technology Stack

### Backend
- **Framework:** ASP.NET Core 9.0
- **Real-time:** SignalR 7.0
- **Language:** C# 12
- **Architecture:** Hub-Service pattern

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Responsive design with Flexbox/Grid
- **JavaScript (ES6+)** - Vanilla JS, no frameworks
- **SignalR Client** - Real-time bidirectional communication

### State Management
- **In-memory storage** - Dictionary-based game state
- **Session persistence** - Reconnection by player name
- **Real-time sync** - All clients updated via SignalR

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

### Option 1: Railway.app (Recommended)
1. Push code to GitHub
2. Sign up at https://railway.app
3. Click "New Project" → "Deploy from GitHub"
4. Select repository → Auto-deploys!
5. Free $5 credit monthly

### Option 2: Render.com
1. Push to GitHub
2. Sign up at https://render.com
3. Create "New Web Service"
4. Configure:
   - Build: `dotnet publish -c Release -o ./publish`
   - Start: `cd publish && dotnet TwentyNineGame.dll`

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
- In-memory state (resets on server restart)
- Single server only (no horizontal scaling)

### Future Enhancements
- [ ] Persistent storage (MongoDB/Redis)
- [ ] User authentication and profiles
- [ ] Game history and statistics
- [ ] Spectator mode
- [ ] AI opponents for practice
- [ ] Sound effects and animations
- [ ] Multiple language support
- [ ] Tournament brackets
- [ ] Leaderboards

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Thanks to the traditional 29 card game community
- SignalR team for excellent real-time framework
- All contributors and players

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ for card game enthusiasts

</div>
# CardMarriageGame
#   C a r d M a r r i a g e G a m e  
 