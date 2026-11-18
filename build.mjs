import {readFileSync as read, writeFileSync as write, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {transformSync} from 'esbuild';
const source = path => read(path, 'utf8');
import {agenda} from './src/events.mjs';
import {metadata} from './src/seo.mjs';
const base = process.env.SITE_URL ? new URL(process.env.SITE_URL) : null;
if (base && (base.protocol !== 'https:' || base.search || base.hash || base.username || base.password)) throw Error('SITE_URL: нужен публичный HTTPS-адрес');
if (base && !base.pathname.endsWith('/')) base.pathname += '/';
if (!base && process.env.NODE_ENV === 'production') throw Error('Задайте SITE_URL перед публикацией');
const agendaHTML = agenda(JSON.parse(source('data/events.json')));
const hash = createHash('sha256');
for (const [file, loader] of [['css/style', 'css'], ['js/app', 'js']]) {
  let input = source(`${file}.${loader}`);
  if (loader === 'js') input = `{${source('src/events.mjs').replace('export function agenda','function agenda')}\n${source('src/site.js')}}\n${input}`;
  if (loader === 'css') input += source('src/site.css');
  const {code} = transformSync(input, {loader, minify: true, legalComments: 'inline', charset: 'utf8'});
  write(`${file}.min.${loader}`, code);
  hash.update(code);
}
const version = hash.digest('hex').slice(0, 12);
const programs = JSON.parse(source('src/programs.json'));
const escape = s => s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const label = s => s[0].toUpperCase() + s.slice(1);
const cards = programs.map(({title, level, code, url}) => {
  const tag = url ? 'a' : 'article';
  return `<${tag}${url ? ` href="${escape(url)}"` : ''} class="course-card" data-level="${escape(level)}"><div class="course-info"><p>${escape(level)}</p><p>${escape(code)}</p></div><p class="course-title">${escape(title)}</p></${tag}>`;
}).join('\n');
const levels = [...new Set(programs.map(p => p.level))].map(l => `<label><input type="checkbox" name="level" value="${escape(l)}"> ${escape(label(l))}</label>`).join('\n');
const pages = ['index.html', ...programs.filter(p => p.url).map(p => p.url)];
write('robots.txt', `User-agent: *\nAllow: /\n${base ? `Sitemap: ${new URL('sitemap.xml', base)}\n` : ''}`);
if (base) write('sitemap.xml', `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${escape(new URL(p === 'index.html' ? './' : p,base).href)}</loc></url>`).join('')}</urlset>\n`);
else rmSync('sitemap.xml', {force:true});
for (const page of pages) {
  const p = programs.find(p => p.url === page);
  const vars = {seo: metadata(base, page, p), agenda: agendaHTML, cards, levels, version, home: p ? 'index.html' : '', programTitle: p && escape(p.title), programCode: p && escape(p.code), programLevel: p && escape(label(p.level))};
  const html = source(`src/${p ? 'course.html' : page}`).replace(/{{(header|footer)}}/g, (_, name) => source(`src/${name}.html`)).replace(/{{(\w+)}}/g, (_, key) => {if (vars[key] == null) throw Error(key); return vars[key];});
  write(page, html);
}
