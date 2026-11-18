# Saikiran's portfolio

A simple portfolio with separate developer and video editing pages, white backgrounds, black text, short transitions, and shooting stars.

- **Website:** https://123saikiran.github.io/
- **Developer:** https://123saikiran.github.io/developer/
- **Video editor:** https://123saikiran.github.io/editor/

## Update the site

Edit `src/content.json`, then rebuild the generated site:

```sh
npm run build
```

Commit both the source changes and the updated `docs/` files. GitHub Pages publishes from the `main` branch's `/docs` folder. No dependency installation is needed.

## Preview locally

```sh
npm run build
cd docs
python3 -m http.server 4320 --bind 127.0.0.1
```

Open http://127.0.0.1:4320/.

## Add the two edits

There are exactly two video slots in `src/content.json`. Add the finished files in `src/assets/`, then set each entry's `media` field:

```json
{"type":"file","src":"assets/edit-01.mp4","poster":"assets/edit-01.jpg"}
```

The poster is optional. HTTPS video URLs also work. For a YouTube privacy-enhanced embed:

```json
{"type":"embed","src":"https://www.youtube-nocookie.com/embed/VIDEO_ID"}
```

Vimeo player embed URLs are supported too. Update each video's title, role, and notes when the work is ready. The live page labels the slots as coming soon until media is supplied.

## Work proof

The developer page features two public projects:

- [AFT Home](https://github.com/123saikiran/fire-TV-custom-launcher): native Fire TV launcher. Its image is the masked screenshot from the public repository.
- [Newsbot](https://github.com/123saikiran/Newsbot): RSS headlines-and-links digest for Telegram. Its preview is an illustrative workflow of the documented behavior.

Descriptions are grounded in the public READMEs. No employment history, usage metrics, or finished video work has been invented. The public GitHub profile is used for contact; no account email or credentials are included.

## Motion

The stars can be paused, and that preference persists between the two pages. System reduced-motion preferences disable stars and transitions. The animation layer does not intercept clicks.

## Live contributions

The developer page fetches the public calendar for `123saikiran` on each visit using [GitHub Contributions API](https://github.com/grubersjoe/github-contributions-api). It refreshes hourly while the page is visible and when returning to a tab whose data is at least an hour old. The service caches GitHub data for one hour; this is a live data widget, not an instantaneous event feed.

No token is included in the site. Calendar cells and totals come from the API response. Failures show a retry action and direct GitHub link, and existing loaded data is labeled if a refresh fails. Tests cover UTC week alignment, year boundaries, count consistency, and malformed/gapped data.
