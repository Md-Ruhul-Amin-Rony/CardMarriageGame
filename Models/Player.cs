namespace TwentyNineGame.Models;

public class Player
{
    public string ConnectionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Position { get; set; }
    public int? SelectedTeam { get; set; } // 1 or 2, null if not selected
    public List<Card> Hand { get; set; } = new();
    public int? CurrentBid { get; set; }
    public bool HasPassed { get; set; }
}