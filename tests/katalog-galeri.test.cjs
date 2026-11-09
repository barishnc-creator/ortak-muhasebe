// Çalıştır: node --test tests/katalog-galeri.test.cjs
// catalog.html'deki normalize() ve mediaHtml() fonksiyonlarını DOM olmadan çalıştırır.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../catalog.html'),'utf8');
function extract(name){const start=html.indexOf(`function ${name}(`);assert.ok(start>=0,name);let i=html.indexOf('{',start),d=0;for(;i<html.length;i++){if(html[i]==='{')d++;else if(html[i]==='}'&&--d===0)break}return html.slice(start,i+1)}
const ctx={GALERI:require('../galeri.js'),esc:s=>String(s),Number,String,JSON,Math,Array,Error};
vm.createContext(ctx);
vm.runInContext(['niceName','normalize','mediaHtml'].map(extract).join('\n'),ctx);
const norm=p=>ctx.normalize({products:[{id:1,name:'Vazo',price:10,...p}]}).products[0];
const count=(s,re)=>(s.match(re)||[]).length;

test('sunucu images listesi gönderirse hepsi sırayla gelir, kapak ilk fotoğraftır',()=>{
 const p=norm({image:'a',images:['a','b','c']});
 assert.deepEqual([...p.images],['a','b','c']);assert.equal(p.image,'a');
});

test('eski sunucu yanıtı (yalnız image) tek fotoğraf olarak çalışır',()=>{
 const p=norm({image:'a'});assert.deepEqual([...p.images],['a']);
 assert.deepEqual([...norm({}).images],[]);
});

test('çoklu fotoğraf: her fotoğraf bir kaydırma sayfası ve bir nokta',()=>{
 const h=ctx.mediaHtml(norm({image:'a',images:['a','b','c'],video:'v.mp4'}));
 assert.equal(count(h,/class="slide"/g),4);
 assert.equal(count(h,/class="pip"/g),3);
 assert.match(h,/Video<\/button>/);
 assert.match(h,/class="nav prev"/);
});

test('tek fotoğraf + video eski görünümü korur, tek fotoğrafta nokta yok',()=>{
 const h=ctx.mediaHtml(norm({image:'a',video:'v.mp4'}));
 assert.match(h,/>Fotoğraf<\/button>/);assert.equal(count(h,/class="pip"/g),0);
 const one=ctx.mediaHtml(norm({image:'a'}));
 assert.equal(count(one,/class="slide"/g),1);assert.doesNotMatch(one,/dots|nav/);
});
