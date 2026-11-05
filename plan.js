/* Üretim planlaması: saf hesaplar (DOM yok). Tarayıcıda window.PLAN, Node'da require ile kullanılır. */
(function(root){
 const pad=n=>String(n).padStart(2,'0');
 const DEF=540; // 09:00
 // "HH:MM" -> gün başından dakika
 const hm=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(String(s||''));if(!m)return DEF;const h=+m[1],mi=+m[2];return h<24&&mi<60?h*60+mi:DEF};
 const fmt=m=>{const d=Math.floor(m/1440),r=m-d*1440;return pad(Math.floor(r/60))+':'+pad(r%60)+(d?' (+'+d+')':'')};
 const dur=m=>{const h=Math.floor(m/60),r=m%60;return h?h+' sa'+(r?' '+r+' dk':''):r+' dk'};
 // Sıralı işlere art arda başlangıç/bitiş dakikası verir.
 const schedule=(items,start)=>{let t=hm(start);return items.map(x=>{const s=t;t+=Math.max(0,Math.round(x.mins||0));return {id:x.id,start:s,end:t}})};
 const move=(ids,id,dir)=>{const a=ids.slice(),i=a.indexOf(id),j=i+dir;if(i<0||j<0||j>=a.length)return a;[a[i],a[j]]=[a[j],a[i]];return a};
 const pnv=o=>Number.isFinite(+o.pn)&&o.pn!==''&&o.pn!=null?+o.pn:Infinity;
 const day=(os,d)=>os.map((o,i)=>[o,i]).filter(([o])=>o.pd===d).sort((x,y)=>pnv(x[0])-pnv(y[0])||x[1]-y[1]).map(x=>x[0]);
 const next=(os,d)=>os.filter(o=>o.pd===d&&Number.isFinite(pnv(o))).reduce((m,o)=>Math.max(m,pnv(o)+1),0);
 const P={hm,fmt,dur,schedule,move,day,next};
 if(typeof module!=='undefined'&&module.exports)module.exports=P;else root.PLAN=P;
})(this);
