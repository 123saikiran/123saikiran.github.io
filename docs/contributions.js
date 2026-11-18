import { prepareCalendar } from './contributions-data.js';

const section = document.querySelector('[data-github-user]');
const namespace = 'http://www.w3.org/2000/svg';
const HOUR = 60 * 60 * 1000;
const fullDate = new Intl.DateTimeFormat('en',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
const shortDate = new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
const monthName = new Intl.DateTimeFormat('en',{month:'short',timeZone:'UTC'});
let lastLoaded = 0;
let loading = false;

function svgElement(name, attributes, text) {
  const element = document.createElementNS(namespace,name);
  for (const [key,value] of Object.entries(attributes || {})) element.setAttribute(key,String(value));
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderCalendar(calendar) {
  const left = 28, top = 20, size = 10, pitch = 13;
  const svg = svgElement('svg',{width:left+calendar.weeks*pitch,height:114,viewBox:`0 0 ${left+calendar.weeks*pitch} 114`,role:'img','aria-labelledby':'calendar-chart-title calendar-chart-description'});
  svg.append(svgElement('title',{id:'calendar-chart-title'},`${calendar.total.toLocaleString()} contributions in the last year`));
  svg.append(svgElement('desc',{id:'calendar-chart-description'},`Public GitHub contribution calendar for ${section.dataset.githubUser}, ${shortDate.format(new Date(`${calendar.start}T00:00:00Z`))} through ${shortDate.format(new Date(`${calendar.end}T00:00:00Z`))}. Darker squares indicate more contributions. Each day has a tooltip with its date and count.`));
  for (const [row,label] of [[1,'Mon'],[3,'Wed'],[5,'Fri']]) svg.append(svgElement('text',{x:0,y:top+row*pitch+8,class:'calendar-label'},label));
  let previousMonth = null;
  let previousLabelColumn = -4;
  for (const day of calendar.days) {
    const date = new Date(day.timestamp);
    const month = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    if (month !== previousMonth && day.column - previousLabelColumn >= 2) {
      svg.append(svgElement('text',{x:left+day.column*pitch,y:10,class:'calendar-label'},monthName.format(date)));
      previousLabelColumn = day.column;
    }
    previousMonth = month;
    const cell = svgElement('rect',{x:left+day.column*pitch,y:top+day.row*pitch,width:size,height:size,rx:2,class:`calendar-day level-${day.level}`,'data-date':day.date,'data-count':day.count});
    const count = day.count === 1 ? '1 contribution' : `${day.count.toLocaleString()} contributions`;
    cell.append(svgElement('title',{},`${count} on ${fullDate.format(date)}`));
    svg.append(cell);
  }
  section.querySelector('.calendar-chart').replaceChildren(svg);
  section.querySelector('.calendar-total').textContent = `${calendar.total.toLocaleString()} contributions in the last year`;
  section.querySelector('.calendar-range').textContent = `${shortDate.format(new Date(`${calendar.start}T00:00:00Z`))} – ${shortDate.format(new Date(`${calendar.end}T00:00:00Z`))}`;
  section.querySelector('.calendar-content').hidden = false;
  section.querySelector('.calendar-status').hidden = true;
  const scroll = section.querySelector('.calendar-scroll');
  scroll.scrollLeft = scroll.scrollWidth - scroll.clientWidth;
  section.dataset.loadedAt = new Date().toISOString();
}

async function loadCalendar() {
  if (!section || loading) return;
  loading = true;
  const status = section.querySelector('.calendar-status');
  const retry = section.querySelector('.calendar-retry');
  retry.hidden = true;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(),12000);
  try {
    const username = encodeURIComponent(section.dataset.githubUser);
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`,{signal:controller.signal});
    if (!response.ok) throw new Error('Calendar request failed.');
    renderCalendar(prepareCalendar(await response.json()));
    section.querySelector('.calendar-freshness').textContent = 'Live public activity · updates hourly';
    lastLoaded = Date.now();
  } catch {
    if (lastLoaded) {
      section.querySelector('.calendar-freshness').textContent = 'Showing the last loaded activity. Refresh unavailable right now.';
    } else {
      status.hidden = false;
      status.textContent = 'The calendar couldn’t load right now. You can still view the activity on GitHub.';
    }
    retry.hidden = false;
  } finally {
    clearTimeout(timeout);
    loading = false;
  }
}

if (section) {
  section.querySelector('.calendar-retry').addEventListener('click',loadCalendar);
  loadCalendar();
  setInterval(() => { if (document.visibilityState === 'visible') loadCalendar(); },HOUR);
  document.addEventListener('visibilitychange',() => { if (document.visibilityState === 'visible' && Date.now()-lastLoaded >= HOUR) loadCalendar(); });
}
