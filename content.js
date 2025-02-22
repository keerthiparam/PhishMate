let lastEmailContent = "";
let emailCount = 0;
let linkCount = 0;

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
      chrome.storage.local.set({ emailCount, linkCount });
    }
  }
}

const observer = new MutationObserver(extractEmailContent);
observer.observe(document.body, { childList: true, subtree: true });