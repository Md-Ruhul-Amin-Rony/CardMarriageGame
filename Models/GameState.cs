namespace TwentyNineGame.Models;

public class GameState
{
    public string RoomId { get; set; } = string.Empty;
    public List<Player> Players { get; set; } = new();
    public List<Card> Deck { get; set; } = new();
    public string Phase { get; set; } = "Waiting";
    public int CurrentBidderPosition { get; set; }
    public int ContractorPosition { get; set; } = -1;
    public int ContractorBid { get; set; }
    public string? TrumpSuit { get; set; }
    public bool TrumpRevealed { get; set; }
    public Trick CurrentTrick { get; set; } = new();
    public int CurrentPlayerPosition { get; set; }
    public List<Trick> CompletedTricks { get; set; } = new();
    public int Team1Points { get; set; }
    public int Team2Points { get; set; }
    public bool HasTrumpMarriage { get; set; }
    public string? WinMessage { get; set; }
    public int Team1RoundsWon { get; set; } = 0;
    public int Team2RoundsWon { get; set; } = 0;
    public string? GameWinner { get; set; }
}
