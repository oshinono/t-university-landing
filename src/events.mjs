const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const dayLabel = new Intl.DateTimeFormat('ru-RU', {dateStyle:'long', timeZone:'Europe/Moscow'});
const today = now => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow'}).format(now);
function validDay(s) {
  return typeof s === 'string' && /^\d{4}-\d\d-\d\d$/.test(s) && Number.isFinite(Date.parse(s)) && new Date(s).toISOString().startsWith(s);
}
export function agenda(events, now = new Date()) {
  if (!Array.isArray(events)) throw Error('Ожидается массив мероприятий');
  const next = [], day = today(now);
  for (const e of events) {
    if (!e || !validDay(e.start) || (e.end !== undefined && (!validDay(e.end) || e.end < e.start)) || !['title','place','description'].every(k => typeof e[k] === 'string' && e[k].trim()) || (e.time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)) || (e.url !== undefined && (typeof e.url !== 'string' || new URL(e.url).protocol !== 'https:'))) throw Error('Некорректное мероприятие');
    if ((e.end || e.start) >= day) next.push(e);
  }
  function card(e) {
    const date = d => `<time datetime="${d}">${dayLabel.format(new Date(d))}</time>`;
    return `<article class="agenda-card" data-start="${e.start}" data-end="${e.end || e.start}"><div class="agenda-stamp" aria-hidden="true"><b>${e.start.slice(-2)}</b>${new Intl.DateTimeFormat('ru', {month:'short',timeZone:'UTC'}).format(new Date(e.start))}</div><div><p class="agenda-date">${date(e.start)}${e.end && e.end !== e.start ? ' — '+date(e.end) : ''}${e.time ? ' · '+escape(e.time)+' мск' : ''}</p><h3>${escape(e.title)}</h3><p class="agenda-place"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>${escape(e.place)}</p><p>${escape(e.description)}</p>${e.url ? `<a href="${escape(e.url)}">Перейти к регистрации</a>` : ''}</div></article>`;
  }
  next.sort((a,b) => (a.start+(a.time||'')).localeCompare(b.start+(b.time||'')));
  return '<h3 class="agenda-heading">Ближайшие события</h3>' + (next.length ? next.map(card).join('') : '<div class="agenda-empty"><strong>Новые даты скоро появятся</strong><p><a href="#footer">Уточнить расписание</a></p></div>');
}
