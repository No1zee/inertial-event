using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Management; // Add reference
using System.Security.Cryptography;

namespace InstallerHelper
{
    class Program
    {
        private static readonly HttpClient client = new HttpClient();
        private const string API_URL = "http://localhost:3000/api";

        static async Task<int> Main(string[] args)
        {
            Console.WriteLine("NovaStream Installer - License Check");
            Console.WriteLine("----------------------------------");

            try
            {
                // 1. Generate Device ID
                string deviceId = GetDeviceId();
                string machineName = Environment.MachineName;
                Console.WriteLine($"Device ID: {deviceId}");

                // 2. Request Access
                Console.WriteLine("Contacting Keygen Server...");
                var json = $"{{\"device_id\": \"{deviceId}\", \"machine_name\": \"{machineName}\", \"machine_fingerprint\": \"installer-v1\"}}";
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await client.PostAsync($"{API_URL}/request-access", content);
                string respBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Error requesting access: {response.StatusCode}");
                    return 1603; // Fatal error
                }

                // Extract Request ID (Simulated JSON parsing for simplicity)
                // In production use Newtonsoft.Json
                string requestId = ExtractJsonValue(respBody, "request_id");
                Console.WriteLine($"Request ID: {requestId}");
                Console.WriteLine("Waiting for admin approval... (Press 'C' to cancel)");

                // 3. Poll for Approval
                string licenseKey = null;
                int attempts = 0;
                while (attempts < 60) // 5 minutes timeout
                {
                    await Task.Delay(5000);
                    
                    var statusJson = $"{{\"request_id\": \"{requestId}\"}}";
                    var statusResponse = await client.PostAsync($"{API_URL}/check-status", new StringContent(statusJson, Encoding.UTF8, "application/json"));
                    string statusBody = await statusResponse.Content.ReadAsStringAsync();

                    if (statusBody.Contains("\"status\":\"approved\""))
                    {
                        licenseKey = ExtractJsonValue(statusBody, "license_key");
                        break;
                    }
                    else if (statusBody.Contains("\"status\":\"rejected\""))
                    {
                         Console.WriteLine("Request rejected by admin.");
                         return 1602; // User cancel
                    }
                    
                    Console.Write(".");
                    attempts++;
                }

                if (string.IsNullOrEmpty(licenseKey))
                {
                    Console.WriteLine("Timeout waiting for approval.");
                    return 1602; 
                }

                // 4. Save License
                string ProgramData = Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData);
                string AppDir = Path.Combine(ProgramData, "NovaStream");
                Directory.CreateDirectory(AppDir);
                File.WriteAllText(Path.Combine(AppDir, "license.dat"), licenseKey);

                Console.WriteLine("License acquired! Proceeding with install.");
                return 0; // Success

            }
            catch (Exception ex)
            {
                Console.WriteLine($"Critical Error: {ex.Message}");
                return 1603;
            }
        }

        static string GetDeviceId()
        {
            // Simple simulation of nodejs logic in C#
            // In real app use ManagementObjectSearcher for CPU ID
            return "installer-generated-id-" + Environment.MachineName;
        }

        static string ExtractJsonValue(string json, string key)
        {
            // Poor man's JSON parser to avoid dependencies for this scaffold
            int keyIndex = json.IndexOf($"\"{key}\"");
            if (keyIndex == -1) return null;

            int valueStart = json.IndexOf(":", keyIndex) + 1;
            int valueEnd = json.IndexOf(",", valueStart);
            if (valueEnd == -1) valueEnd = json.IndexOf("}", valueStart);

            return json.Substring(valueStart, valueEnd - valueStart).Trim(new char[] { ' ', '"', '\r', '\n' });
        }
    }
}
