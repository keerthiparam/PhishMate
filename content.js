let lastEmailContent = "";
let emailCount = 0;
let linkCount = 0;
let maliciousCount = 0;
let abuseIPDB_API_KEY = "";

// Request API key from background.js
async function requestAPIKey() {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getAPIKey" }, (response) => {
            if (response && response.apiKey) {
                abuseIPDB_API_KEY = response.apiKey;
                console.log("✅ API Key Retrieved:", abuseIPDB_API_KEY ? "Loaded" : "Not Loaded");
            } else {
                console.warn("⚠️ API Key not found!");
            }
            resolve();
        });
    });
}

// Validate URL format
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

// Resolve domain to IP and check it
async function extractAndCheckIP(url) {
    if (!url || url === '' || !isValidURL(url)) {
        console.warn("Skipping invalid URL:", url);
        return false;
    }

    try {
        const urlObject = new URL(url);
        const hostname = urlObject.hostname;

        const dnsResponse = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
        const dnsData = await dnsResponse.json();

        if (dnsData.Answer && dnsData.Answer.length > 0) {
            let isMalicious = false;
            
            for (const record of dnsData.Answer) {
                const ip = record.data;
                console.log(`Resolved IP: ${ip}`);
                
                if (await checkIP(ip)) {
                    isMalicious = true;
                }
            }
            return isMalicious;
        } else {
            console.warn(`No IP found for ${hostname}`);
        }
    } catch (error) {
        console.error("Error resolving IP:", error);
    }
    return false;
}

// Check IP against AbuseIPDB
async function checkIP(ip) {
    if (!abuseIPDB_API_KEY) {
        console.warn("⚠️ API key not loaded yet!");
        return false;
    }

    try {
        const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
            method: "GET",
            headers: {
                "Key": abuseIPDB_API_KEY,
                "Accept": "application/json"
            }
        });

        const data = await response.json();
        const score = data.data?.abuseConfidenceScore || 0;

        if (score > 50) {
            alert(`🚨 WARNING 🚨\n\nThe IP (${ip}) has a high abuse score (${score}%).`);
            return true;
        }
    } catch (error) {
        console.error("Error checking IP:", error);
    }
    return false;
}

// Check email text for phishing
async function checkEmailPhishing(emailText) {
    try {
        const response = await fetch("http://127.0.0.1:5000/predict", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: emailText }),
        });

        const data = await response.json();
        return data.prediction === "Phishing Email";
    } catch (error) {
        console.error("Error checking phishing:", error);
        return false;
    }
}

// Extract and check links + phishing
async function checkLinksAndPhishing(links, contentText) {
    let isMalicious = false;

    for (const link of links) {
        if (await extractAndCheckIP(link)) {
            isMalicious = true;
        }
    }

    if (await checkEmailPhishing(contentText)) {
        isMalicious = true;
    }

    return isMalicious;
}

// Extract email content
async function extractEmailContent() {
    const emailBody = document.querySelector(".a3s.aiL, .ii.gt, .mail-message-content");
    
    if (emailBody) {
        const contentText = emailBody.innerText.trim();
        const links = Array.from(emailBody.querySelectorAll("a"), link => link.href);

        if (contentText !== lastEmailContent) {
            const isMalicious = await checkLinksAndPhishing(links, contentText);

            if (isMalicious) {
                maliciousCount++;
                chrome.storage.local.set({ maliciousCount });
            }

            lastEmailContent = contentText;
            emailCount++;
            linkCount += links.length;
            chrome.storage.local.set({ emailCount, linkCount });
        }
    }
}

// Observe changes
const observer = new MutationObserver(extractEmailContent);
observer.observe(document.body, { childList: true, subtree: true });

requestAPIKey();