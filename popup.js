document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["emailCount", "linkCount"], (data) => {
        document.getElementById("emailCount").textContent = data.emailCount || 0;
        document.getElementById("linkCount").textContent = data.linkCount || 0;
    });
});