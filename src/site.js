const root = document.documentElement;
const menu = document.querySelector('#site-menu');
const toggle = document.querySelector('.icon-menu');
const mobile = matchMedia('(width < 890px)');
function setMenu(open) {
  root.classList.toggle('menu-open', open);
  root.classList.toggle('lock', open);
  toggle.setAttribute('aria-expanded', String(open));
  menu.inert = mobile.matches && !open;
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  if (open) menu.querySelector('a').focus({preventScroll: true});
}
toggle.addEventListener('click', () => setMenu(menu.inert));
menu.addEventListener('click', event => {
  if (event.target.closest('a') && mobile.matches) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (!root.classList.contains('menu-open')) return;
  if (event.key === 'Escape') { setMenu(false); toggle.focus(); }
  if (event.key === 'Tab') {
    const first = menu.querySelector('a');
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); toggle.focus(); }
    else if (!event.shiftKey && document.activeElement === toggle) { event.preventDefault(); first.focus(); }
  }
});
mobile.addEventListener('change', () => setMenu(false));
window.addEventListener('pageshow', () => setMenu(false));
setMenu(false);
root.classList.add('menu-ready');

const schedule = document.querySelector('#agenda');
if (schedule) {
  const calendar = document.querySelector('#event-calendar');
  let current = today(new Date());
  let month = new Date(current.slice(0,7)+'-01T00:00:00Z');
  let selected = '', original = schedule.innerHTML;
  const source = document.createElement('template');
  function refresh() {
    source.innerHTML = original;
    const cards = [...source.content.querySelectorAll('[data-start]')];
    const matches = d => cards.filter(c => c.dataset.start <= d && d <= c.dataset.end);
    const monthName = month.toLocaleDateString('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'});
    const cells = Array((month.getUTCDay()+6)%7).fill('<span></span>');
    const date = new Date(month);
    while (date.getUTCMonth() === month.getUTCMonth()) {
      const d = date.toISOString().slice(0,10), count = matches(d).length;
      cells.push(`<button type="button" data-day="${d}" aria-label="${dayLabel.format(date)}, событий: ${count}" aria-pressed="${selected===d}" ${d===current?'aria-current="date"':''} class="${count?'has-events':''}">${date.getUTCDate()}</button>`);
      date.setUTCDate(date.getUTCDate()+1);
    }
    calendar.innerHTML = `<div class="cal-nav"><button data-step="-1" aria-label="Предыдущий месяц">‹</button><strong aria-live="polite">${monthName}</strong><button data-step="1" aria-label="Следующий месяц">›</button></div><div class="cal-grid">${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(w=>`<small>${w}</small>`).join('')}${cells.join('')}</div><button type="button" data-today>Сегодня</button>`;
    calendar.hidden = false;
    const hits = selected && matches(selected);
    schedule.innerHTML = selected ? `<h3 class="agenda-heading">${dayLabel.format(new Date(selected))}</h3>${hits.length ? hits.map(c=>c.outerHTML).join('') : '<p class="agenda-empty">На этот день мероприятий нет.</p>'}` : original;
  }
  refresh();
  calendar.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.step) { month.setUTCMonth(month.getUTCMonth()+Number(b.dataset.step)); selected=''; }
    else if (b.dataset.day) selected = b.dataset.day === selected ? '' : b.dataset.day;
    else if (b.hasAttribute('data-today')) { current = selected = today(new Date()); month = new Date(current.slice(0,7)+'-01T00:00:00Z'); }
    else return;
    refresh();
    calendar.querySelector(b.hasAttribute('data-today') ? '[data-today]' : b.dataset.day ? `[data-day="${b.dataset.day}"]` : `[data-step="${b.dataset.step}"]`).focus({preventScroll:true});
  });
  if (location.protocol !== 'file:') fetch('data/events.json', {cache:'no-cache'}).then(r => {
    if (!r.ok) throw Error(`HTTP ${r.status}`);
    return r.json();
  }).then(events => {
    const html = agenda(events);
    if (html !== original && !calendar.contains(document.activeElement) && !schedule.contains(document.activeElement)) { original = html; refresh(); }
  }).catch(error => console.warn('Афиша: показана версия из HTML.', error));
}

const form = document.querySelector('#program-filter');
if (form) {
  const cards = [...document.querySelectorAll('#program-list > *')];
  const more = document.querySelector('#program-more');
  const status = document.querySelector('#program-status');
  const normalize = s => s.toLocaleLowerCase('ru').replaceAll('ё','е').trim();
  const search = form.elements.q;
  let expanded = false;
  function render() {
    const levels = new FormData(form).getAll('level');
    const words = normalize(search.value).split(/\s+/);
    let count = 0;
    for (const card of cards) {
      const match = (!levels.length || levels.includes(card.dataset.level)) && words.every(w => normalize(card.textContent).includes(w));
      card.hidden = !match || (++count > 6 && !expanded);
    }
    status.textContent = count ? `Показано ${expanded ? count : Math.min(count, 6)} из ${count}` : 'Ничего не найдено';
    more.hidden = count <= 6;
    more.textContent = expanded ? 'Скрыть' : 'Показать ещё';
    more.setAttribute('aria-expanded', String(expanded));
  }
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('input', () => { expanded = false; render(); });
  form.addEventListener('reset', () => { expanded = false; setTimeout(render, 0); });
  more.addEventListener('click', () => { expanded = !expanded; render(); });
  form.hidden = false;
  render();
}
