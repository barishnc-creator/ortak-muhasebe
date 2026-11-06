/* 3D Atölye arayüzü: fotoğraf + açıklama → konsept görseller → onay → Hunyuan3D-2.1 (ücretsiz HF alanı) → ölçekli STL.
   index.html'deki yardımcıları ($, E, S, sb, head, btn, toast, upd, render...) kullanır. Saf hesaplar atolye.js'de. */
const AT={step:'giris',desc:'',note:'',file:null,photo:'',list:[],pick:null,busy:'',err:'',mm:80,v:null};
const AT_SPACE='tencent/Hunyuan3D-2.1',AT_KONTEXT='black-forest-labs/FLUX.1-Kontext-Dev',AT_STUDIO='https://3d.hunyuan.tencent.com/';
const atTok=()=>{try{return localStorage.getItem('hf_token')||''}catch(_){return ''}};
// gradio istemcisi çerezli (credentials:include) istek atıyor; HF alanları buna CORS izni vermiyor → çerezsiz gönder.
let atFetchFix=false;
const atGradio=()=>{if(!atFetchFix){atFetchFix=true;const of=window.fetch.bind(window);window.fetch=(u,o)=>/\.hf\.space|huggingface\.co/.test(String(u?.url||u))?of(u,{...o,credentials:'omit'}):of(u,o)}
 return import('https://cdn.jsdelivr.net/npm/@gradio/client@1.19.1/dist/browser.js')};
// istemcinin handle_file'ı tarayıcıda yalnız File kabul ediyor (düz Blob'da Buffer hatası).
const atAsFile=b=>b instanceof File?b:new File([b],'gorsel.'+((b.type||'image/png').split('/')[1]||'png'),{type:b.type||'image/png'});
const atLib=()=>Promise.all([import('three'),import('three/addons/loaders/GLTFLoader.js'),import('three/addons/loaders/STLLoader.js'),import('three/addons/exporters/STLExporter.js'),import('three/addons/controls/OrbitControls.js')]);
const atSet=o=>{Object.assign(AT,o);if(tab==='atolye')render()};

function atView(){
 const stepCls=k=>AT.step===k?'':' style="opacity:.55"';
 const keyBtn=btn('atKey',atTok()?'HF anahtarı ✓':'HF anahtarı ekle',{cls:atTok()?'s':'p'});
 let h=head('3D Atölye','Fotoğraf ve açıklamadan baskıya hazır STL. Ücretsiz Hugging Face alanıyla çalışır.',keyBtn);
 if(AT.busy)h+=`<div class="card"><b>${E(AT.busy)}</b><div class="hint" style="color:var(--faint);margin-top:6px">Ücretsiz alan yoğunsa sırada beklenebilir; sayfayı kapatmayın.</div></div>`;
 if(AT.err)h+=`<div class="card"><b class="bad">${E(AT.err)}</b><p class="mu" style="margin:8px 0 12px">Son adımı Hunyuan 3D Studio'da ücretsiz kredinle yapabilirsin: görseli indir, Studio'da 3D'ye çevir, inen GLB/STL dosyasını aşağıdan yükle.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap">${AT.pick!=null?btn('atSaveImg','Görseli indir',{cls:'s sm'}):''}<a class="btn s sm" href="${AT_STUDIO}" target="_blank" rel="noopener">Hunyuan 3D Studio'yu aç</a>${btn('atMake','Tekrar dene',{cls:'s sm'})}</div></div>`;
 // 1) giriş
 h+=`<div class="card"${stepCls('giris')}><h3 style="margin:0 0 12px">1. Fotoğraf ve açıklama</h3>
  <div class="fl"><label for="at_photo">Fotoğraf</label><input id="at_photo" type="file" accept="image/*" data-change="atFile">${AT.file?`<div class="hint">${E(AT.file.name)}</div>`:''}</div>
  <div class="fl"><label for="at_desc">Açıklama</label><textarea id="at_desc" placeholder="Örn. oturan kedi figürü, kuyruğu önde, sade hatlar" oninput="AT.desc=this.value">${E(AT.desc)}</textarea></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">${btn('atGen','Konsept üret',{cls:'p'})}${btn('atDirect','Fotoğrafı doğrudan 3D yap',{cls:'s'})}
  <label class="btn s" style="cursor:pointer">Hazır GLB/STL yükle<input type="file" accept=".glb,.stl" data-change="atModel" hidden></label></div></div>`;
 // 2) konsept
 if(AT.list.length)h+=`<div class="card"${stepCls('konsept')}><h3 style="margin:0 0 12px">2. Konsept seç</h3>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${AT.list.map((c,i)=>`<button data-act="atPick" data-id="${i}"${c.src?'':' disabled'} style="padding:0;display:flex;align-items:center;justify-content:center;border-radius:14px;overflow:hidden;border:2px solid ${AT.pick===i?'var(--teal)':'var(--line)'};background:#fff;aspect-ratio:1">${c.src?`<img src="${E(c.src)}" alt="Konsept ${i+1}" crossorigin="anonymous" style="width:100%;height:100%;object-fit:cover;display:block">`:`<span style="color:#667;font-size:13px;padding:8px">${c.fail?'Üretilemedi':i===AT.list.findIndex(x=>!x.src&&!x.fail)?'Üretiliyor…':'Sırada'}</span>`}</button>`).join('')}</div>
  <div class="hint" style="color:var(--faint);font-size:12.5px;margin-top:8px">${AT.file?'Görseller fotoğrafından Hugging Face (FLUX Kontext) ile üretilir, her biri yaklaşık 30 sn.':'Fotoğraf olmadan ücretsiz servis 45 sn\'de 1 görsel veriyor.'} Hazır olanı hemen seçebilirsin; bir konsept seçip not yazarsan sadece o düzeltilir.</div>
  <div class="fl" style="margin-top:12px"><label for="at_note">Değişiklik notu <i>İsteğe bağlı</i></label><input id="at_note" value="${E(AT.note)}" placeholder="Örn. kulakları daha büyük olsun" oninput="AT.note=this.value"></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">${btn('atGen','Yeniden üret',{cls:'s'})}${AT.pick!=null&&AT.file?btn('atFix','Seçileni nota göre düzelt',{cls:'s'}):''}${btn('atMake','Onayla ve 3D yap',{cls:'p',extra:AT.pick==null?'disabled':''})}</div></div>`;
 // 3) model
 if(AT.v)h+=`<div class="card"><h3 style="margin:0 0 12px">3. Ölçekle ve indir</h3>
  <div id="atView" style="height:340px;border-radius:14px;overflow:hidden;background:var(--bg);touch-action:none"></div>
  <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;margin-top:12px"><div class="fl" style="margin:0;width:150px"><label for="at_mm">Yükseklik (mm)</label><input id="at_mm" inputmode="decimal" value="${E(AT.mm)}" data-change="atMm"></div>
  <span class="mu" style="padding-bottom:10px">${AT.v.size?`${AT.v.size.join(' × ')} mm`:''}</span><span style="flex:1"></span>${btn('atDl','Kaydet ve STL indir',{cls:'p'})}</div></div>`;
 // geçmiş
 const L=(S.atolye||[]).slice().sort((a,b)=>b.at-a.at);
 h+=`<div class="card"><h3 style="margin:0 0 12px">Geçmiş</h3>${L.length?L.map(x=>`<div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--line)">${x.img?`<img src="${E(x.img)}" alt="" style="width:52px;height:52px;border-radius:10px;object-fit:cover;background:#fff">`:''}
  <div style="flex:1;min-width:0"><b>${E(x.desc||'Model')}</b><div class="mu" style="font-size:13px">${E(x.mm)} mm · ${new Date(x.at).toLocaleDateString('tr-TR')}${x.by?' · '+E(x.by):''}</div></div>
  ${x.stl?`<a class="btn s sm" href="${E(x.stl)}" download>STL</a>`:''}${ibtn('atDel',x.id,'trash','Sil')}</div>`).join(''):empty('Henüz model yok','İlk modelin burada listelenir.')}</div>`;
 return h;
}

// Yeniden çizimde 3D görünümü yerine tak.
function atMount(){const el=document.getElementById('atView');if(el&&AT.v&&AT.v.r.domElement.parentNode!==el){el.appendChild(AT.v.r.domElement);atResize()}}
function atResize(){const v=AT.v,el=document.getElementById('atView');if(!v||!el)return;const w=el.clientWidth||600,h=el.clientHeight||340;v.r.setSize(w,h);v.cam.aspect=w/h;v.cam.updateProjectionMatrix()}
addEventListener('resize',atResize);

async function atUpload(blob,name,type){
 const path=`${workspaceId}/atolye-${AT.id}/${Date.now()}-${name}`;
 const {error}=await sb.storage.from('catalog-media').upload(path,blob,{upsert:false,contentType:type});if(error)throw error;
 return sb.storage.from('catalog-media').getPublicUrl(path).data.publicUrl;
}

async function atGen(){
 const A=window.ATOLYE;AT.desc=(document.getElementById('at_desc')||{}).value??AT.desc;
 if(!AT.desc.trim()&&!AT.file)return toast('Bir fotoğraf seçin ya da açıklama yazın.');
 AT.id=AT.id||uid();const gen=AT.gen=(AT.gen||0)+1;
 if(AT.file){ // fotoğraf referanslı: FLUX Kontext (HF), sırayla
  if(!A.token(atTok()))return atKey();
  const list=A.kontextPrompts(AT.desc.trim(),AT.note.trim()).map(prompt=>({prompt,src:''}));
  atSet({list,pick:null,step:'konsept',busy:'',err:''});
  for(const c of list){if(AT.gen!==gen)return;await atKontext(c,AT.file,gen)}
  return;
 }
 // fotoğrafsız: Pollinations flux (anonim, 45 sn'de 1)
 const r='&r='+Date.now(),list=A.concepts(AT.desc.trim(),'',AT.note.trim()).map(c=>({url:c.alt+r,src:''}));
 atSet({list,pick:null,step:'konsept',busy:'',err:''});
 for(const c of list){
  const wait=atLast+AT_GAP-Date.now();if(wait>0)await new Promise(f=>setTimeout(f,wait));
  if(AT.gen!==gen)return;atLast=Date.now();
  if(await atLoad(c.url))c.src=c.url;else c.fail=true;
  if(AT.gen===gen)atSet({});
 }
}
// Tek görsel üret: Kontext /infer(görsel, istem, seed, rastgele, guidance, adım) → [görsel, seed]
async function atKontext(c,base,gen){
 try{
  const {Client,handle_file}=await atGradio();
  AT.kc=AT.kc||await Client.connect(AT_KONTEXT,{hf_token:atTok()});
  const r=await AT.kc.predict('/infer',[handle_file(atAsFile(base)),c.prompt,0,true,2.5,20]);
  const f=r.data?.[0];c.src=f?.url||'';if(!c.src)throw new Error('Görsel gelmedi.');
 }catch(e){console.error(e);c.fail=true;AT.kc=null;const m=String(e?.message||e);
  if(AT.gen===gen)AT.err=window.ATOLYE.quota(m)?'Bugünkü ücretsiz Hugging Face GPU kotası doldu.':'Konsept üretilemedi: '+m}
 if(AT.gen===gen)atSet({});
}
async function atFix(){
 const note=((document.getElementById('at_note')||{}).value??AT.note).trim();if(!note)return toast('Önce ne değişsin, yazın.');
 if(AT.pick==null||!AT.list[AT.pick]?.src)return toast('Önce bir konsept seçin.');
 const base=await atImageBlob(),c={prompt:window.ATOLYE.kontextEdit(note),src:''},gen=AT.gen;
 AT.list.push(c);atSet({err:''});await atKontext(c,base,gen);
 if(c.src)atSet({pick:AT.list.indexOf(c),note:''});
}
let atLast=0;const AT_GAP=46000;
const atLoad=u=>new Promise(f=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>f(true);i.onerror=()=>f(false);i.src=u});

async function atImageBlob(){
 if(AT.pick==='foto'){if(!AT.file)throw new Error('Fotoğraf seçilmedi.');return AT.file}
 const img=document.querySelectorAll('#v [data-act="atPick"] img')[AT.pick];const src=img?.currentSrc||AT.list[AT.pick].src;
 const r=await fetch(src);if(!r.ok)throw new Error('Görsel alınamadı.');return await r.blob();
}

async function atMake(){
 const A=window.ATOLYE,tok=atTok();
 if(!A.token(tok))return atKey(true);
 if(AT.pick==null)return toast('Önce bir konsept seçin.');
 atSet({busy:'3D model üretiliyor (1–3 dk)…',err:''});
 try{
  const blob=await atImageBlob();AT.blob=blob;
  const {Client,handle_file}=await atGradio();
  const c=await Client.connect(AT_SPACE,{hf_token:tok});
  // Girdi sırası (durum bileşeni hariç): görsel, ön/arka/sol/sağ, adım, guidance, seed, octree, arka plan sil, chunk, rastgele seed
  const r=await c.predict('/shape_generation',[handle_file(atAsFile(blob)),null,null,null,null,30,5,1234,256,true,8000,true]);
  const f=r.data?.[0],url=f?.url||f?.path&&c.config.root+'/file='+f.path;if(!url)throw new Error('Model dosyası gelmedi.');
  const g=await fetch(url);if(!g.ok)throw new Error('Model dosyası indirilemedi.');
  await atShow(await g.arrayBuffer(),'glb');
  atSet({busy:'',step:'model'});
 }catch(e){console.error(e);const m=String(e?.message||e);
  atSet({busy:'',err:A.quota(m)?'Bugünkü ücretsiz GPU kotası doldu.':'3D üretim başarısız: '+m})}
}

async function atShow(buf,kind){
 const [T,{GLTFLoader},{STLLoader},,{OrbitControls}]=await atLib();
 let obj;
 if(kind==='stl'){const geo=new STLLoader().parse(buf);obj=new T.Mesh(geo)}           // STL zaten Z-yukarı
 else{const g=await new GLTFLoader().parseAsync(buf,'');obj=g.scene;obj.rotation.x=Math.PI/2} // GLB Y-yukarı → Z-yukarı
 const mat=new T.MeshStandardMaterial({color:0xc9d3d6,roughness:.65,metalness:.05});
 obj.traverse(o=>{if(o.isMesh)o.material=mat});
 const inner=new T.Group();inner.add(obj);const root=new T.Group();root.add(inner);
 if(AT.v){AT.v.scene.remove(AT.v.root)}else{
  const r=new T.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(2,devicePixelRatio));
  const scene=new T.Scene();scene.add(new T.HemisphereLight(0xffffff,0x334455,1.6));const d=new T.DirectionalLight(0xffffff,1.4);d.position.set(1,-1.5,2);scene.add(d);
  const cam=new T.PerspectiveCamera(35,1.6,1,5000);cam.up.set(0,0,1);
  const ctl=new OrbitControls(cam,r.domElement);ctl.enableDamping=true;
  AT.v={r,scene,cam,ctl,T};const loop=()=>{requestAnimationFrame(loop);ctl.update();r.render(scene,cam)};loop();
 }
 AT.v.root=root;AT.v.inner=inner;AT.v.scene.add(root);atScale(AT.mm);
}

function atScale(mm){
 const v=AT.v,T=v.T;v.root.scale.setScalar(1);v.root.position.set(0,0,0);v.root.updateMatrixWorld(true);
 const b=new T.Box3().setFromObject(v.inner),f=window.ATOLYE.fit({min:b.min.toArray(),max:b.max.toArray()},mm);
 v.root.scale.setScalar(f.s);v.root.position.set(f.tx,f.ty,f.tz);v.root.updateMatrixWorld(true);v.size=f.size;
 const R=Math.max(...f.size);v.cam.position.set(R*1.4,-R*1.8,R*1.2);v.ctl.target.set(0,0,mm/2);v.ctl.update();
}

async function atDl(){
 const A=window.ATOLYE,mm=A.mm((document.getElementById('at_mm')||{}).value??AT.mm);if(!mm)return toast('Yükseklik 5–300 mm arası olmalı.');
 if(mm!==AT.mm){AT.mm=mm;atScale(mm)}
 const [,,,{STLExporter}]=await atLib();
 const blob=new Blob([new STLExporter().parse(AT.v.root,{binary:true})],{type:'model/stl'}),name=A.stlName(AT.desc,mm);
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
 AT.id=AT.id||uid();let stl='';
 try{stl=await atUpload(blob,name,'application/octet-stream')}catch(e){console.error(e);toast('STL indirildi ama buluta kaydedilemedi: '+(e?.message||e))}
 let img='';if(AT.blob)try{img=await atUpload(AT.blob,'konsept.'+((AT.blob.type||'image/png').split('/')[1]||'png'),AT.blob.type||'image/png')}catch(e){console.error(e)}
 S.atolye=S.atolye||[];S.atolye.push({id:AT.id,desc:AT.desc.trim(),mm,img,stl,at:Date.now(),by:meName()||''});
 logAct?.('3D model kaydetti: '+(AT.desc.trim()||'Model'));AT.id=null;upd();toast('STL indirildi ve geçmişe kaydedildi.');
}

function atKey(thenMake){
 openDrawer({title:'Hugging Face anahtarı',sub:'Ücretsiz hesap aç → Settings → Access Tokens → "Read" anahtarı oluştur. Anahtar yalnız bu cihazda saklanır.',submit:'Kaydet',
  body:fl('tok','Anahtar',{ph:'hf_…',value:atTok(),attrs:'autocomplete="off" spellcheck="false"'})+`<p class="mu" style="font-size:13px"><a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener">huggingface.co/settings/tokens</a></p>`,
  onSubmit(f){const t=String(f.tok||'').trim();if(!window.ATOLYE.token(t)){toast('Anahtar "hf_" ile başlamalı.');return false}
   try{localStorage.setItem('hf_token',t)}catch(_){toast('Bu tarayıcı anahtarı saklayamadı.');return false}
   toast('Anahtar kaydedildi.');setTimeout(()=>{render();if(thenMake===true)atMake()});}});
}

Object.assign(ACT,{
 atKey:()=>atKey(),atGen,atMake,atDl,atFix,
 atDirect(){if(!AT.file)return toast('Önce bir fotoğraf seçin.');AT.pick='foto';atMake()},
 atPick:id=>atSet({pick:+id}),
 atSaveImg:async()=>{try{const b=AT.blob||await atImageBlob(),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='konsept.png';a.click()}catch(e){toast('Görsel indirilemedi.')}},
 atDel:id=>{if(!confirm('Bu model geçmişten silinsin mi?'))return;S.atolye=(S.atolye||[]).filter(x=>x.id!==id);upd()},
});
// index.html'deki change dinleyicisinden çağrılır.
function atChange(k,el){
 if(k==='atFile'){AT.file=el.files[0]||null;AT.photo='';AT.blob=null;AT.id=null}
 else if(k==='atMm'){const m=window.ATOLYE.mm(el.value);if(!m){toast('Yükseklik 5–300 mm arası olmalı.');el.value=AT.mm;return}AT.mm=m;if(AT.v){atScale(m);render()}}
 else if(k==='atModel'){const f=el.files[0];if(!f)return;const kind=/\.stl$/i.test(f.name)?'stl':'glb';
  f.arrayBuffer().then(b=>atShow(b,kind)).then(()=>{AT.desc=AT.desc||f.name.replace(/\.\w+$/,'');atSet({step:'model',err:''})}).catch(e=>{console.error(e);toast('Dosya açılamadı: '+(e?.message||e))})}
}
