document.addEventListener("DOMContentLoaded", () => {
    const emailCountElem = document.getElementById("emailCount");
    const linkCountElem = document.getElementById("linkCount");
    const maliciousCountElem = document.getElementById("maliciousCount");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const apiKeyBtn = document.getElementById("apiKeyBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const clearBtn = document.getElementById("clearBtn");

    // Set consistent window size
    chrome.windows.getCurrent((win) => {
        chrome.windows.update(win.id, { width: 380, height: 500 });
    });

    // Update dark mode UI
    function updateDarkModeUI(isDark) {
        document.body.classList.toggle("dark-mode", isDark);
    }

    // Load saved stats + dark mode
    chrome.storage.local.get(["emailCount", "linkCount", "maliciousCount", "darkMode"], (result) => {
        emailCountElem.textContent = result.emailCount || 0;
        linkCountElem.textContent = result.linkCount || 0;
        maliciousCountElem.textContent = result.maliciousCount || 0;
        updateDarkModeUI(result.darkMode === "enabled");
    });

    // Toggle dark mode
    darkModeToggle.addEventListener("click", () => {
        chrome.storage.local.get("darkMode", (result) => {
            const newMode = result.darkMode === "enabled" ? "disabled" : "enabled";
            chrome.storage.local.set({ darkMode: newMode });
            updateDarkModeUI(newMode === "enabled");
        });
    });

    // Navigate to API settings
    if (apiKeyBtn) {
        apiKeyBtn.addEventListener("click", () => {
            window.location.href = "api.html";
        });
    }

    // Refresh data
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            chrome.runtime.sendMessage({ action: "refreshData" });
            emailCountElem.textContent = "Loading...";
            linkCountElem.textContent = "Loading...";
            maliciousCountElem.textContent = "Loading...";
        });
    }

    // Clear data
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            chrome.storage.local.set({
                emailCount: 0,
                linkCount: 0,
                maliciousCount: 0
            }, () => {
                emailCountElem.textContent = "0";
                linkCountElem.textContent = "0";
                maliciousCountElem.textContent = "0";

                const popupSuccessMessage = document.getElementById("popupSuccessMessage");
                popupSuccessMessage.style.display = "block";
                setTimeout(() => {
                    popupSuccessMessage.style.display = "none";
                }, 2000);
            });
        });
    }
});
