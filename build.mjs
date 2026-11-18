import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(root, 'docs');
const data = JSON.parse(await readFile(path.join(root, 'src/content.json'), 'utf8'));
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
  return `<div class="workflow" role="img" aria-label="Illustrated Newsbot workflow: RSS feeds become a digest delivered to Telegram."><span class="workflow-label">WORKFLOW</span><div class="workflow-nodes"><span>RSS feeds</span><i aria-hidden="true">↓</i><span>Headlines & links</span><i aria-hidden="true">↓</i><span>Telegram</span></div><span class="workflow-command">newsbot digest --dry-run</span></div>`;
}
function project(item, index) {
  const visual = item.image ? `<figure class="project-visual"><img src="/${escape(item.image)}" alt="${escape(item.imageAlt)}" width="1920" height="1080" ${index ? 'loading="lazy"' : 'fetchpriority="high"'}><figcaption>Captured on Fire TV</figcaption></figure>` : workflow();
  return `<article class="project"><div class="project-main">${visual}<div class="project-copy"><p class="project-category">${escape(item.category)}</p><h3>${link(item.repository,item.name)}</h3><p class="project-summary">${escape(item.summary)}</p><ul class="tags" aria-label="Technologies used">${item.tags.map(tag => `<li>${escape(tag)}</li>`).join('')}</ul><div class="project-links">${link(item.repository,'GitHub')}${link(item.readme,'README')}</div></div></div>${notes(item.notes,'A closer look')}</article>`;
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
  <link rel="stylesheet" href="/site.css"><script src="/site.js" defer></script>
</head>
<body class="${kind}">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="shooting-sky" aria-hidden="true"><i class="shooting-star"></i><i class="shooting-star star-two"></i><i class="shooting-star star-three"></i></div>
  <div class="shell">
    <header class="site-header"><a class="monogram" href="/${kind}/" aria-label="${escape(data.name)} — ${role} home">${escape(data.initial)}<span>.</span></a><nav aria-label="Main navigation"><a href="#work">Work</a><a href="#about">About</a><a href="#contact">Contact</a></nav><button class="motion-toggle" aria-pressed="true" aria-label="Toggle shooting star animation">Stars on</button></header>
    <main id="main">
      <section class="intro" aria-labelledby="name"><div class="profile"><span class="avatar" aria-hidden="true">${escape(data.initial)}</span><div><h1 id="name">${escape(data.name)}<span class="name-dot">.</span></h1><p class="role">${role}</p></div></div><p class="intro-copy">${escape(content.intro)}</p><div class="intro-links">${link(data.github,'GitHub')}<a href="#work">${developer?'Selected projects':'Selected edits'} <span aria-hidden="true">↓</span></a></div></section>
      <section id="work" aria-labelledby="work-title"><div class="section-heading"><h2 id="work-title">${developer?'Selected projects':'Selected edits'}</h2><span>${developer?'CODE & CONTEXT':'01 — 02'}</span></div>${developer ? `<div class="project-list">${content.projects.map(project).join('')}</div>` : `<p class="work-note">Two edits are being prepared for this collection.</p><div class="video-list">${content.videos.map(video).join('')}</div>`}</section>
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
for (const file of ['site.css','site.js']) await cp(path.join(root,'src',file),path.join(out,file));
for (const kind of ['developer','editor']) {
  await mkdir(path.join(out,kind),{recursive:true});
  await writeFile(path.join(out,kind,'index.html'),page(kind));
}
await writeFile(path.join(out,'index.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0; url=/developer/"><title>${escape(data.name)} — Portfolio</title><link rel="canonical" href="${escape(data.origin)}/developer/"></head><body style="background:#fff;color:#000;font:16px Arial,sans-serif;padding:32px"><a href="/developer/">Open the developer portfolio</a> · <a href="/editor/">Open the video editing portfolio</a></body></html>`);
await writeFile(path.join(out,'404.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found</title><link rel="stylesheet" href="/site.css"></head><body><main class="not-found"><h1>Page not found.</h1><p>Try one of the portfolios.</p><a href="/developer/">Development ↗</a> · <a href="/editor/">Video editing ↗</a></main></body></html>`);
await writeFile(path.join(out,'.nojekyll'), '');
console.log('Built /developer/ and /editor/. Two public projects; two video slots.');
