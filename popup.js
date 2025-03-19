document.addEventListener("DOMContentLoaded", () => {
    const emailCountElem = document.getElementById("emailCount");
    const linkCountElem = document.getElementById("linkCount");
    const maliciousCountElem = document.getElementById("maliciousCount");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const modeIcon = document.getElementById("modeIcon");
    const phishmateLogo = document.getElementById("phishmateLogo");
    const container = document.querySelector(".container");
    const headings = document.querySelectorAll("h1, h2, p");

    // Load data and theme
    chrome.storage.local.get(["emailCount", "linkCount", "maliciousCount", "darkMode"], (result) => {
        emailCountElem.textContent = result.emailCount || 0;
        linkCountElem.textContent = result.linkCount || 0;
        maliciousCountElem.textContent = result.maliciousCount || 0;

        if (result.darkMode === "enabled") {
            document.body.classList.add("dark-mode");
            container.classList.add("dark-mode");
            headings.forEach(h => h.classList.add("dark-mode"));
            modeIcon.src = "icons/dark-icon.svg";
            modeIcon.alt = "Dark Mode";
            phishmateLogo.src = "icons/fish48-dark.png";
        } else {
            document.body.classList.remove("dark-mode");
            container.classList.remove("dark-mode");
            headings.forEach(h => h.classList.remove("dark-mode"));
            modeIcon.src = "icons/light-icon.svg";
            modeIcon.alt = "Light Mode";
            phishmateLogo.src = "icons/fish48.png";
        }
    });

    // Toggle dark mode
    darkModeToggle.addEventListener("click", () => {
        const isDarkMode = document.body.classList.toggle("dark-mode");
        container.classList.toggle("dark-mode");
        headings.forEach(h => h.classList.toggle("dark-mode"));

        if (isDarkMode) {
            phishmateLogo.src = "icons/fish48-dark.png";
            modeIcon.src = "icons/dark-icon.svg";
            modeIcon.alt = "Dark Mode";
            chrome.storage.local.set({ darkMode: "enabled" });
        } else {
            phishmateLogo.src = "icons/fish48.png";
            modeIcon.src = "icons/light-icon.svg";
            modeIcon.alt = "Light Mode";
            chrome.storage.local.set({ darkMode: "disabled" });
        }
    });
});
