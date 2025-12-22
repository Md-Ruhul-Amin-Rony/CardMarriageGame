using TwentyNineGame.Models;

namespace TwentyNineGame.Services;

public class GameService
{
    private readonly Dictionary<string, GameState> _games = new();

    private readonly Dictionary<string, string> suitSymbols = new()
    {
        { "Hearts", "♥" },
        { "Diamonds", "♦" },
        { "Clubs", "♣" },
        { "Spades", "♠" }
    };

    public GameState? GetGame(string roomId)
    {
        return _games.ContainsKey(roomId) ? _games[roomId] : null;
    }

    public List<object> GetAllRooms()
    {
        return _games.Select(g => new
        {
            RoomId = g.Key,
            PlayerCount = g.Value.Players.Count,
            PlayerNames = g.Value.Players.Select(p => p.Name).ToList(),
            Phase = g.Value.Phase,
            IsFull = g.Value.Players.Count >= 4
        }).ToList<object>();
    }

    public void ClearRoom(string roomId)
    {
        if (_games.ContainsKey(roomId))
        {
            _games.Remove(roomId);
        }
    }

    public GameState CreateOrJoinRoom(string roomId, string connectionId, string playerName)
    {
        if (!_games.ContainsKey(roomId))
        {
            _games[roomId] = new GameState { RoomId = roomId };
        }

        var game = _games[roomId];

        // Check if this connection already exists in the room
        var existingPlayer = game.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (existingPlayer != null)
        {
            return game;
        }

        // Check if player with same name exists (reconnection scenario)
        var playerByName = game.Players.FirstOrDefault(p => p.Name == playerName);
        if (playerByName != null)
        {
            // Update connection ID for reconnection
            playerByName.ConnectionId = connectionId;
            return game;
        }

        // Check if room is full
        if (game.Players.Count >= 4)
        {
            throw new Exception("Room is full");
        }

        // Add new player
        game.Players.Add(new Player
        {
            ConnectionId = connectionId,
            Name = playerName,
            Position = game.Players.Count
        });

        return game;
    }

    public void StartGame(string roomId)
    {
        var game = GetGame(roomId);
        if (game == null || game.Players.Count != 4) return;

        // If there's a game winner, reset the entire game (start fresh)
        if (!string.IsNullOrEmpty(game.GameWinner))
        {
            game.Team1RoundsWon = 0;
            game.Team2RoundsWon = 0;
            game.GameWinner = null;
        }

        InitializeDeck(game);
        ShuffleDeck(game);
        DealInitialCards(game); // Deal first 4 cards to each player

        game.Phase = "Bidding";
        // Randomize starting player for first round, or use last trick winner for subsequent rounds
        if (game.CurrentTrick == null || game.CurrentTrick.LeadPlayerPosition == -1)
        {
            var rng = new Random();
            game.CurrentBidderPosition = rng.Next(0, 4);
        }
        else
        {
            // Use the lead player from current trick (which is the last trick winner)
            game.CurrentBidderPosition = game.CurrentTrick.LeadPlayerPosition;
        }
        game.TrumpRevealed = false;
        game.PlayerWhoAskedForTrump = -1;
        game.TrumpSuit = null;
        game.Team1Points = 0;
        game.Team2Points = 0;
        game.ContractorPosition = -1;
        game.ContractorBid = 0;
        game.HasTrumpMarriage = false;
        game.OpposingTeamHasTrumpMarriage = false;
        game.IsDoubled = false;
        game.WinMessage = null;

        foreach (var player in game.Players)
        {
            player.CurrentBid = null;
            player.HasPassed = false;
        }
    }

    private void InitializeDeck(GameState game)
    {
        var suits = new[] { "Hearts", "Diamonds", "Clubs", "Spades" };
        var ranks = new[] { "7", "8", "9", "10", "J", "Q", "K", "A" };

        game.Deck = new List<Card>();
        foreach (var suit in suits)
        {
            foreach (var rank in ranks)
            {
                game.Deck.Add(new Card { Suit = suit, Rank = rank });
            }
        }
    }

    private void ShuffleDeck(GameState game)
    {
        var rng = new Random();
        game.Deck = game.Deck.OrderBy(_ => rng.Next()).ToList();
    }

    private void DealInitialCards(GameState game)
    {
        // Deal first 4 cards to each player for bidding phase
        int cardIndex = 0;
        foreach (var player in game.Players)
        {
            player.Hand = game.Deck.Skip(cardIndex).Take(4).ToList();
            cardIndex += 4;
        }
    }

    private void DealRemainingCards(GameState game)
    {
        // Deal remaining 4 cards to each player after trump is chosen
        // Players should already have 4 cards, we're adding 4 more for a total of 8
        int cardIndex = 16; // Skip the first 16 cards already dealt
        for (int i = 0; i < game.Players.Count; i++)
        {
            var player = game.Players[i];
            Console.WriteLine($"Player {i} ({player.Name}) has {player.Hand.Count} cards before dealing remaining");

            var remainingCards = game.Deck.Skip(cardIndex).Take(4).ToList();

            // Add the new 4 cards
            foreach (var card in remainingCards)
            {
                if (!player.Hand.Any(c => c.Suit == card.Suit && c.Rank == card.Rank))
                {
                    player.Hand.Add(card);
                }
            }

            Console.WriteLine($"Player {i} ({player.Name}) now has {player.Hand.Count} cards after dealing remaining");
            cardIndex += 4;
        }
    }

    public void PlaceBid(string roomId, string connectionId, int? bid)
    {
        var game = GetGame(roomId);
        if (game == null || game.Phase != "Bidding") return;

        var player = game.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (player == null || player.Position != game.CurrentBidderPosition) return;

        if (bid == null)
        {
            player.HasPassed = true;
        }
        else
        {
            if (bid < 16) return;
            var currentHighest = game.Players.Max(p => p.CurrentBid ?? 0);
            if (bid <= currentHighest) return;

            player.CurrentBid = bid;
        }

        int activeBidders = game.Players.Count(p => !p.HasPassed);
        if (activeBidders == 1)
        {
            var contractor = game.Players.First(p => !p.HasPassed);
            game.ContractorPosition = contractor.Position;
            game.ContractorBid = contractor.CurrentBid ?? 16;
            game.Phase = "DoubleChallenge"; // New phase for opposing team to decide
        }
        else
        {
            game.CurrentBidderPosition = GetNextBidder(game);
        }
    }

    private int GetNextBidder(GameState game)
    {
        int next = (game.CurrentBidderPosition + 1) % 4;
        while (game.Players[next].HasPassed)
        {
            next = (next + 1) % 4;
        }
        return next;
    }

    public void RespondToDoubleChallenge(string roomId, string connectionId, bool acceptDouble)
    {
        var game = GetGame(roomId);
        if (game == null || game.Phase != "DoubleChallenge") return;

        var player = game.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (player == null) return;

        // Only opposing team members can respond
        bool isContractorTeam1 = (game.ContractorPosition == 0 || game.ContractorPosition == 2);
        bool isPlayerOpposingTeam = isContractorTeam1 ?
            (player.Position == 1 || player.Position == 3) :
            (player.Position == 0 || player.Position == 2);

        if (!isPlayerOpposingTeam) return;

        game.IsDoubled = acceptDouble;
        game.Phase = "ChooseTrump";
    }

    public void ChooseTrump(string roomId, string connectionId, string trumpSuit)
    {
        var game = GetGame(roomId);
        if (game == null || game.Phase != "ChooseTrump") return;

        var player = game.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (player == null || player.Position != game.ContractorPosition) return;

        // Check if "7a" option is selected (7th card determines trump)
        if (trumpSuit == "7a")
        {
            // The 7th card = contractor's 3rd card from the second batch
            // First 16 cards (4 per player) already dealt at indices 0-15
            // Remaining 16 cards start at index 16
            // Contractor gets 4 cards from second batch based on position
            // 7th card overall = 4 (initial) + 3 (from second batch)
            // Index = 16 + (contractor position * 4) + 2
            int seventhCardIndex = 16 + (game.ContractorPosition * 4) + 2;
            if (game.Deck.Count > seventhCardIndex)
            {
                var seventhCard = game.Deck[seventhCardIndex];
                game.TrumpSuit = seventhCard.Suit;
            }
            else
            {
                // Fallback if deck doesn't have enough cards (shouldn't happen)
                game.TrumpSuit = game.Deck[16].Suit;
            }
        }
        else
        {
            game.TrumpSuit = trumpSuit;
        }

        game.TrumpRevealed = false;

        // Deal remaining 4 cards to each player after trump is chosen
        DealRemainingCards(game);

        // Marriage will be checked when trump is revealed (not here)

        game.Phase = "Playing";
        // Use the starting player determined in StartGame (either random or previous round winner)
        game.CurrentPlayerPosition = game.CurrentBidderPosition;
        game.CurrentTrick = new Trick { LeadPlayerPosition = game.CurrentBidderPosition };
    }

    public PlayCardResult PlayCard(string roomId, string connectionId, string cardId)
    {
        var game = GetGame(roomId);
        if (game == null || game.Phase != "Playing")
            return new PlayCardResult { Success = false, Message = "Not in playing phase" };

        var player = game.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (player == null || player.Position != game.CurrentPlayerPosition)
            return new PlayCardResult { Success = false, Message = "Not your turn" };

        var card = player.Hand.FirstOrDefault(c => c.GetId() == cardId);
        if (card == null)
            return new PlayCardResult { Success = false, Message = "Card not found" };

        if (!IsValidPlay(game, player, card))
            return new PlayCardResult { Success = false, Message = "Invalid card play" };

        player.Hand.Remove(card);
        game.CurrentTrick.Cards.Add(new PlayedCard { PlayerPosition = player.Position, Card = card });

        if (game.CurrentTrick.Cards.Count == 1)
        {
            game.CurrentTrick.LeadSuit = card.Suit;
        }

        // Trump is NOT automatically revealed when contractor plays trump card
        // It's only revealed when someone explicitly asks for it

        if (game.CurrentTrick.Cards.Count == 4)
        {
            // Mark that trick is complete but not yet resolved (for UI display)
            game.Phase = "TrickComplete";
            return new PlayCardResult { Success = true };
        }
        else
        {
            game.CurrentPlayerPosition = (game.CurrentPlayerPosition + 1) % 4;
        }

        return new PlayCardResult { Success = true };
    }

    public void ResolveCompleteTrick(string roomId)
    {
        var game = GetGame(roomId);
        // Check if phase is TrickComplete to prevent duplicate calls
        if (game == null || game.Phase != "TrickComplete") return;

        // Immediately change phase to prevent race condition (multiple clients calling this)
        game.Phase = "Resolving";

        ResolveTrick(game);
        game.PlayerWhoAskedForTrump = -1; // Reset after trick completes

        if (game.Players.All(p => p.Hand.Count == 0))
        {
            EndRound(game);
        }
        else
        {
            game.Phase = "Playing";
            game.CurrentTrick = new Trick { LeadPlayerPosition = game.CurrentPlayerPosition };
        }
    }

    private bool IsValidPlay(GameState game, Player player, Card card)
    {
        if (game.CurrentTrick.Cards.Count == 0) return true;

        var leadSuit = game.CurrentTrick.LeadSuit;
        bool hasLeadSuit = player.Hand.Any(c => c.Suit == leadSuit);
        bool hasTrump = game.TrumpRevealed && player.Hand.Any(c => c.Suit == game.TrumpSuit);

        // Special rule: If this player asked for trump and has trump cards, they MUST play trump
        if (game.PlayerWhoAskedForTrump == player.Position && hasTrump)
        {
            return card.Suit == game.TrumpSuit;
        }

        // Normal rule: Must follow lead suit if player has it
        if (hasLeadSuit && card.Suit != leadSuit) return false;

        // Other players (who didn't ask for trump) are NOT forced to play trump
        // They can play any card when void in lead suit

        return true;
    }

    private void ResolveTrick(GameState game)
    {
        var trick = game.CurrentTrick;
        var winningCard = trick.Cards[0];
        int winnerPosition = trick.Cards[0].PlayerPosition;

        foreach (var played in trick.Cards.Skip(1))
        {
            if (IsCardStronger(game, played.Card, winningCard.Card, trick.LeadSuit!))
            {
                winningCard = played;
                winnerPosition = played.PlayerPosition;
            }
        }

        int trickPoints = trick.Cards.Sum(pc => pc.Card.GetPoints());
        if (winnerPosition == 0 || winnerPosition == 2)
        {
            game.Team1Points += trickPoints;
        }
        else
        {
            game.Team2Points += trickPoints;
        }

        game.CompletedTricks.Add(trick);
        game.CurrentPlayerPosition = winnerPosition;
    }

    private bool IsCardStronger(GameState game, Card challenger, Card current, string leadSuit)
    {
        if (game.TrumpRevealed)
        {
            bool challengerIsTrump = challenger.Suit == game.TrumpSuit;
            bool currentIsTrump = current.Suit == game.TrumpSuit;

            if (challengerIsTrump && !currentIsTrump) return true;
            if (!challengerIsTrump && currentIsTrump) return false;
            if (challengerIsTrump && currentIsTrump)
            {
                return challenger.GetPower() > current.GetPower();
            }
        }

        if (challenger.Suit != leadSuit) return false;
        if (current.Suit != leadSuit) return true;

        return challenger.GetPower() > current.GetPower();
    }

    private void EndRound(GameState game)
    {
        game.Phase = "RoundEnd";

        bool isContractorTeam1 = (game.ContractorPosition == 0 || game.ContractorPosition == 2);
        int contractorTeamPoints = isContractorTeam1 ? game.Team1Points : game.Team2Points;

        if (game.HasTrumpMarriage && contractorTeamPoints >= 16)
        {
            contractorTeamPoints += 4;
        }

        // If opposing team has trump marriage, contractor needs 4 more points to win
        int requiredPoints = game.ContractorBid;
        if (game.OpposingTeamHasTrumpMarriage)
        {
            requiredPoints += 4;
        }

        bool contractorWins = contractorTeamPoints >= requiredPoints;

        // Determine rounds to award (1 normal, 2 if doubled)
        int roundsToAward = game.IsDoubled ? 2 : 1;
        string doubleNote = game.IsDoubled ? " 🔥 DOUBLED! (2 rounds)" : "";

        // Award round win to the winning team
        if (contractorWins)
        {
            if (isContractorTeam1)
                game.Team1RoundsWon += roundsToAward;
            else
                game.Team2RoundsWon += roundsToAward;

            string marriageNote = game.OpposingTeamHasTrumpMarriage ? $" (Required: {requiredPoints} due to opposing marriage)" : "";
            game.WinMessage = $"Contractor (Player {game.ContractorPosition + 1}) wins! Scored {contractorTeamPoints} (bid: {game.ContractorBid}{marriageNote}){doubleNote}";
        }
        else
        {
            // Opposing team wins the round
            if (isContractorTeam1)
                game.Team2RoundsWon += roundsToAward;
            else
                game.Team1RoundsWon += roundsToAward;

            string marriageNote = game.OpposingTeamHasTrumpMarriage ? $" (Required: {requiredPoints} due to opposing marriage)" : "";
            game.WinMessage = $"Contractor (Player {game.ContractorPosition + 1}) fails! Scored {contractorTeamPoints} (bid: {game.ContractorBid}{marriageNote}){doubleNote}";
        }

        // Check if a team has won 10 rounds (overall game winner)
        if (game.Team1RoundsWon >= 10)
        {
            game.GameWinner = "Team 1";
            game.WinMessage += $"\n\n🎉 GAME OVER! Team 1 wins the game! (10 rounds won)";
        }
        else if (game.Team2RoundsWon >= 10)
        {
            game.GameWinner = "Team 2";
            game.WinMessage += $"\n\n🎉 GAME OVER! Team 2 wins the game! (10 rounds won)";
        }
    }

    private void CheckMarriages(GameState game)
    {
        bool isContractorTeam1 = (game.ContractorPosition == 0 || game.ContractorPosition == 2);

        // Check contractor's marriage
        var contractor = game.Players[game.ContractorPosition];
        bool contractorHasKing = contractor.Hand.Any(c => c.Suit == game.TrumpSuit && c.Rank == "K");
        bool contractorHasQueen = contractor.Hand.Any(c => c.Suit == game.TrumpSuit && c.Rank == "Q");
        game.HasTrumpMarriage = contractorHasKing && contractorHasQueen;

        // Check opposing team's marriage
        var opposingPlayers = game.Players.Where(p =>
            isContractorTeam1 ? (p.Position == 1 || p.Position == 3) : (p.Position == 0 || p.Position == 2)
        ).ToList();

        game.OpposingTeamHasTrumpMarriage = opposingPlayers.Any(p =>
            p.Hand.Any(c => c.Suit == game.TrumpSuit && c.Rank == "K") &&
            p.Hand.Any(c => c.Suit == game.TrumpSuit && c.Rank == "Q")
        );
    }

    public AskTrumpResult AskForTrump(string roomId, string connectionId)
    {
        var game = GetGame(roomId);
        if (game == null || game.Phase != "Playing")
            return new AskTrumpResult { Success = false, Message = "Not in playing phase" };

        var player = game.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (player == null)
            return new AskTrumpResult { Success = false, Message = "Player not found" };

        if (game.TrumpRevealed)
            return new AskTrumpResult { Success = false, Message = "Trump already revealed" };

        // Cannot ask for trump when leading the trick (starting it)
        if (game.CurrentTrick.Cards.Count == 0)
            return new AskTrumpResult { Success = false, Message = "Cannot ask for trump when leading the trick" };

        var leadSuit = game.CurrentTrick.LeadSuit;

        // FOUL: If player asks for trump but has cards of lead suit, opposing team wins the round
        if (!string.IsNullOrEmpty(leadSuit) && player.Hand.Any(c => c.Suit == leadSuit))
        {
            // Get the cards player had of lead suit for detailed message
            var leadSuitCards = player.Hand.Where(c => c.Suit == leadSuit).ToList();
            var cardsList = string.Join(", ", leadSuitCards.Select(c => $"{c.Rank}{suitSymbols[c.Suit]}"));

            // Determine which team the player belongs to
            bool isFoulPlayerTeam1 = (player.Position == 0 || player.Position == 2);

            // Award the round to the opposing team
            if (isFoulPlayerTeam1)
            {
                game.Team2RoundsWon++;
                game.WinMessage = $"⚠️ FOUL COMMITTED! ⚠️\n\n" +
                    $"Player: {player.Name} (Position {player.Position + 1}, Team 1)\n" +
                    $"Violation: Asked for trump while holding lead suit cards\n" +
                    $"Lead Suit: {leadSuit}\n" +
                    $"Cards in hand: {cardsList}\n\n" +
                    $"🏆 Team 2 wins the round by default!";
            }
            else
            {
                game.Team1RoundsWon++;
                game.WinMessage = $"⚠️ FOUL COMMITTED! ⚠️\n\n" +
                    $"Player: {player.Name} (Position {player.Position + 1}, Team 2)\n" +
                    $"Violation: Asked for trump while holding lead suit cards\n" +
                    $"Lead Suit: {leadSuit}\n" +
                    $"Cards in hand: {cardsList}\n\n" +
                    $"🏆 Team 1 wins the round by default!";
            }

            // Check if a team has won 10 rounds (overall game winner)
            if (game.Team1RoundsWon >= 10)
            {
                game.GameWinner = "Team 1";
                game.WinMessage += $"\n\n🎉 GAME OVER! Team 1 wins the game! (10 rounds won)";
            }
            else if (game.Team2RoundsWon >= 10)
            {
                game.GameWinner = "Team 2";
                game.WinMessage += $"\n\n🎉 GAME OVER! Team 2 wins the game! (10 rounds won)";
            }

            game.Phase = "RoundEnd";

            return new AskTrumpResult
            {
                Success = false,
                Message = $"⚠️ FOUL! You asked for trump but you have {leadSuitCards.Count} card(s) of {leadSuit}: {cardsList}. Opposing team wins the round!",
                IsFoul = true
            };
        }

        // Simply reveal trump - the asking player will play their own card
        // Contractor does NOT automatically play
        game.TrumpRevealed = true;
        game.PlayerWhoAskedForTrump = player.Position;

        // Check marriages for both teams when trump is revealed
        CheckMarriages(game);

        return new AskTrumpResult
        {
            Success = true,
            TrumpSuit = game.TrumpSuit,
            ContractorPlayedTrump = false
        };
    }
}

public class PlayCardResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class AskTrumpResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? TrumpSuit { get; set; }
    public bool ContractorPlayedTrump { get; set; }
    public string? TrumpCard { get; set; }
    public bool IsFoul { get; set; }
}
