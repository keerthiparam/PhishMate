document.addEventListener("DOMContentLoaded", () => {
    const backBtn = document.getElementById("back-btn");
    const saveBtn = document.getElementById("save-btn");
    const apiKeyInput = document.getElementById("apiKey");
    const successMessage = document.getElementById("successMessage");
    const errorMessage = document.getElementById("errorMessage");
    const togglePassword = document.querySelector(".toggle-password");
    const eyeIcon = document.getElementById("eyeIcon");
    const backIcon = document.getElementById("backIcon");

    // Set consistent window size
    chrome.windows.getCurrent((win) => {
        chrome.windows.update(win.id, { width: 380, height: 500 });
    });

    // Go back to popup window when back button is clicked
    backBtn.addEventListener("click", () => {
        window.location.href = "popup.html"; // Direct redirect to popup.html
    });

    // Load stored API key
    chrome.storage.local.get("phishmate_api_key", (result) => {
        if (result.phishmate_api_key) {
            apiKeyInput.value = result.phishmate_api_key;
        }
    });

    // Toggle password visibility
    togglePassword.addEventListener("click", () => {
        if (apiKeyInput.type === "password") {
            apiKeyInput.type = "text";
            updateEyeIcon(false);
        } else {
            apiKeyInput.type = "password";
            updateEyeIcon(true);
        }
    });

    // Save API key and validate with AbuseIPDB
    saveBtn.addEventListener("click", () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            // Validate the API key with AbuseIPDB
            validateApiKey(apiKey).then(isValid => {
                if (isValid) {
                    chrome.storage.local.set({ phishmate_api_key: apiKey }, () => {
                        successMessage.style.display = "block";
                        errorMessage.style.display = "none";
                        setTimeout(() => { successMessage.style.display = "none"; }, 2000);
                    });
                } else {
                    errorMessage.textContent = "Invalid API Key. Please check and try again.";
                    errorMessage.style.display = "block";
                    successMessage.style.display = "none";
                    setTimeout(() => { errorMessage.style.display = "none"; }, 3000);
                }
            }).catch(error => {
                console.error("API validation error:", error);
                errorMessage.textContent = "Failed to validate API Key. Please try again.";
                errorMessage.style.display = "block";
                successMessage.style.display = "none";
                setTimeout(() => { errorMessage.style.display = "none"; }, 3000);
            });
        } else {
            errorMessage.textContent = "API Key cannot be empty.";
            errorMessage.style.display = "block";
            successMessage.style.display = "none";
            setTimeout(() => { errorMessage.style.display = "none"; }, 2000);
        }
    });

    // Function to validate API key with AbuseIPDB
    async function validateApiKey(apiKey) {
        try {
            const testIP = "8.8.8.8"; // Google's DNS for testing
            const response = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${testIP}&maxAgeInDays=90`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Key": apiKey,
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });
            
            return response.ok; // Return true if status is 200-299
        } catch (error) {
            console.error("API validation error:", error);
            return false;
        }
    }

    // Function to update UI based on dark mode
    function updateDarkModeUI(isDarkMode) {
        if (isDarkMode) {
            document.body.classList.add("dark-mode");
            apiKeyInput.classList.add("dark-mode");
            updateEyeIcon(apiKeyInput.type === "password");
        } else {
            document.body.classList.remove("dark-mode");
            apiKeyInput.classList.remove("dark-mode");
            updateEyeIcon(apiKeyInput.type === "password");
        }
    }
    
    // Function to update eye icon based on current mode and password visibility
    function updateEyeIcon(isPassword) {
        const isDarkMode = document.body.classList.contains("dark-mode");
        if (!isDarkMode) {
            eyeIcon.src = isPassword ? "icons/eye.svg" : "icons/eye-off.svg";
        }
    }

    // Load dark mode state
    chrome.storage.local.get("darkMode", (result) => {
        updateDarkModeUI(result.darkMode === "enabled");
    });

    // Listen for dark mode changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "local" && changes.darkMode) {
            updateDarkModeUI(changes.darkMode.newValue === "enabled");
        }
    });
});