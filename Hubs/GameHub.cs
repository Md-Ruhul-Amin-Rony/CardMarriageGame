using Microsoft.AspNetCore.SignalR;
using TwentyNineGame.Services;
using TwentyNineGame.Models;

namespace TwentyNineGame.Hubs;

public class GameHub : Hub
{
    private readonly GameService _gameService;

    public GameHub(GameService gameService)
    {
        _gameService = gameService;
    }

    public async Task JoinRoom(string roomId, string playerName)
    {
        try
        {
            var game = _gameService.CreateOrJoinRoom(roomId, Context.ConnectionId, playerName);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await BroadcastGameState(roomId);
        }
        catch (Exception ex)
        {
            await Clients.Caller.SendAsync("Error", ex.Message);
        }
    }

    public async Task StartGame(string roomId)
    {
        _gameService.StartGame(roomId);
        await BroadcastGameState(roomId);
    }

    public async Task PlaceBid(string roomId, int? bid)
    {
        _gameService.PlaceBid(roomId, Context.ConnectionId, bid);
        await BroadcastGameState(roomId);
    }

    public async Task ChooseTrump(string roomId, string trumpSuit)
    {
        _gameService.ChooseTrump(roomId, Context.ConnectionId, trumpSuit);
        await BroadcastGameState(roomId);
    }

    public async Task PlayCard(string roomId, string cardId)
    {
        var result = _gameService.PlayCard(roomId, Context.ConnectionId, cardId);
        if (!result.Success)
        {
            await Clients.Caller.SendAsync("Error", result.Message);
        }
        else
        {
            await BroadcastGameState(roomId);
        }
    }

    public async Task AskForTrump(string roomId)
    {
        var result = _gameService.AskForTrump(roomId, Context.ConnectionId);
        if (!result.Success)
        {
            if (result.IsFoul)
            {
                // Foul occurred - broadcast to all players and update game state
                await Clients.Group(roomId).SendAsync("Error", result.Message);
                await BroadcastGameState(roomId);
            }
            else
            {
                // Regular error - only send to caller
                await Clients.Caller.SendAsync("Error", result.Message);
            }
        }
        else
        {
            await Clients.Group(roomId).SendAsync("TrumpAsked", new
            {
                TrumpSuit = result.TrumpSuit,
                ContractorPlayedTrump = result.ContractorPlayedTrump,
                TrumpCard = result.TrumpCard
            });
            await BroadcastGameState(roomId);
        }
    }

    public async Task SendChatMessage(string roomId, string message)
    {
        var game = _gameService.GetGame(roomId);
        if (game == null) return;

        var player = game.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
        if (player == null) return;

        await Clients.Group(roomId).SendAsync("ReceiveChatMessage", new
        {
            PlayerName = player.Name,
            Message = message,
            Timestamp = DateTime.Now.ToString("HH:mm")
        });
    }

    private async Task BroadcastGameState(string roomId)
    {
        var game = _gameService.GetGame(roomId);
        if (game == null) return;

        foreach (var player in game.Players)
        {
            var personalizedState = CreatePersonalizedState(game, player.ConnectionId);
            await Clients.Client(player.ConnectionId).SendAsync("GameState", personalizedState);
        }
    }

    private object CreatePersonalizedState(GameState game, string connectionId)
    {
        var player = game.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        bool isContractor = player != null && player.Position == game.ContractorPosition;

        return new
        {
            game.RoomId,
            game.Phase,
            Players = game.Players.Select(p => new
            {
                p.Name,
                p.Position,
                HandCount = p.Hand.Count,
                IsYou = p.ConnectionId == connectionId,
                p.CurrentBid,
                p.HasPassed
            }),
            game.CurrentBidderPosition,
            game.ContractorPosition,
            game.ContractorBid,
            TrumpSuit = (isContractor || game.TrumpRevealed) ? game.TrumpSuit : null,
            game.TrumpRevealed,
            YourHand = player?.Hand.Select(c => new { Id = c.GetId(), c.Suit, c.Rank }),
            game.CurrentPlayerPosition,
            CurrentTrick = game.CurrentTrick.Cards.Select(pc => new
            {
                pc.PlayerPosition,
                Card = new { Id = pc.Card.GetId(), pc.Card.Suit, pc.Card.Rank }
            }),
            game.Team1Points,
            game.Team2Points,
            game.HasTrumpMarriage,
            game.WinMessage,
            game.Team1RoundsWon,
            game.Team2RoundsWon,
            game.GameWinner
        };
    }
}
