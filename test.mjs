import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
const read = path => readFileSync(path, 'utf8');
import {agenda} from './src/events.mjs';
import {metadata} from './src/seo.mjs';
test('Афиша, архив, безопасная регистрация и SEO', () => {
  const e = {title:'День Т', start:'2026-02-23', place:'ДГТУ', description:'Встреча', url:'https://example.org/'};
  assert.match(agenda([e], new Date('2026-02-23T20:59Z')), /Перейти к регистрации/);
  assert.doesNotMatch(agenda([e], new Date('2026-02-23T21:00Z')), /Перейти к регистрации|День Т|<details>/);
  assert.throws(() => agenda([{...e,url:'javascript:void(0)'}]));
  assert.match(metadata(new URL('https://example.org/sub/'), 'index.html'), /property="og:image" content="https:\/\/example.org\/sub\/img\/social-card.png"/);
});
const programs = JSON.parse(read('src/programs.json'));
test('Статические страницы и локальные ссылки', () => {
  for (const path of ['index.html', ...programs.map(p => p.url).filter(Boolean)]) {
    const html = read(path);
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
    assert.doesNotMatch(html, /{{\w+}}|data-goto|id="loader"|href="#"/);
    for (const [, ref] of html.matchAll(/(?:href|src|srcset)=["']([^"']+)["']/g)) {
      if (/^\w+:/.test(ref)) continue;
      const [file, fragment] = ref.split('#');
      const target = file.split('?')[0] || path;
      assert.ok(existsSync(target), ref);
      if (fragment) assert.ok(read(target).includes(`id="${fragment}"`), ref);
    }
  }
  const home = read('index.html');
  assert.equal([...home.matchAll(/class="course-card"/g)].length, programs.length);
  for (const {url, title} of programs.filter(p => p.url)) {
    assert.ok(home.includes(`href="${url}" class="course-card"`));
    assert.ok(read(url).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)[1].trim() === title);
  }
});
