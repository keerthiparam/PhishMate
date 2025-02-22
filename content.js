let lastEmailContent = "";
let emailCount = 0;
let linkCount = 0;

async function checkEmailPhishing(emailText) {
    try {
        const response = await fetch("http://127.0.0.1:5000/predict", { // Change if deployed
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: emailText }),
        });

        const data = await response.json();
        console.log("Prediction:", data.prediction);

        if (data.prediction === "Phishing Email") {
            alert("⚠️ Warning: This email might be a PHISHING attempt!");
        }

    } catch (error) {
        console.error("Error checking phishing:", error);
    }
}

function extractEmailContent() {
    const emailBody = document.querySelector(".a3s.aiL, .ii.gt, .mail-message-content"); // Gmail, Outlook, Yahoo, etc.
    if (emailBody) {
        const contentText = emailBody.innerText.trim();
        const links = Array.from(emailBody.querySelectorAll("a"), link => link.href);

        if (contentText !== lastEmailContent) {
            console.log("Extracted Email Content:", contentText);
            links.forEach(link => console.log("Link:", link));

            lastEmailContent = contentText;
            emailCount++;
            linkCount += links.length;

            // Store counts locally
            chrome.storage.local.set({ emailCount, linkCount });

            // Send extracted email content for phishing check
            checkEmailPhishing(contentText);
        }
    }
}

// Observe email content changes
const observer = new MutationObserver(extractEmailContent);
observer.observe(document.body, { childList: true, subtree: true });
