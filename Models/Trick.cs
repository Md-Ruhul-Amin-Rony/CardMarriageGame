namespace TwentyNineGame.Models;

public class Trick
{
    public List<PlayedCard> Cards { get; set; } = new();
    public string? LeadSuit { get; set; }
    public int LeadPlayerPosition { get; set; }
}

public class PlayedCard
{
    public int PlayerPosition { get; set; }
    public Card Card { get; set; } = new();
}
