/* Ürün fotoğraf listesi: saf hesaplar (DOM yok). Tarayıcıda window.GALERI, Node'da require ile kullanılır.
   Kapak her zaman listenin ilk fotoğrafıdır ve eski tek fotoğraf alanında (catalogImage / image) da durur. */
(function(root){
 const MAX=10;
 // Liste + kapak alanından sıralı, tekrarsız fotoğraf listesi. Kapak listede yoksa (eski sürüm yalnız kapağı değiştirdiyse) başa eklenir.
 const list=(arr,cover)=>{const a=(Array.isArray(arr)?arr:[]).filter(u=>typeof u==='string'&&u),c=typeof cover==='string'?cover:'';return [...new Set(c?[c,...a]:a)]};
 const toFront=(a,u)=>a.includes(u)?[u,...a.filter(x=>x!==u)]:a.slice();
 const without=(a,u)=>a.filter(x=>x!==u);
 // Ürüne yazılacak alanlar: yeni liste ve geriye dönük kapak.
 const fields=a=>({catalogImages:a.slice(0,MAX),catalogImage:a[0]||''});
 const G={MAX,list,toFront,without,fields};
 if(typeof module!=='undefined'&&module.exports)module.exports=G;else root.GALERI=G;
})(this);
