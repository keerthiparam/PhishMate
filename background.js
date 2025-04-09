// Background script for PhishMate
// Function to load config from JSON file
async function loadConfig() {
    try {
        const response = await fetch(chrome.runtime.getURL("config.json"));
        const config = await response.json();
        await chrome.storage.local.set({ phishmate_api_key: config.abuseIPDB_API_KEY });
        console.log("✅ API Key Loaded:", config.abuseIPDB_API_KEY);
    } catch (error) {
        console.error("❌ Error loading config.json:", error);
    }
}

// Initialize storage with default values if not set
chrome.runtime.onInstalled.addListener(() => {
    loadConfig();
    chrome.storage.local.get(["emailCount", "linkCount", "maliciousCount"], (result) => {
        if (!result.emailCount) chrome.storage.local.set({ emailCount: 0 });
        if (!result.linkCount) chrome.storage.local.set({ linkCount: 0 });
        if (!result.maliciousCount) chrome.storage.local.set({ maliciousCount: 0 });
    });
});

// Also load API key on browser startup
chrome.runtime.onStartup.addListener(loadConfig);

// Listen for messages from popup.js or settings.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openPopup") {
        chrome.windows.getCurrent((currentWindow) => {
            chrome.action.openPopup();
        });
    } else if (message.action === "getAPIKey") {
        chrome.storage.local.get("phishmate_api_key", (data) => {
            sendResponse({ apiKey: data.phishmate_api_key || null });
        });
        return true;
    } else if (message.action === "checkIP") {
        checkIP(message.ip, sendResponse);
        return true;
    }
});

// Function to check IP with AbuseIPDB API
async function checkIP(ip, sendResponse) {
    chrome.storage.local.get("phishmate_api_key", async (data) => {
        const apiKey = data.phishmate_api_key;
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
                    "Key": apiKey,
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
            
            // Update malicious count if IP is malicious
            if (data.data.abuseConfidenceScore > 50) {
                chrome.storage.local.get(["maliciousCount"], (result) => {
                    const newCount = (result.maliciousCount || 0) + 1;
                    chrome.storage.local.set({ maliciousCount: newCount });
                });
            }
            
            sendResponse({ data: data.data });
        } catch (error) {
            console.error("Error checking IP:", error.message);
            sendResponse({ error: `Failed to fetch data: ${error.message}` });
        }
    });
}

// Process email links and check for malicious ones
async function processEmailLinks(links) {
    // Update link count
    chrome.storage.local.get(["linkCount"], (result) => {
        const newLinkCount = (result.linkCount || 0) + links.length;
        chrome.storage.local.set({ linkCount: newLinkCount });
    });
    
    // Update email count (assuming one email per batch of links)
    chrome.storage.local.get(["emailCount"], (result) => {
        const newEmailCount = (result.emailCount || 0) + 1;
        chrome.storage.local.set({ emailCount: newEmailCount });
    });
}