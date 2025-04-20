let lastEmailContent = "";
let emailCount = 0;
let linkCount = 0;
let maliciousCount = 0;
let abuseIPDB_API_KEY = "";
let alertShown = false;
const processedEmails = new Set();

// Debounce to limit multiple triggers
function debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

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

// Unified alert handler
function handleAlert(reason) {
    if (alertShown) return;
    alertShown = true;

    let message = "🚨 WARNING 🚨\n\n";
    switch (reason) {
        case "ip":
            message += "The links in this email are associated with a high-abuse IP address.\nThey may lead to unsafe websites.";
            break;
        case "model":
            message += "This email’s content resembles phishing patterns.\nBe cautious before taking any action.";
            break;
        case "both":
            message += "This email is suspicious.\n\n⚠️ The content resembles phishing patterns.\n⚠️ The links are from flagged IP addresses.";
            break;
        default:
            message += "Unknown threat detected.";
    }

    alert(message);
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
            console.warn(`High abuse score for IP (${ip}): ${score}%`);
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
    let ipFlag = false;
    let modelFlag = false;

    for (const link of links) {
        if (await extractAndCheckIP(link)) {
            ipFlag = true;
        }
    }

    if (await checkEmailPhishing(contentText)) {
        modelFlag = true;
    }

    if (ipFlag && modelFlag) {
        handleAlert("both");
    } else if (ipFlag) {
        handleAlert("ip");
    } else if (modelFlag) {
        handleAlert("model");
    }

    return ipFlag || modelFlag;
}

// Extract email content
async function extractEmailContent() {
    const emailBody = document.querySelector(".a3s.aiL, .ii.gt, .mail-message-content");

    if (emailBody) {
        const contentText = emailBody.innerText.trim();
        const contentHash = btoa(unescape(encodeURIComponent(contentText)));

        if (processedEmails.has(contentHash)) {
            return;
        }

        processedEmails.add(contentHash);
        alertShown = false;

        const links = Array.from(emailBody.querySelectorAll("a"), link => link.href);
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

// Setup observer with debounce
const debouncedExtract = debounce(extractEmailContent, 1000); // 1 sec delay
const observer = new MutationObserver(debouncedExtract);
observer.observe(document.body, { childList: true, subtree: true });

requestAPIKey();
