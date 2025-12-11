# Copilot Instructions for Church Website Project

## Project Overview
This is a static website for a church, organized under `public/` with HTML, CSS, JS, and data files. The site displays events, sermons, leadership info, and more. Python scripts in `tools/` support data fetching.

## Architecture & Data Flow
- **HTML Pages**: Each major page (events, sermons, calendar, contact, etc.) is a separate HTML file in `public/`.
- **Shared Layout**: `_header.html` and `_footer.html` are included in all pages for consistent navigation and branding.
- **Styling**: CSS is split into `styles.css` (global styles) and `page-styles.css` (page-specific overrides).
- **JavaScript**: `script.js` handles general interactivity; `player.js` is for sermon audio/video playback.
- **Data**: Event and sermon data are stored in JSON files (`events.json`, `sermons.json`) and loaded client-side.
- **Images**: All images for the front page and other content are in `public/images/`.
- **Python Tooling**: `tools/fetch_sermons.py` is used to fetch/update sermon data. Run this manually when new sermons are added.

## Developer Workflows
- **No build step**: All files are static; changes are reflected immediately.
- **Data updates**: To update sermons, run the Python script and refresh `sermons.json`.
- **Debugging**: Use browser dev tools for HTML/CSS/JS. No automated tests or build tools are present.

## Conventions & Patterns
- **File Naming**: Use lowercase, hyphen-separated names for HTML files. Shared components start with an underscore (`_header.html`).
- **Data Format**: JSON files use arrays of objects. Ensure new entries match the existing schema.
- **Component Inclusion**: Header/footer are included via server-side includes or copy-paste; no templating engine is used.
- **JS Patterns**: Scripts are plain ES6, no frameworks. Keep DOM manipulation simple and compatible with all browsers.
- **Image Usage**: Reference images by relative path from HTML/JS/CSS. See `List of Images for Front Page.txt` for curated images.

## Integration Points
- **Python**: Only used for data fetching, not for serving the site.
- **No external dependencies**: All code is custom, no npm/yarn or package managers.

## Key Files & Directories
- `public/index.html`: Main landing page.
- `public/css/styles.css`, `public/css/page-styles.css`: Styling.
- `public/js/script.js`, `public/js/player.js`: JS logic.
- `public/data/events.json`, `public/data/sermons.json`: Data sources.
- `tools/fetch_sermons.py`: Data update script.
- `List of Images for Front Page.txt`: Image references.

## Example Patterns
- To add a new event: Edit `events.json` and update `all-events.html` if needed.
- To add a new sermon: Run `fetch_sermons.py`, update `sermons.json`, and check `all-sermons.html`.
- To update styles: Edit `styles.css` or `page-styles.css`.

---
For questions or unclear conventions, ask for clarification or review the relevant file for examples.