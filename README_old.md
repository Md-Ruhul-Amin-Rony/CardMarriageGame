# 29 Card Game - ASP.NET Core + SignalR

A real-time multiplayer implementation of the Bangladeshi 29 card game using ASP.NET Core 7 and SignalR.

## Features

- 4-player multiplayer game with real-time updates
- Teams: Players 1&3 vs Players 2&4
- Complete bidding system (minimum 16)
- Hidden trump selection by contractor
- "Ask for Trump" mechanic for opponents
- Trump marriage bonus (+4 points)
- Full trick resolution with power ordering
- In-memory game state (no database required)

## How to Run

1. Ensure you have .NET 7 SDK installed
2. Navigate to project directory
3. Run:
   ```bash
   dotnet restore
   dotnet run
   ```
4. Open browser to `http://localhost:5000` (or the port shown in terminal)
5. Open 4 browser tabs, enter same Room ID, and start playing

## Game Rules

### Deck
- Only 7, 8, 9, 10, J, Q, K, A in all 4 suits (32 cards total, no jokers)

### Points
- Jack (J) = 3 points
- Nine (9) = 2 points
- Ace (A) = 1 point
- Ten (10) = 1 point
- Others = 0 points

### Power Order (within a suit)
J > 9 > A > 10 > K > Q > 8 > 7

### Bidding
- Minimum bid: 16
- Highest bidder becomes contractor
- Contractor chooses a hidden trump suit

### Trump Reveal Rules
- Contractor can voluntarily reveal trump by playing it
- Opponent can "Ask for Trump" if:
  - It's their turn for this trick
  - Trump is still hidden
  - They have no cards of the lead suit
- When asked:
  - Trump suit is revealed to all
  - If contractor has trump, must play one immediately
  - If contractor has no trump, just reveals suit

### Follow Rules (after trump revealed)
- Must follow lead suit if you have it
- If no lead suit and have trump, must play trump
- Otherwise play any card

### Marriage
- If contractor has K+Q of trump in initial hand = trump marriage
- Adds +4 bonus to contractor's team points (only if >= 16 points scored)

### Winning
- Contractor's team must score >= contractor's bid to win

## Project Structure

```
TwentyNineGame/
├── TwentyNineGame.csproj
├── Program.cs
├── Models/
│   ├── Card.cs
│   ├── Player.cs
│   ├── Trick.cs
│   └── GameState.cs
├── Services/
│   └── GameService.cs
├── Hubs/
│   └── GameHub.cs
└── wwwroot/
    ├── index.html
    ├── app.js
    └── styles.css
```

## Technologies

- ASP.NET Core 7
- SignalR for real-time communication
- Vanilla JavaScript frontend
- In-memory state management

Enjoy the game!
