let lastEmailContent = "";
let emailCount = 0;
let linkCount = 0;
let maliciousCount = 0;
let abuseIPDB_API_KEY = "";

// List of known malicious URLs (you can update this dynamically)
const maliciousLinksList = [
    "http://malicious-site.com",
    "https://phishing-example.net",
    "http://fake-login.com",
    "https://steal-your-data.xyz"
];

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

// Check if a URL is malicious
function checkMaliciousLinks(url) {
    if (maliciousLinksList.includes(url)) {
        maliciousCount++;
        alert(`🚨 WARNING: The URL ${url} is a known malicious site! \n\n⚠️ DO NOT click the link or enter any credentials.`);
        return true;
    }
    return false;
}

// Send IP check request to background.js
async function checkIP(ip) {
    if (!abuseIPDB_API_KEY) {
        console.warn("⚠️ API key not loaded yet!");
        return;
    }

    chrome.runtime.sendMessage({ action: "checkIP", ip, apiKey: abuseIPDB_API_KEY }, (response) => {
        if (response.error) {
            console.error("❌ Error:", response.error);
            return;
        }

        const data = response.data;
        if (data && data.abuseConfidenceScore > 50) {
            alert(`🚨 Warning! The IP (${ip}) has a high abuse score (${data.abuseConfidenceScore}%).\n\n❗ Do NOT click on suspicious links or download attachments from this email.`);
        }
    });
}

// Function to resolve a domain to an IP and check it
async function extractAndCheckIP(url) {
  try {
      if (!url || url === '') {
          console.log("Skipping empty URL");
          return;
      }

      if (checkMaliciousLinks(url)) return; // Check if URL is malicious first

      const urlObject = new URL(url);
      const hostname = urlObject.hostname;
      console.log(`Extracted domain: ${hostname}`);

      const dnsResponse = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
      const dnsData = await dnsResponse.json();

      if (dnsData.Answer && dnsData.Answer.length > 0) {
          const ip = dnsData.Answer[0].data;
          console.log(`Resolved IP for ${hostname}: ${ip}`);
          checkIP(ip);
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
            alert("⚠️ Warning: DO NOT CLICK ANY LINKS OR OPEN ANY ATTACHMENTS IN THIS EMAIL.\nThis email might be a PHISHING attempt! \n\nProceed at your own risk.");
        }
    } catch (error) {
        console.error("Error checking phishing:", error);
    }
}

// Function to extract email content and links
function extractEmailContent() {
    const emailBody = document.querySelector(".a3s.aiL, .ii.gt, .mail-message-content"); // Gmail, Outlook, Yahoo, etc.
    if (emailBody) {
        const contentText = emailBody.innerText.trim();
        const links = Array.from(emailBody.querySelectorAll("a"), link => link.href);

        if (contentText !== lastEmailContent) {
            console.log("Extracted Email Content:", contentText);
            links.forEach(link => {
                console.log("Link:", link);
                extractAndCheckIP(link);
            });

            lastEmailContent = contentText;
            emailCount++;
            linkCount += links.length;

            // Store counts locally
            chrome.storage.local.set({ emailCount, linkCount, maliciousCount });

            // Send extracted email content for phishing check
            checkEmailPhishing(contentText);
        }
    }
}

// Observe email content changes
const observer = new MutationObserver(extractEmailContent);
observer.observe(document.body, { childList: true, subtree: true });

// Request API Key on startup
requestAPIKey();
