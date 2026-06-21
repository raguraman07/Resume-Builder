# ResumeCraft - AI-Powered Resume Builder Web Application

ResumeCraft is a fully responsive, modern, interactive, and animated Resume Builder application featuring a premium SaaS UI/UX similar to Notion, Canva, Framer, and Stripe.

## Key Features
- **Landing Page**: Modern Canva/Stripe-styled intro page with animations, testimonials, and features.
- **Authentication**: Firebase Authentication for login, signup, forgot password, and Google Login.
- **Dashboard**: Workspace to list, create, duplicate, delete, and download user resumes.
- **Platform Selection**: Asks users which target industry/platform (Tech, Corporate, Creative, Freelancer, General) they are building for to tailor suggestions.
- **Resume Builder**: Multi-step wizard form alongside a real-time WYSIWYG preview canvas with zoom and fullscreen modes.
- **Visual Customizer**: Instant customization of styles (primary themes, fonts, single/two column layouts, and spacing presets).
- **10 Premium Resume Templates**: Sleek, recruiter-approved styles (Minimal ATS, Developer, Executive, Gradient, Dark Theme, etc.).
- **ATS Optimizer Checker**: Client-server API calculating an ATS score out of 100 and providing platform-specific tips.
- **AI Advisor Suggestions**: Rewrites user bullet points and summaries into professional phrasing (using Gemini API or rule-based fallback engines).
- **Backend PDF Export**: Backend API using Flask and `xhtml2pdf` to render HTML into print-ready, high-resolution PDFs.
- **Auto-Save System**: Periodically saves documents to Firestore or Local Storage Fallback.

---

## File Architecture
```
resume-builder/
├── frontend/
│   ├── index.html          # Landing Page
│   ├── login.html          # Authentication Page
│   ├── dashboard.html      # User Dashboard
│   ├── builder.html        # Interactive Workspace
│   ├── css/
│   │   ├── style.css       # Core variables & themes
│   │   ├── landing.css     # Landing UI styles
│   │   ├── auth.css        # Auth forms styling
│   │   ├── dashboard.css   # Dashboard layout grid
│   │   └── builder.css     # Builder forms & paper view
│   └── js/
│       ├── firebase-config.js  # Firebase initializations & local fallback
│       ├── auth.js         # Auth actions & route guards
│       ├── dashboard.js    # Dashboard data operations
│       ├── builder.js      # Form state sync & API caller
│       └── templates.js    # 10 template html compilers
│
├── backend/
│   ├── app.py              # Flask server
│   ├── services/
│   │   ├── ats_checker.py  # ATS keyword evaluation
│   │   ├── ai_advisor.py   # AI generator preset lists
│   │   └── pdf_generator.py # HTML to PDF rendering
│   └── requirements.txt    # Python package dependencies
│
└── README.md
```

---

## Quick Start Guide

### 1. Run the Python Backend
Make sure you have Python 3.12+ installed.

1. Open your terminal in the workspace directory.
2. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Start the Flask application:
   ```bash
   python backend/app.py
   ```
   *The server will start running on `http://localhost:5000`.*

### 2. Run the Frontend
Since the application uses standard HTML, CSS, and Vanilla JS, you can open it directly:
- Simply double-click on `frontend/index.html` to open it in your browser.
- Alternatively, serve it using any local dev server (e.g. VS Code Live Server, or running `python -m http.server 8000` in the `frontend` folder).

### 3. Setup Firebase (Optional)
By default, the application is pre-configured with a **DEMO / Local Storage Fallback Mode**. This means it is fully functional out of the box — you can register accounts, save, duplicate, edit, and delete resumes immediately using your browser's local storage.

To transition to Firebase for production cloud storage:
1. Open `frontend/js/firebase-config.js`.
2. Locate the `firebaseConfig` object constant:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY_HERE",
       authDomain: "YOUR_AUTH_DOMAIN_HERE",
       projectId: "YOUR_PROJECT_ID_HERE",
       storageBucket: "YOUR_STORAGE_BUCKET_HERE",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID_HERE",
       appId: "YOUR_APP_ID_HERE"
   };
   ```
3. Replace the placeholder strings with actual configuration keys from your Firebase Console.
4. The system will automatically detect the configuration and route data to Firestore and Firebase Authentication instead of the local storage mock.

### 4. Configure Gemini AI API Key (Optional)
To enable active AI-powered resume enhancement suggestions:
1. Obtain an API Key from Google AI Studio.
2. Set it as an environment variable in your terminal before launching the Flask server:
   - **Windows PowerShell**:
     ```powershell
     $env:GEMINI_API_KEY="your_api_key_here"
     python backend/app.py
     ```
   - **Linux / macOS**:
     ```bash
     export GEMINI_API_KEY="your_api_key_here"
     python backend/app.py
     ```
   *If the environment variable is not set, the application will use the intelligent rules-based fallback engine to offer professional preset suggestions based on the target platform.*
