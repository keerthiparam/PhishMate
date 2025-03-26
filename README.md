# PhishMate [DEMO VIDEO](https://youtu.be/BHtsxgC5hHI)
## Your local protector from phishing mails

PhishMate is a tool (used as a local chrome extension), that can detect and alert the user if it detects a fraudulent email, such as a phishing email, IN REAL TIME.

According to current statistics, approximately 3.4 billion phishing emails are sent every day. This translates to roughly 1.2% of all emails being malicious phishing attempts. It is the most common form of cyberattack.

From fake CEO mails to convincing Social Engineering Attacks targeted towards employees in a company, having a tool to detect such mails saved on your desktop locally can ensure protection from those emails without the risk of a Man In the Middle attack associated with inference from a cloud server, possibly compromising confidential information.
## Architecture
![alt text](<diagram.jpg>)
## Features
1. **Content Analysis**
   - A custom trained BERT Sequential model analyzes the text content of the email, looking for red flags usually associated with a phishing mail, such as - urgency to disclose personal information, poor grammar, etc.
- **Link Analysis**
    - Links sent as a part of the mail are extracted, and their IPs are sent to AbuseIPDB to check if they are malicious or legitimate. If it is malicious, the user is alerted.
    - This ensures an additional layer of safety beyond just depending on the AI model.
- Alerts the user real time when a malicious mail is detected.
- Click on the extension to see how many emails/links/malicious links have been detected so far.

## PhishMate Chrome Extension Manifest Explanation
## Manifest Overview

This `manifest.json` file defines the configuration for the PhishMate Chrome extension. Below is a breakdown of each section:

### 1. Basic Information
- `manifest_version`: **3** - Specifies that this extension follows Chrome's Manifest V3 format.
- `name`: **PhishMate** - The name of the extension.
- `version`: **1.0** - The current version of the extension.

### 2. Permissions
- `scripting` - Allows the extension to execute scripts in web pages.
- `activeTab` - Grants temporary access to the currently active tab when the extension is used.
- `storage` - Enables the extension to store and retrieve data using Chrome's storage API.

### 3. Host Permissions
The extension requires access to various webmail services and external APIs:
- Email Providers:
  - Gmail, Outlook, Yahoo Mail, Proton Mail, Zoho Mail, iCloud Mail, AOL Mail, GMX Mail, Yandex Mail
- Security & Verification Services:
  - `https://api.abuseipdb.com/*` - To check for malicious IPs
  - `https://dns.google/*` - For DNS lookups

### 4. Background Service Worker
- `background.service_worker`: **"background.js"**
  - Runs a background script to handle tasks like API requests and data processing.

### 5. Content Scripts
- `content.js` is injected into supported email providers to extract and analyze email content.
- The script runs at `document_end` (after the page has fully loaded).

### 6. Icons
Defines icons for different sizes (16x16, 32x32, 48x48, 128x128).

### 7. Extension Action
- Default icon for the extension button.
- `default_popup`: **"popup.html"** - A popup UI for user interaction.

### 8. Web Accessible Resources
- Allows access to `config.json` within the extension's context.

## Privacy Concerns
PhishMate is designed with user privacy in mind. However, the following considerations should be noted:
1. **Data Collection**
   - The contents of the email extracted are processed by the model local to your device upon downloading it. Hence, there is no worry about your email content being intercepted by third parties.
   - In the same way, the links are checked by AbuseIPDB which is designed ONLY to check the reputation of the IP and not the content inside it.
2. **Self Hosted Model**
    - The model, after being set up succesfully, is run on a **Completely Local API**.
3. **Chrome Based Browsers**
    - The tool, since it is designed to be a chrome extension, works only on chrome based browsers. 

By keeping the phishing detection model self-hosted and minimizing external requests, PhishMate prioritizes security and user privacy.

## Growing Factors
1. Compatibility with FireFox, etc as user base expands
2. Employing a more robust model for content detection

## Future Plans
1. ~~Dark Mode~~
2. ~~Initial version Release~~ 
3. As the user base expands, it is necessary to make sure the model can detect any type of phishing email. This means training the model with a bigger dataset to ensure accuracy with any type of content.
4. Accommodating users from any browser; not just chrome.
5. Expanded sources to check for malicious links.
6. As the model size gets bigger and bigger, self hosting would, at one point become unrealistic. Then, it would have to be hosted on the cloud for inference, with appropriate SSL integration to ensure content safety.
7. Improve the UI - adding an interface within the popup UI where the user can easily add their api key - no need to create a file manually and add it.
8. For now, the project relies on the AbuseIPDB database. Further plans to extend the source for checking links like EasyList, which is an open source initiative, are under consideration. 

## Setting Up Locally

To set up PhishMate locally, follow these steps:

1. **Download Model Files**
   - The phishing detection model files are stored on Google Drive [Here](https://drive.google.com/drive/folders/1jpxy4_mu5qb0oNtqljxtt0dzcrmOryQy?usp=drive_link).
   - Download them and place them in the appropriate directory on your local machine.

2. **Set Up the Local API**
   - Clone the repo using `git clone https://github.com/keerthiparam/PhishMate`
   - Go to the directory where the repo is cloned using `cd your_directory` in terminal and:
   - Install Python and required dependencies from `requirements.txt`:
     ```sh
     pip install -r requirements.txt
     ```
   - Go to mail_checker.py and replace `MODEL_PATH` in `line 10` of the program with the path to the model folder you downloaded. 
   - Run the local API server:
     ```sh
     python mail_checker.py
     ```
   - Ensure the server is running at `http://127.0.0.1:5000/predict`.
   - Create a new file `config.json`.
   - Go to `https://www.abuseipdb.com/`, create a new account and obtain an API Key.
   - Type the following in the `config.json` file.
   ```json
    {
    "abuseIPDB_API_KEY" : "YOUR API KEY"
    }
3. **Install the Chrome Extension**
   - Open Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** (toggle in the top right).
   - Click **Load unpacked** and select the PhishMate extension folder.

4. **Test the Extension**
   - Open your email provider (e.g., Gmail).
   - The extension should analyze email content for phishing threats.
   
## License

This project is licensed under the Apache 2.0 License.

## Contributors

- Keerthi K P
- Shri Sai Aravind R