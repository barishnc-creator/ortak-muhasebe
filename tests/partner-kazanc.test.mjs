// Partner satış özeti: katalog fiyatıyla satış ve partnerin kazancı (kuruş, tam sayı).
// Çalıştır: node --test tests/
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const a=html.indexOf('const partnerOrders='),b=html.indexOf('function partnerMonths');
assert.ok(a>0&&b>a,'partnerSales kodu bulunamadı');
const src=html.slice(a,b);

function load(S){
 const N=v=>{const x=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(x)?x:0};
 const lower=s=>String(s||'').trim().toLocaleLowerCase('tr-TR'),hasV=v=>v!=null&&v!=='';
 const kSold=o=>N(o.sold),kRet=o=>N(o.ret),kAt=o=>o.kons?Math.max(0,N(o.qty)-kSold(o)-kRet(o)):0;
 const oq=o=>o.kons?kSold(o):N(o.qty),otot=o=>oq(o)*N(o.price);
 const prod=i=>S.prod.find(p=>p.id===i),pname=id=>prod(id)?.n||'Silinmiş ürün',td=()=>'2026-11-05';
 const pprices=()=>S.pprices,ppGet=(paId,pid)=>pprices().find(x=>x.partner===paId&&x.prod===pid);
 return new Function('S','N','lower','hasV','kAt','oq','otot','prod','pname','td','pprices','ppGet',src+';return partnerSales')(S,N,lower,hasV,kAt,oq,otot,prod,pname,td,pprices,ppGet);
}
const pa={id:'pa1',name:'Mavi Dükkan'};
const run=(ord,{prod=[{id:'p1',n:'Vazo',price:120}],pprices=[]}={},per)=>load({ord,prod,pprices})(pa,per);

test('normal sipariş: katalog fiyatı ürünün liste fiyatıdır',()=>{
 const {tot}=run([{partner:'pa1',prod:'p1',qty:3,price:80,date:'2026-10-02'}]);
 assert.equal(tot.catK,36000);assert.equal(tot.earnK,12000);
});
test('partner kataloğu siparişi: son müşterinin gördüğü fiyat (sp) kullanılır',()=>{
 const {tot}=run([{partner:'pa1',source:'partner',prod:'p1',qty:2,price:100,sp:150,date:'2026-10-02'}]);
 assert.equal(tot.catK,30000);assert.equal(tot.earnK,10000);
});
test('partnerin satış fiyatı kayıtlıysa liste fiyatı yerine o kullanılır',()=>{
 const {tot}=run([{cust:'mavi dükkan',prod:'p1',qty:1,price:90,date:'2026-10-02'}],{pprices:[{partner:'pa1',prod:'p1',price:90,sale:130}]});
 assert.equal(tot.catK,13000);assert.equal(tot.earnK,4000);
});
test('konsinye: yalnızca satılan adet sayılır',()=>{
 const {tot}=run([{partner:'pa1',prod:'p1',kons:true,qty:10,price:50,date:'2026-09-01',kh:[{d:'2026-10-03',sold:4}]}],{prod:[{id:'p1',n:'Vazo',price:75}]});
 assert.equal(tot.catK,30000);assert.equal(tot.earnK,10000);
});
test('kuruş tam sayıdır, float hatası yok',()=>{
 const {tot}=run([{partner:'pa1',prod:'p1',qty:3,price:0.1,date:'2026-10-02'}],{prod:[{id:'p1',n:'Kalem',price:0.3}]});
 assert.equal(tot.catK,90);assert.equal(tot.earnK,60);assert.ok(Number.isInteger(tot.earnK));
});
test('dönem filtresi uygulanır; zararına satış negatif kazanç olur',()=>{
 const ord=[{partner:'pa1',prod:'p1',qty:1,price:80,date:'2026-09-02'},{partner:'pa1',prod:'p1',qty:1,price:130,date:'2026-10-02'}];
 assert.equal(run(ord,{},'2026-09').tot.earnK,4000);
 assert.equal(run(ord,{},'2026-10').tot.earnK,-1000);
 assert.equal(run(ord).tot.catK,24000);
});
