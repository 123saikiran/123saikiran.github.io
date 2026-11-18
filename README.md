# Saikiran's portfolio

A simple portfolio with separate developer and video editing pages, white backgrounds, black text, short transitions, and shooting stars.

- **Website:** https://123saikiran.github.io/
- **Developer:** https://123saikiran.github.io/developer/
- **Video editor:** https://123saikiran.github.io/editor/

## Work proof

The developer page features two public projects:

- [AFT Home](https://github.com/123saikiran/fire-TV-custom-launcher): native Fire TV launcher. Its image is the masked screenshot from the public repository.
- [Newsbot](https://github.com/123saikiran/Newsbot): RSS headlines-and-links digest for Telegram. Its preview is an illustrative workflow of the documented behavior.

Descriptions are grounded in the public READMEs. No employment history, usage metrics, or finished video work has been invented. The public GitHub profile is used for contact; no account email or credentials are included.

## Motion

The stars can be paused, and that preference persists between the two pages. System reduced-motion preferences disable stars and transitions. The animation layer does not intercept clicks.

The Newsbot card has a small, monochrome workflow animation: headlines flow from RSS feeds into a digest, then a paper plane delivers it to Telegram. It is an illustration of the documented workflow, not a running bot. Its Pause/Play control is independent of the stars, and reduced-motion preferences show a static diagram.

## Live contributions

The developer page fetches the public calendar for `123saikiran` on each visit using [GitHub Contributions API](https://github.com/grubersjoe/github-contributions-api). It refreshes hourly while the page is visible and when returning to a tab whose data is at least an hour old. The service caches GitHub data for one hour; this is a live data widget, not an instantaneous event feed.
