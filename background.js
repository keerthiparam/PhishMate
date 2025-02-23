async function loadConfig() {
  try {
      const response = await fetch(chrome.runtime.getURL("config.json"));
      const config = await response.json();
      await chrome.storage.local.set({ abuseIPDB_API_KEY: config.abuseIPDB_API_KEY });
      console.log("✅ API Key Loaded:", config.abuseIPDB_API_KEY);
  } catch (error) {
      console.error("❌ Error loading config.json:", error);
  }
}

// Load API Key on Extension Startup
chrome.runtime.onInstalled.addListener(loadConfig);
chrome.runtime.onStartup.addListener(loadConfig);

// Listen for API key requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getAPIKey") {
      chrome.storage.local.get("abuseIPDB_API_KEY", (data) => {
          sendResponse({ apiKey: data.abuseIPDB_API_KEY || null });
      });
      return true;
  } else if (message.action === "checkIP") {
      checkIP(message.ip, sendResponse);
      return true;
  }
});

// Function to check an IP against AbuseIPDB (to bypass CORS issues)
async function checkIP(ip, sendResponse) {
  chrome.storage.local.get("abuseIPDB_API_KEY", async (data) => {
      const apiKey = data.abuseIPDB_API_KEY;
      if (!apiKey) {
          console.warn("⚠️ API Key not found!");
          sendResponse({ error: "API Key not found" });
          return;
      }

      const url = `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`;

      try {
          const response = await fetch(url, {
              method: "GET",
              headers: {
                  "Accept": "application/json",
                  "Key": apiKey,  // Try original header
                  "Access-Control-Allow-Origin": "*",
                  "Content-Type": "application/x-www-form-urlencoded"
              }
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error(`AbuseIPDB API error: ${response.status} ${response.statusText}`);
              console.error("Error details:", errorText);
              sendResponse({ error: `API error: ${response.status} - ${errorText}` });
              return;
          }

          const data = await response.json();
          console.log("API Response:", data);
          sendResponse({ data: data.data });
      } catch (error) {
          console.error("Error checking IP:", error.message);
          sendResponse({ error: `Failed to fetch data: ${error.message}` });
      }
  });
}