import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'docs');
const data = JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8'));
const revisions = Object.fromEntries(await Promise.all(['site.css','site.js','contributions.js'].map(async file => [file,createHash('sha256').update(await readFile(path.join(root,'src',file))).digest('hex').slice(0,10)])));
const assetUrl = file => `/${file}?v=${revisions[file]}`;
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const arrow = '<span aria-hidden="true">↗</span>';
const icon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 5.5 18 12 8 18.5v-13Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>';

function safeUrl(value, { local = false } = {}) {
  if (local && /^assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return `/${value}`;
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error(`Use an HTTPS URL: ${value}`);
  return url.href;
}
function link(url, label, className = '') {
  return `<a class="${className}" href="${escape(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${escape(label)} ${arrow}</a>`;
}
function notes(items, summary) {
  if (!items?.length) return '';
  return `<details class="notes"><summary>${escape(summary)}<span class="expand-icon" aria-hidden="true"></span></summary><div class="notes-body">${items.map(item => `<p><strong>${escape(item.label)}.</strong> ${escape(item.text)}</p>`).join('')}</div></details>`;
}
function workflow() {
  return `<div class="workflow" data-newsbot><span class="workflow-label">WORKFLOW</span><button class="workflow-toggle" type="button" aria-pressed="true" aria-label="Toggle Newsbot animation">Pause</button><svg class="newsbot-animation" viewBox="0 0 240 140" role="img" aria-labelledby="newsbot-animation-title newsbot-animation-description"><title id="newsbot-animation-title">Newsbot workflow</title><desc id="newsbot-animation-description">An animated illustration: RSS headlines flow into a digest, then a paper plane delivers it to Telegram.</desc><g aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="newsbot-route" d="M64 66h34m-4-3 3 3-3 3m48-3h34m-4-3 3 3-3 3"/><rect class="newsbot-node" x="16" y="42" width="48" height="48" rx="9"/><circle cx="30" cy="76" r="2" fill="#000" stroke="none"/><path class="newsbot-icon" d="M29 65a12 12 0 0 1 12 12M29 55a22 22 0 0 1 22 22"/><rect class="newsbot-document" x="103" y="44" width="34" height="44" rx="3"/><path class="newsbot-icon" d="M111 56h18m-18 8h18m-18 8h12"/><circle class="newsbot-node" cx="200" cy="66" r="24"/><g class="newsbot-plane"><path class="newsbot-icon" d="m185 65 29-10-9 25-7-10-13-5Zm13 5 16-15"/></g><g class="newsbot-check"><circle cx="218" cy="83" r="7" fill="#fff" stroke="#000"/><path d="m215 83 2 2 4-4" stroke="#000" stroke-width="1.1"/></g><g class="newsbot-packet packet-in"><rect x="66" y="61" width="8" height="10" rx="1" fill="#fff" stroke="#000" stroke-width="1"/><path d="M68 64h4m-4 3h4" stroke="#000" stroke-width=".7"/></g><circle class="newsbot-packet packet-out" cx="142" cy="66" r="2" fill="#000" stroke="none"/></g><g class="newsbot-labels" text-anchor="middle"><text x="40" y="111">RSS feeds</text><text x="120" y="111">Digest</text><text x="200" y="111">Telegram</text></g></svg><span class="workflow-command">newsbot digest --dry-run</span></div>`;
}
function project(item, index) {
  const visual = item.image ? `<figure class="project-visual"><img src="/${escape(item.image)}" alt="${escape(item.imageAlt)}" width="1920" height="1080" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}><figcaption>Captured on Fire TV</figcaption></figure>` : workflow();
  return `<article class="project" id="${escape(item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'))}"><div class="project-main">${visual}<div class="project-copy"><p class="project-category">${escape(item.category)}</p><h3>${link(item.repository,item.name)}</h3><p class="project-summary">${escape(item.summary)}</p><ul class="tags" aria-label="Technologies used">${item.tags.map(tag => `<li>${escape(tag)}</li>`).join('')}</ul><div class="project-links">${link(item.repository,'GitHub')}${link(item.readme,'README')}</div></div></div>${notes(item.notes,'A closer look')}</article>`;
}
function video(item, index) {
  let visual;
  if (!item.media) {
    visual = `<div class="video-placeholder"><span class="video-index">0${index + 1}</span><span class="video-placeholder-center">${icon}<span>Video coming soon</span></span><span class="video-placeholder-foot">${escape(item.subtitle)}</span></div>`;
  } else if (item.media.type === 'file') {
    const src = safeUrl(item.media.src, {local:true});
    const poster = item.media.poster ? ` poster="${escape(safeUrl(item.media.poster,{local:true}))}"` : '';
    visual = `<video controls playsinline preload="metadata" aria-label="${escape(item.title)}"${poster}><source src="${escape(src)}">Your browser does not support this video. <a href="${escape(src)}">Open the video</a>.</video>`;
  } else if (item.media.type === 'embed') {
    const url = new URL(safeUrl(item.media.src));
    if (!['www.youtube-nocookie.com','player.vimeo.com'].includes(url.hostname)) throw new Error('Use a YouTube privacy-enhanced or Vimeo player embed URL.');
    visual = `<iframe src="${escape(url.href)}" title="${escape(item.title)}" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen></iframe>`;
  } else throw new Error('Unsupported video media type.');
  return `<article class="video-work"><div class="video-frame">${visual}</div><div class="video-caption"><h3>${escape(item.title)}</h3><p>${escape(item.role || item.subtitle)}</p></div>${notes(item.notes,'Behind the edit')}</article>`;
}
function page(kind) {
  const developer = kind === 'developer';
  const role = developer ? 'Developer' : 'Video editor';
  const otherRole = developer ? 'Video editing' : 'Development';
  const otherPath = developer ? '/editor/' : '/developer/';
  const content = data[kind];
  const contact = data.email ? `<a class="contact-link" href="mailto:${escape(data.email)}">Say hello ${arrow}</a>` : link(data.github,'Find me on GitHub','contact-link');
  const description = `${data.name} — ${role.toLowerCase()}. ${content.intro}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(data.name)} — ${role}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#ffffff">
  <meta property="og:type" content="website"><meta property="og:title" content="${escape(data.name)} — ${role}"><meta property="og:description" content="${escape(content.intro)}"><meta property="og:url" content="${escape(data.origin)}/${kind}/">
  <link rel="canonical" href="${escape(data.origin)}/${kind}/"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${assetUrl('site.css')}"><script src="${assetUrl('site.js')}" defer></script>${developer ? `<script src="${assetUrl('contributions.js')}" type="module"></script>` : ''}
</head>
<body class="${kind}">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="shooting-sky" aria-hidden="true"><i class="shooting-star"></i><i class="shooting-star star-two"></i><i class="shooting-star star-three"></i></div>
  <div class="shell">
    <header class="site-header"><a class="monogram" href="/${kind}/" aria-label="${escape(data.name)} — ${role} home">${escape(data.initial)}<span>.</span></a><nav aria-label="Main navigation"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav><button class="motion-toggle" aria-pressed="true" aria-label="Toggle shooting star animation">Stars on</button></header>
    <main id="main">
      <section class="intro" aria-labelledby="name"><div class="profile"><span class="avatar" aria-hidden="true">${escape(data.initial)}</span><div><h1 id="name">${escape(data.name)}<span class="name-dot">.</span></h1><p class="role">${role}</p></div></div><p class="intro-copy">${escape(content.intro)}</p><div class="intro-links">${link(data.github,'GitHub')}<a href="#work">${developer?'Selected projects':'Selected edits'} <span aria-hidden="true">↓</span></a></div></section>
      <section id="work" aria-labelledby="work-title"><div class="section-heading"><h2 id="work-title">${developer?'Selected projects':'Selected edits'}</h2><span>${developer?'CODE & CONTEXT':'01 — 02'}</span></div>${developer ? `<div class="project-list">${content.projects.map(project).join('')}</div>` : `<p class="work-note">Two edits are being prepared for this collection.</p><div class="video-list">${content.videos.map(video).join('')}</div>`}</section>
      ${developer ? `<section id="contributions" class="contributions" data-github-user="${escape(new URL(data.github).pathname.split('/').filter(Boolean)[0])}" aria-labelledby="contributions-title"><div class="section-heading"><h2 id="contributions-title">GitHub contributions</h2>${link(`${data.github}?tab=overview`,'View on GitHub','calendar-profile-link')}</div><p class="calendar-status" role="status" aria-live="polite">Loading public activity…</p><div class="calendar-content" hidden><p class="calendar-total"></p><div class="calendar-scroll" tabindex="0" role="region" aria-label="GitHub contribution calendar, scroll to explore the year"><div class="calendar-chart"></div></div><div class="calendar-footer"><span class="calendar-range"></span><span class="calendar-legend" aria-label="Contribution intensity, less to more">Less <i class="level-0"></i><i class="level-1"></i><i class="level-2"></i><i class="level-3"></i><i class="level-4"></i> More</span></div><p class="calendar-freshness">Live public activity · updates hourly</p></div><button class="calendar-retry" type="button" hidden>Try again</button><noscript><p class="calendar-no-script">Enable JavaScript to load the live calendar, or use the GitHub link above.</p></noscript></section>` : ''}
      <section class="about-contact"><div id="about"><h2>${developer?'A little background':'Behind the edits'}</h2><p>${escape(content.about)}</p></div><div id="contact"><h2>Let’s connect</h2><p>${developer?'Have something in mind?':'Want to talk about an edit?'}</p>${contact}</div></section>
    </main>
    <footer><span>${escape(data.name)} / ${role}</span><a href="${otherPath}">${otherRole} ${arrow}</a></footer>
  </div>
</body>
</html>`;
}

if (!data.name || !data.initial || !data.developer.projects.length) throw new Error('Add a name and at least one developer project.');
if (data.editor.videos.length !== 2) throw new Error('This portfolio is designed for exactly two edits.');
safeUrl(data.github); safeUrl(data.origin);
for (const item of data.developer.projects) {
  const repository = new URL(safeUrl(item.repository));
  if (repository.hostname !== 'github.com') throw new Error('Project proof must link to GitHub.');
  if (item.image) {safeUrl(item.image,{local:true}); await access(path.join(root,'src',item.image));}
}
for (const item of data.editor.videos) {
  if (item.media?.src?.startsWith('assets/')) await access(path.join(root,'src',item.media.src));
  if (item.media?.poster?.startsWith('assets/')) await access(path.join(root,'src',item.media.poster));
}
await mkdir(out,{recursive:true});
await cp(path.join(root,'src/assets'),path.join(out,'assets'),{recursive:true});
for (const file of ['site.css','site.js','contributions.js','contributions-data.js']) await cp(path.join(root,'src',file),path.join(out,file));
for (const kind of ['developer','editor']) {
  await mkdir(path.join(out,kind),{recursive:true});
  await writeFile(path.join(out,kind,'index.html'),page(kind));
}
await writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=/developer/"><title>${escape(data.name)} — Portfolio</title><link rel="canonical" href="${escape(data.origin)}/developer/"></head><body style="background:#fff;color:#000;font:16px Arial,sans-serif;padding:32px"><a href="/developer/">Open the developer portfolio</a> · <a href="/editor/">Open the video editing portfolio</a></body></html>`);
await writeFile(path.join(out,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found</title><link rel="stylesheet" href="/site.css"></head><body><main class="not-found"><h1>Page not found.</h1><p>Try one of the portfolios.</p><a href="/developer/">Development ↗</a> · <a href="/editor/">Video editing ↗</a></main></body></html>`);
await writeFile(path.join(out,'.nojekyll'), '');
console.log('Built /developer/ and /editor/. Two public projects; two video slots.');
