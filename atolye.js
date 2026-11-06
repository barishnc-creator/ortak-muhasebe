/* 3D Atölye: saf hesaplar (DOM yok). Tarayıcıda window.ATOLYE, Node'da require ile kullanılır. */
(function(root){
 const POL='https://image.pollinations.ai/prompt/';
 const STYLE='single 3D printable figurine, one solid object, full view, centered, plain white background, soft studio light, matte grey PLA look, no text';
 // Z-yukarı kutuyu hedef yüksekliğe ölçekler; tabanı z=0'a oturtur, x/y'de ortalar.
 const fit=(b,target)=>{
  const h=b.max[2]-b.min[2];
  if(!(target>0))throw new Error('Hedef yükseklik geçersiz.');
  if(!(h>0))throw new Error('Modelin yüksekliği yok.');
  const s=target/h,c=i=>-(b.min[i]+b.max[i])/2*s;
  return {s,tx:c(0),ty:c(1),tz:-b.min[2]*s,size:[0,1,2].map(i=>Math.round((b.max[i]-b.min[i])*s*10)/10)};
 };
 const mm=v=>{const x=parseFloat(String(v??'').replace(',','.'));return Number.isFinite(x)&&x>=5&&x<=300?x:null};
 const TR={ç:'c',ğ:'g',ı:'i',ö:'o',ş:'s',ü:'u'};
 const stlName=(d,h)=>(String(d||'').toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g,c=>TR[c]).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'model')+'-'+h+'mm.stl';
 // 4 konsept: url fotoğrafı referans alır (kontext), alt yalnız yazıyla üretir (yedek).
 const concepts=(desc,photo,note)=>{
  const p=encodeURIComponent([desc,note,STYLE].filter(Boolean).join(', '));
  return [11,23,37,51].map(seed=>{const q=`?width=768&height=768&nologo=true&seed=${seed}`,alt=`${POL}${p}${q}&model=flux`;
   return {seed,alt,url:photo?`${POL}${p}${q}&model=kontext&image=${encodeURIComponent(photo)}`:alt}});
 };
 const quota=m=>/quota|zerogpu|exceeded|gpu task aborted/i.test(String(m||''));
 const token=t=>/^hf_[A-Za-z0-9]{20,}$/.test(String(t||'').trim());
 const A={fit,mm,stlName,concepts,quota,token};
 if(typeof module!=='undefined'&&module.exports)module.exports=A;else root.ATOLYE=A;
})(this);
