// Çalıştır: node --test tests/galeri.test.cjs
const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../galeri.js');

test('eski ürün: yalnız tek fotoğraf alanı varsa liste o fotoğraftan oluşur',()=>{
 assert.deepEqual(G.list(undefined,'a.jpg'),['a.jpg']);
 assert.deepEqual(G.list(undefined,''),[]);
 assert.deepEqual(G.list(null,undefined),[]);
});

test('liste kapakla başlar, tekrar ve boş değer atılır',()=>{
 assert.deepEqual(G.list(['a','b','b','',null,3],'a'),['a','b']);
 assert.deepEqual(G.list(['a','b'],'b'),['b','a']);
});

test('eski sürüm kapağı değiştirdiyse yeni kapak başa eklenir',()=>{
 assert.deepEqual(G.list(['a','b'],'c'),['c','a','b']);
});

test('kapak yapma ve kaldırma',()=>{
 assert.deepEqual(G.toFront(['a','b','c'],'c'),['c','a','b']);
 assert.deepEqual(G.toFront(['a','b'],'x'),['a','b']);
 assert.deepEqual(G.without(['a','b','c'],'b'),['a','c']);
});

test('ürüne yazılan alanlar: kapak ilk fotoğraf, en fazla 10 fotoğraf',()=>{
 assert.deepEqual(G.fields(['a','b']),{catalogImages:['a','b'],catalogImage:'a'});
 assert.deepEqual(G.fields([]),{catalogImages:[],catalogImage:''});
 assert.equal(G.fields(Array.from({length:12},(_,i)=>'u'+i)).catalogImages.length,10);
});
