let lastEmailContent = "";

function extractEmailContent() {
  const emailBody = document.querySelector(".a3s.aiL"); // Gmail email content class
  if (emailBody) {
    const contentText = emailBody.innerText.trim();
    const links = emailBody.querySelectorAll("a");
    
    if (contentText !== lastEmailContent) {
      console.log("Extracted Email Content:", contentText);
      links.forEach(link => console.log("Link:", link.href));
      lastEmailContent = contentText;
    }
  }
}

const observer = new MutationObserver(extractEmailContent);
observer.observe(document.body, { childList: true, subtree: true });