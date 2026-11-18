const toggle = document.querySelector('.motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let enabled = true;
try { enabled = localStorage.getItem('saikiran-stars') !== 'off'; } catch {}

function renderMotion() {
  const active = enabled && !reducedMotion.matches;
  document.body.classList.toggle('stars-paused', !active);
  toggle?.setAttribute('aria-pressed', String(active));
  if (toggle) {
    toggle.textContent = active ? 'Stars on' : 'Stars off';
    toggle.disabled = reducedMotion.matches;
    toggle.title = reducedMotion.matches ? 'Your reduced-motion preference is active' : 'Pause or resume the shooting stars';
  }
}
toggle?.addEventListener('click', () => {
  enabled = !enabled;
  try { localStorage.setItem('saikiran-stars', enabled ? 'on' : 'off'); } catch {}
  renderMotion();
});
reducedMotion.addEventListener('change', renderMotion);
renderMotion();

const newsbot = document.querySelector('[data-newsbot]');
if (newsbot) {
  const workflowToggle = newsbot.querySelector('.workflow-toggle');
  let workflowEnabled = true;
  function renderWorkflowMotion() {
    const active = workflowEnabled && !reducedMotion.matches;
    newsbot.classList.toggle('workflow-paused', !active);
    workflowToggle.setAttribute('aria-pressed', String(active));
    workflowToggle.textContent = reducedMotion.matches ? 'Motion off' : active ? 'Pause' : 'Play';
    workflowToggle.disabled = reducedMotion.matches;
  }
  workflowToggle.addEventListener('click', () => {
    workflowEnabled = !workflowEnabled;
    renderWorkflowMotion();
  });
  reducedMotion.addEventListener('change', renderWorkflowMotion);
  renderWorkflowMotion();
}
