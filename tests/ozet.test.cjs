// Çalıştır: node --test tests/ozet.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const O=require('../ozet.js');

test('haftanın pazartesisi bulunur',()=>{
 assert.equal(O.monday('2026-11-10'),'2026-11-09'); // salı
 assert.equal(O.monday('2026-11-09'),'2026-11-09'); // pazartesi
 assert.equal(O.monday('2026-11-15'),'2026-11-09'); // pazar
 assert.equal(O.monday('2026-01-01'),'2025-12-29'); // yıl dönümü
});

test('son haftaların geliri kuruş olarak toplanır, gider sayılmaz',()=>{
 const tx=[
  {t:'gelir',d:'2026-11-10',amt:'100.10'},{t:'gelir',d:'2026-11-09',amt:0.2},
  {t:'gider',d:'2026-11-10',amt:999},
  {t:'gelir',d:'2026-11-08',amt:50},     // önceki hafta
  {t:'gelir',d:'2026-09-01',amt:7},      // pencere dışı
  {t:'gelir',d:'',amt:5},{t:'gelir',d:'2026-11-11',amt:'abc'}
 ];
 const w=O.weeks(tx,'2026-11-10',3);
 assert.deepEqual(w.map(x=>x.start),['2026-10-26','2026-11-02','2026-11-09']);
 assert.deepEqual(w.map(x=>x.kurus),[0,5000,10030]);
});

test('geçen aya oran yüzde olarak yuvarlanır, geçen ay boşsa null',()=>{
 assert.equal(O.ratio(8200,10000),82);
 assert.equal(O.ratio(15000,10000),150);
 assert.equal(O.ratio(1,3),33);
 assert.equal(O.ratio(500,0),null);
});
