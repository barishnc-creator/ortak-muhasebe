// 3D Atölye: saf hesaplar. Çalıştır: node --test tests/
const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('../atolye.js');

test('ölçek: yükseklik hedef mm olur, oran korunur, taban z=0, ortalı',()=>{
 const f=A.fit({min:[-1,2,0.5],max:[3,4,2.5]},80); // yükseklik 2 → s=40
 assert.equal(f.s,40);
 assert.deepEqual([f.tx,f.ty,f.tz],[-40,-120,-20]);
 // dönüştürülmüş kutu
 const z0=0.5*f.s+f.tz,z1=2.5*f.s+f.tz,x0=-1*f.s+f.tx,x1=3*f.s+f.tx;
 assert.equal(z0,0);assert.equal(z1,80);assert.equal(x0,-x1);
 assert.deepEqual(f.size,[160,80,80]);
});
test('ölçek: geçersiz hedef veya düz model hata verir',()=>{
 assert.throws(()=>A.fit({min:[0,0,0],max:[1,1,1]},0));
 assert.throws(()=>A.fit({min:[0,0,0],max:[1,1,0]},50));
});
test('mm girişi: virgül kabul, 5–300 arası',()=>{
 assert.equal(A.mm('80'),80);assert.equal(A.mm('72,5'),72.5);
 assert.equal(A.mm('2'),null);assert.equal(A.mm('abc'),null);assert.equal(A.mm('400'),null);
});
test('dosya adı: Türkçe karakter sadeleşir, ölçü eklenir',()=>{
 assert.equal(A.stlName('Çiçekli Kedi Şamdan!',80),'cicekli-kedi-samdan-80mm.stl');
 assert.equal(A.stlName('',72.5),'model-72.5mm.stl');
});
test('konsept adresleri: 4 farklı tohum, fotoğraf varsa referans eklenir',()=>{
 const u=A.concepts('kedi figürü','https://x.supabase.co/p.jpg');
 assert.equal(u.length,4);assert.equal(new Set(u.map(x=>x.url)).size,4);
 assert.ok(u[0].url.startsWith('https://image.pollinations.ai/prompt/'));
 assert.ok(u[0].url.includes('image='+encodeURIComponent('https://x.supabase.co/p.jpg')));
 assert.ok(!u[0].alt.includes('image='));
 assert.ok(decodeURIComponent(u[0].url).includes('kedi figürü'));
});
test('değişiklik notu isteme eklenir',()=>{
 const u=A.concepts('kedi','',  'kulakları daha büyük');
 assert.ok(decodeURIComponent(u[0].url).includes('kulakları daha büyük'));
 assert.ok(!u[0].url.includes('image='));
});
test('kota hatası tanınır',()=>{
 assert.ok(A.quota('You have exceeded your GPU quota (60s requested vs. 30s left).'));
 assert.ok(A.quota('ZeroGPU quota exceeded'));
 assert.ok(!A.quota('Network error'));
});
test('HF anahtarı biçimi',()=>{
 assert.ok(A.token('hf_abcdefghijklmnopqrstuvwxyz12'));
 assert.ok(!A.token('abc'));assert.ok(!A.token('hf_kisa'));
});
