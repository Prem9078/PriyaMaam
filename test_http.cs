using System.Net.Http;
var client = new HttpClient();
client.DefaultRequestHeaders.Add("Accept", "application/json"); 
client.DefaultRequestHeaders.Add("Accept-Encoding", "gzip, deflate"); 
System.Console.WriteLine("Success");
