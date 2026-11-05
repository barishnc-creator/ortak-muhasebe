// Çalıştır: node --test tests/
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../plan.js');

test('saat metni dakikaya çevrilir, bozuk değer varsayılana düşer',()=>{
 assert.equal(P.hm('09:30'),570);
 assert.equal(P.hm('00:00'),0);
 assert.equal(P.hm(''),540);
 assert.equal(P.hm('25:00'),540);
});

test('dakika saat metnine çevrilir, gün taşarsa +1 eklenir',()=>{
 assert.equal(P.fmt(570),'09:30');
 assert.equal(P.fmt(1440+75),'01:15 (+1)');
});

test('süre okunur yazılır',()=>{
 assert.equal(P.dur(45),'45 dk');
 assert.equal(P.dur(120),'2 sa');
 assert.equal(P.dur(150),'2 sa 30 dk');
});

test('gün planı sırayla ardışık zaman aralıkları üretir',()=>{
 const r=P.schedule([{id:'a',mins:90},{id:'b',mins:30},{id:'c',mins:0}],'09:00');
 assert.deepEqual(r.map(x=>[x.id,x.start,x.end]),[['a',540,630],['b',630,660],['c',660,660]]);
});

test('sıra yukarı ve aşağı taşınır, uçlarda değişmez',()=>{
 assert.deepEqual(P.move(['a','b','c'],'b',-1),['b','a','c']);
 assert.deepEqual(P.move(['a','b','c'],'b',1),['a','c','b']);
 assert.deepEqual(P.move(['a','b','c'],'a',-1),['a','b','c']);
 assert.deepEqual(P.move(['a','b','c'],'c',1),['a','b','c']);
 assert.deepEqual(P.move(['a','b'],'x',1),['a','b']);
});

test('günün sırası pn alanına göre, eşitse eklenme sırasına göre',()=>{
 const os=[{id:'a',pd:'2026-11-05',pn:2},{id:'b',pd:'2026-11-05',pn:1},{id:'c',pd:'2026-11-06',pn:0},{id:'d',pd:'2026-11-05'}];
 assert.deepEqual(P.day(os,'2026-11-05').map(o=>o.id),['b','a','d']);
});

test('yeni eklenen günün sonuna gider',()=>{
 const os=[{id:'a',pd:'2026-11-05',pn:0},{id:'b',pd:'2026-11-05',pn:4}];
 assert.equal(P.next(os,'2026-11-05'),5);
 assert.equal(P.next(os,'2026-11-07'),0);
});
