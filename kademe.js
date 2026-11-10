/* Toptan indirim kademesi ilerlemesi: saf hesap (DOM yok). Tarayıcıda window.KADEME, Node'da require ile kullanılır. */
(function(root){
 // q: sepetteki toplam adet. Dönen ratio: mevcut kademeden bir sonrakine yüzde kaç gidildi (0-100).
 const progress=(q,tiers)=>{
  if(!tiers||!tiers.length)return null;
  const s=tiers.slice().sort((a,b)=>a.min-b.min),cur=s.filter(t=>t.min<=q).pop(),next=s.find(t=>t.min>q)||null,base=cur?cur.min:0;
  return {pct:cur?cur.pct:0,next,left:next?next.min-q:0,ratio:next?Math.min(100,Math.round((q-base)/(next.min-base)*100)):100};
 };
 const K={progress};
 if(typeof module!=='undefined'&&module.exports)module.exports=K;else root.KADEME=K;
})(this);
