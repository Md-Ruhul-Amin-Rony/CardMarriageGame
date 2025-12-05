namespace TwentyNineGame.Models;

public class Card
{
    public string Suit { get; set; } = string.Empty;
    public string Rank { get; set; } = string.Empty;

    public int GetPoints()
    {
        return Rank switch
        {
            "J" => 3,
            "9" => 2,
            "A" => 1,
            "10" => 1,
            _ => 0
        };
    }

    public int GetPower()
    {
        return Rank switch
        {
            "J" => 8,
            "9" => 7,
            "A" => 6,
            "10" => 5,
            "K" => 4,
            "Q" => 3,
            "8" => 2,
            "7" => 1,
            _ => 0
        };
    }

    public string GetId()
    {
        return $"{Rank}{Suit}";
    }
}
