/* Özet ekranı grafikleri: saf hesaplar (DOM yok). Tarayıcıda window.OZET, Node'da require ile kullanılır. Tutarlar kuruş (tam sayı). */
(function(root){
 const iso=t=>new Date(t).toISOString().slice(0,10);
 const ms=d=>Date.parse(d+'T00:00:00Z');
 // Verilen günün (YYYY-MM-DD) haftasının pazartesisi
 const monday=d=>{const t=ms(d);return iso(t-((new Date(t).getUTCDay()+6)%7)*864e5)};
 const kurus=v=>{const n=Math.round(Number(v)*100);return Number.isFinite(n)?n:0};
 // Bugün dahil son n haftanın gelir toplamı, eskiden yeniye
 const weeks=(tx,today,n=8)=>{
  const last=ms(monday(today)),out=[];
  for(let i=n-1;i>=0;i--)out.push({start:iso(last-i*7*864e5),kurus:0});
  (tx||[]).forEach(x=>{if(x.t!=='gelir'||!/^\d{4}-\d{2}-\d{2}/.test(x.d||''))return;const w=out.find(b=>b.start===monday(String(x.d).slice(0,10)));if(w)w.kurus+=kurus(x.amt)});
  return out;
 };
 const ratio=(cur,prev)=>prev>0?Math.round(cur/prev*100):null;
 const O={monday,weeks,ratio};
 if(typeof module!=='undefined'&&module.exports)module.exports=O;else root.OZET=O;
})(this);
