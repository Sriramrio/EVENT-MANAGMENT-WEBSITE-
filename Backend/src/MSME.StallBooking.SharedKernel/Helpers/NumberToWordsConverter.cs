namespace MSME.StallBooking.SharedKernel.Helpers;

public static class NumberToWordsConverter
{
    private static readonly string[] Units =
    {
        "", "One", "Two", "Three", "Four", "Five",
        "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen",
        "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    };

    private static readonly string[] Tens =
    {
        "", "", "Twenty", "Thirty", "Forty",
        "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    };

    public static string Convert(decimal amount)
    {
        long rupees = (long)Math.Floor(amount);
        int paise = (int)((amount - rupees) * 100);

        var result = ConvertNumber(rupees) + " Only";

        if (paise > 0)
        {
            result = $"{ConvertNumber(rupees)} and {ConvertNumber(paise)} Paise Only";
        }

        return result;
    }

    private static string ConvertNumber(long number)
    {
        if (number == 0)
            return "Zero";

        if (number < 20)
            return Units[number];

        if (number < 100)
            return Tens[number / 10] +
                   ((number % 10 > 0) ? " " + ConvertNumber(number % 10) : "");

        if (number < 1000)
            return ConvertNumber(number / 100) + " Hundred" +
                   ((number % 100 > 0) ? " " + ConvertNumber(number % 100) : "");

        if (number < 100000)
            return ConvertNumber(number / 1000) + " Thousand" +
                   ((number % 1000 > 0) ? " " + ConvertNumber(number % 1000) : "");

        if (number < 10000000)
            return ConvertNumber(number / 100000) + " Lakh" +
                   ((number % 100000 > 0) ? " " + ConvertNumber(number % 100000) : "");

        return ConvertNumber(number / 10000000) + " Crore" +
               ((number % 10000000 > 0) ? " " + ConvertNumber(number % 10000000) : "");
    }
}