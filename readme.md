# STILL — Daily Habit Tracker

Plain HTML/CSS/JS PWA. No build step, backend, login or API keys. Data is stored in your browser's localStorage.

Files: index.html, style.css, app.js, manifest.json, service-worker.js, icon.svg, icon-192.png, icon-512.png

## Deploy free (GitHub Pages)
1. Create a free GitHub account, then a new public repository (e.g. `still`).
2. Click "Add file → Upload files", drag in ALL the files above (not the zip), and commit.
3. Go to Settings → Pages. Under "Build and deployment" choose "Deploy from a branch", branch `main`, folder `/ (root)`, Save.
4. After a minute your site appears at `https://YOURNAME.github.io/still/`. (Cloudflare Pages also works: upload the folder as a direct upload.)

## Install on Android
1. Open your HTTPS URL in Chrome and let it load once.
2. Tap ⋮ → Install app (or Add to Home screen). Or use the "Install app" button on the Progress tab if it shows.
3. Open STILL from your home screen. It works offline after the first load.

## Notes
- Service workers and installation need HTTPS (or localhost). Opening index.html from a file will not install.
- Data is per browser and device; it does not sync. Use Progress → Export data for backups.
- Updating: edit files, change `VERSION` in service-worker.js, re-upload; reopen the app twice to receive the update.
- Deleting a habit archives it: past days keep their records, it just stops appearing from that day.
