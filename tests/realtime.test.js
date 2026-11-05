// index.html'deki load() fonksiyonunu gerçek supabase-js istemcisiyle iki kez çalıştırır.
// Giriş ekranı açıkken oturum da otomatik açılınca startApp() → load() ikinci kez çağrılır;
// supabase-js aynı isimli kanalı geri verir ve subscribe() sonrası .on() hata fırlatır.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createClient } from '@supabase/supabase-js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function extract(name) {
  const start = html.indexOf(`async function ${name}(){`);
  let i = html.indexOf('{', start), depth = 0;
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) break;
  }
  return html.slice(start, i + 1);
}

test('load() ikinci kez çağrılınca realtime kanalı hata vermez ve tek kalır', async () => {
  const sb = createClient('http://localhost:1', 'anon', { auth: { persistSession: false } });
  sb.auth.getSession = async () => ({ data: { session: { user: { id: 'u1' } } } });
  const ctx = {
    sb, workspaceId: 'ws1', S: {}, BASE: null, VER: 0, myUid: null, ref: null, realtime: null,
    fetchBook: async () => null, clone: x => x, same: () => true, save() {}, absorbRemote: () => true,
    refreshView() {}, setInterval: () => 0, clearInterval() {}, console, window: {}, Number, Array, Object, Error,
  };
  vm.createContext(ctx);
  vm.runInContext(extract('load'), ctx);
  await ctx.load();
  // Tarayıcıda soket bağlıyken kanal hemen 'joining' durumuna geçer; testte bunu taklit et.
  ctx.realtime.channelAdapter.state = 'joining';
  await ctx.load();
  assert.equal(sb.getChannels().filter(c => c.topic === 'realtime:book-ws1').length, 1);
  await sb.removeAllChannels();
});
