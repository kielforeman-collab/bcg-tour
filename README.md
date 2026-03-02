# BCG • 38 DATES LATER 2026

An offline-first, mobile-optimized Progressive Web App (PWA) designed to manage an international tour itinerary. It features local caching, dynamic flight search integrations, and Google Sheets synchronization capabilities.

## Features

- **Offline-First (PWA):** Once loaded, the app caches all assets using a Service Worker, allowing full access to the tour itinerary even without an internet connection.
- **Flight Finder:** Pre-filled flight search links using tour leg data. Supports quick searches across Google Flights, Skyscanner, Kiwi, Kayak, and Momondo.
- **Google Sheets Sync:** Pulls itinerary updates directly from a published Google Sheet CSV and pushes edits back using a Google Apps Script Web App backend.
- **Modular Frontend:** Built with vanilla HTML/CSS/JS and Tailwind CSS (via CDN) for a lightweight, maintainable, and responsive mobile-first design.
- **Visa & Hotel Management:** Quick visibility into per-country visa requirements, accommodations, and specific show deals.

## Project Structure

The codebase is strictly modularized to separate concerns:
- `index.html`: The main entry point and UI structure.
- `style.css`: Custom CSS, animations, and typography overriding/extending Tailwind.
- `app.js`: Main state management, initialization, and edit mode logic.
- `data.js`: Holds the fallback/default hardcoded `tourData` configuration.
- `ui.js`: Handles DOM rendering, modal logic, and UI interactions.
- `flights.js`: Contains all logic for building tour legs and generating flight search URLs.
- `sync.js`: Logic for parsing CSVs and syncing/pushing data to and from Google Sheets.
- `sw.js`: Service Worker script handling asset caching for offline functionality.
- `manifest.json`: PWA configuration.
- `appsscript.html`: The Google Apps Script `doPost` handler used to receive JSON payloads from the web app and write them securely to the Google Sheet.

## Getting Started

1. **Run Locally:**
   Since the app uses ES modules and Service Workers, it needs to be served over HTTP/HTTPS, not the `file://` protocol.
   ```bash
   npx http-server -p 8080
   ```
   Navigate to `http://localhost:8080` in your browser.

2. **Google Sheets Syncing Setup:**
   * **Read URL:** In your Google Sheet, go to `File -> Share -> Publish to web`. Select your sheet tab, choose `CSV`, and click publish. Paste this URL into the app's settings tab.
   * **Write URL:** Create a new Google Apps Script bound to your sheet. Paste the contents of `appsscript.html` into your `Code.gs` file. Deploy as a Web App (execute as yourself, access to "Anyone"). Paste the deployed URL into the app's settings tab under "Write URL".

## Built With

- Vanilla JavaScript (ES Modules)
- Tailwind CSS
- Font Awesome
- Google Fonts (Press Start 2P, Source Sans 3)
