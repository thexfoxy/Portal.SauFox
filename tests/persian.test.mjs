import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const load = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const script = await load('portal.js');
const numbers = await load('js/numbers.js');
const source = script.slice(script.indexOf('const LANG ='), script.indexOf('// h('));
const helpers = (lang) => runInNewContext(`${numbers}\nconst SauFoxNumbers = window.SauFoxNumbers;\n${source}\n({ digits, rials, when, t, FA })`, {window:{}, document:{documentElement:{lang}}});

test('Persian portal amounts, dates and ticket counts retain numeric order', () => {
  const fa = helpers('fa');
  assert.equal(fa.rials(1234567), '\u2066۱٬۲۳۴٬۵۶۷\u2069 ریال');
  assert.equal(fa.digits(12345), '\u2066۱۲۳۴۵\u2069');
  assert.equal(fa.t('{name} plan ({days} days)', {name:'طلا',days:30}), 'اشتراک طلا (\u2066۳۰\u2069 روزه)');
  assert.match(fa.when('2026-10-02T15:45:00Z'), /\u2066[۰-۹]+:[۰-۹]+\u2069/);
  for (const [key, value] of Object.entries(fa.FA)) assert.deepEqual((value.match(/\{\w+\}/g)||[]).sort(), (key.match(/\{\w+\}/g)||[]).sort(), key);
  const en = helpers('en');
  assert.equal(en.rials(1234567), '1,234,567 Rials');
  assert.equal(en.digits(12345), '12345');
});

test('portal loads its numeric formatter before rendering the app', async () => {
  const html = await load('index.html');
  assert.ok(html.indexOf('js/numbers.js?') >= 0 && html.indexOf('js/numbers.js?') < html.indexOf('portal.js?'));
});
