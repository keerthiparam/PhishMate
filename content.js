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

// Function to resolve a domain to an IP and check it
async function extractAndCheckIP(url) {
    try {
        if (!url || url === '') {
            console.log("Skipping empty URL");
            return false;
        }

        const urlObject = new URL(url);
        const hostname = urlObject.hostname;
        console.log(`Extracted domain: ${hostname}`);

        const dnsResponse = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
        const dnsData = await dnsResponse.json();

        if (dnsData.Answer && dnsData.Answer.length > 0) {
            const ip = dnsData.Answer[0].data;
            console.log(`Resolved IP for ${hostname}: ${ip}`);
            return await checkIP(ip);
        } else {
            console.warn(`No IP found for ${hostname}`);
        }
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('URL')) {
            console.warn(`Skipping invalid URL: ${url}`);
        } else {
            console.error("Error resolving IP:", error);
        }
    }
    return false;
}

// Function to check an IP against AbuseIPDB
async function checkIP(ip) {
    if (!abuseIPDB_API_KEY) {
        console.warn("⚠️ API key not loaded yet!");
        return false;
    }

    return new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "checkIP", ip, apiKey: abuseIPDB_API_KEY }, (response) => {
            if (response.error) {
                console.error("❌ Error:", response.error);
                resolve(false);
                return;
            }

            const data = response.data;
            if (data && data.abuseConfidenceScore > 50) {
                alert(`🚨 WARNING 🚨\n\nThe IP (${ip}) has a high abuse score (${data.abuseConfidenceScore}%).\n\n❗ Do NOT click on suspicious links or download attachments from this email.`);
                resolve(true);
            } else {
                resolve(false);
            }
        });
    });
}

// Function to check email text for phishing
async function checkEmailPhishing(emailText) {
    try {
        const response = await fetch("http://127.0.0.1:5000/predict", { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: emailText }),
        });

        const data = await response.json();
        console.log("Prediction:", data.prediction);

        if (data.prediction === "Phishing Email") {
            alert("⚠️ WARNING ⚠️\n\nDO NOT CLICK ANY LINKS OR OPEN ANY ATTACHMENTS IN THIS EMAIL.\nThis email might be a PHISHING attempt! \n\nProceed at your own risk.");
            return true;
        }
    } catch (error) {
        console.error("Error checking phishing:", error);
    }
    return false;
}

// Function to extract email content and links
function extractEmailContent() {
    const emailBody = document.querySelector(".a3s.aiL, .ii.gt, .mail-message-content"); // Gmail, Outlook, Yahoo, etc.
    if (emailBody) {
        const contentText = emailBody.innerText.trim();
        const links = Array.from(emailBody.querySelectorAll("a"), link => link.href);

        if (contentText !== lastEmailContent) {
            console.log("Extracted Email Content:", contentText);
            let isMalicious = false;

            // Check all links
            const linkChecks = links.map(link => extractAndCheckIP(link).then(result => {
                if (result) isMalicious = true;
            }));

            // Check email text for phishing
            const phishingCheck = checkEmailPhishing(contentText).then(result => {
                if (result) isMalicious = true;
            });

            // After all checks complete, update maliciousCount only once if needed
            Promise.all([...linkChecks, phishingCheck]).then(() => {
                if (isMalicious) {
                    maliciousCount++;  // ✅ Increase only once
                    chrome.storage.local.set({ maliciousCount });
                }
            });

            lastEmailContent = contentText;
            emailCount++;
            linkCount += links.length;
            chrome.storage.local.set({ emailCount, linkCount });
        }
    }
}

// Observe email content changes
const observer = new MutationObserver(extractEmailContent);
observer.observe(document.body, { childList: true, subtree: true });

// Request API Key on startup
requestAPIKey();