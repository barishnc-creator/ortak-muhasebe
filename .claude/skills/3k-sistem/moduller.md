# 3K Sistemi — Modüller (doğrulanmış yöntemler ve dersler)

Kaynak: 3K iç çamaşırı/bikini (11–13 Kas 2026) ve 3K Vael (13–14 Kas 2026) çalışmaları. Yeni ders çıktıkça buraya ekle.

## 1. Rakip / kaynak site bulma
- **Ücretsiz, çalışıyor:** açık Shopify dizinleri — `www.storecensus.com/shopify-stores/<kategori>` (ör. bikinis, swimwear), `storeleads.app/reports/shopify/category/...`. curl ile, alan adları ortam izninde olmalı.
- Claude WebSearch (ücretsiz, liste kalitesi orta).
- Firecrawl: `firecrawl_search` + Alexandria `shopify` `catalog/search_catalog` (ürün tipine göre mağaza bulur; görselle arama `like:[{image:{content_type,data:<base64 ~160px>}}]` benzer ürün verir, aynısını değil). **Günlük ücretsiz kota ~14 site** (06:45 UTC yenilenir).
- Kullanıcının verdiği site listesi varsa: **verilen sırayla**, bir site bitmeden diğerine geçme.
- **Engelli/çalışmayan:** shop.app kazıma ve Facebook'u otomatik tarayıcıyla okumak güvenlik kontrolünce engellendi (zorlama). Perplexity ve Composio ücretli (kredi gerekirse kullanıcıya sor).
- Hız kuralı: <~150 ürünlü mağazayı test etmeden atla.

## 2. Reklam gücü ölçme (Meta Ad Library)
- Ölçüt: aktif reklam sayısı — Güçlü ≥300, Orta 100–299, altı zayıf. Reklamveren adı siteyle eşleşmeli.
- **Ücretsiz yol (karar 13 Kas):** yalnız 1688'i geçen siteler için ana oturumda tek `firecrawl_scrape` (formats query) — URL `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=<alan-adı>&search_type=keyword_unordered`. Kota yetmezse panelde elle kontrol linki ver.
- Meta resmî API: ücretsiz ama yalnız AB/İngiltere'de gösterilen reklamları sayar, kimlik doğrulaması ister → varsayılan değil.

## 3. Ürün çekme
- Shopify: `https://<site>/products.json?limit=250&page=N` (alan adı ortam iznine `update_environment` ile toplu eklenir, kullanıcı onayı). Büyük kataloglarda kesilirse koleksiyon uçları (`/collections/<x>/products.json`).
- Ticimax siteleri (Türk butikleri): görseller `static.ticimax.cloud`; ürün linkleri kategori sayfalarından.
- Seçimde **başlık ve ürün tipine** bak, etikete değil (etiket "swim" fantezi ürünleri de çekti).
- Kategori dışı otomatik atla: erkek (`\bmen\b|men's|male`), oyuncak (`vibrat|toy|dildo|suction…`), genel moda (`sweater|cardigan|hoodie|jeans|blouse|pleated|knit…` — projeye göre), aksesuar (Vael: bere/atkı/eldiven yok).

## 4. 1688 arama
- Araç: resmî `next-1688/1688-product-find` → `/opt/1688-product-find` + `/opt/1688-venv` (ortam kurulum betiği kurar). Anahtar `ALI_1688_AK` (değeri asla yazdırma).
- Görselle: `cli.py image_search -i <dosya.jpg> -l 5..10`. **Shopify görselini link olarak verme (0 sonuç); önce indir** (`?width=800`), dosya olarak gönder.
- Metinle (Mod B): `cli.py text_search --query "<Çince>" --limit 40 --sort sold_desc --score-level medium`; uzun sorgu 0 dönerse kısalt. Batı pazarı modelleri için başlıkta 跨境/欧美/亚马逊/ins风/外贸. **En çok satanlar öncelikli.**
- 429 → 60–120 sn bekle. Sonuç alanları: title, price, similarity_score, detail_url, **image_url**, supplier, sold_count.

## 5. Görsel doğrulama (iki aşamalı) — en önemli ders
- 1688 benzerlik puanı aynı ürün için bile **0,80–0,92** (aynı fotoğrafta bile). 0,95 eşiği her şeyi kaçırır.
- Kural: puan ≥0,80 → rakip görseli + 1688 `image_url` görselini yan yana birleştir (Pillow), 10'arlı ızgara, **gözle** karar: aynı / benzer / farklı / kategori dışı. ≥0,95 doğrudan aynı.
- Bu iş **alt ajanda** (ucuz model) yapılır; ana oturum yalnız kısa listeyi okur.
- `cbu01.alicdn.com` bağlantısı arada kopar → `curl --retry 4 --retry-all-errors`.
- Ters yön (Mod B): Google Lens — Composio `OPENWEB_NINJA_SEARCH_WITH_GOOGLE_LENS` (kullanıcının OpenWeb Ninja hesabı; kota kullanıcıdan düşer, üst sınırı aşma). Pazar yerlerini ele, tek ürün sayfaları kalsın. Yandex yalnız Rus pazar yerlerini veriyor.

## 6. Fotoğraf / kalite ölçütü
- **Premium:** ürün canlı modelde giyili, temiz/sade arka plan, profesyonel ışık (deepatelier.co ayarı). Alma: cansız manken, askı, flat-lay, dağınık arka plan, amatör çekim, kolaj/yazı.
- Ürün seçiminde "güzel görsel + güzel manken" şartı (Mod A Aşama 3).

## 7. Fiyatlama
- Kullanıcı belirler. Varsayılanlar: Vael → rakip sitenin TL fiyatı aynen, <2.750 ₺ → 3.500 ₺; yurt dışı rakip € fiyatı ×kur ile TL'ye. Mod A → tedarik fiyatı ile TR rakip fiyatı arası makul nokta.
- 1688 fiyatı satış fiyatını belirlemez.

## 8. Shopify taslak yükleme
- Shopify MCP `graphql_query`/mutation. `productSet` ile tek seferde options+variants+media+collections; **status DRAFT**, asla ACTIVE/publish yok.
- Beden XS–XXL (mağaza yapısına göre), inventoryPolicy CONTINUE (siparişe göre tedarik), SKU `<MAĞAZA>-1688-<offerId>-<beden>`, etiketler (Occasion, Category, sezon, `kaynak-1688`, `1688:<id>`), Türkçe açıklama mağaza tarzında (giriş, H2, "Nasıl Kombinlenir?", özellik maddeleri).
- Türkçe "İ" ile başlayan başlıkta handle bozuluyor → handle'ı elle ver.
- Sayım için `productsCount(query:...)` takma adları (çıktı küçük kalır). Fiyat güncelle: `productVariantsBulkUpdate`.
- Doğru koleksiyon ID'si durum belgesinde (ör. Vael Kış Koleksiyonu 319748571205).

## 9. Panel (kullanıcının tek ekranı)
- Şablon: `panel-sablon.html` (cam tasarım, siyah-beyaz-yeşil, GitHub temaları). Yetenekler: `db`, `comments`, `dictation`.
- Veri: `panel/durum`, `panel/is` (canlı iş; ~10 dk'da bir sinyal), `panel/limit` (get_session → rate_limit_info, context_usage), `onaylar`, `sohbet`, `komutlar`, `tablolar/rakip|urunler`, `belgeler/rapor|durum|plan`, `plan_kararlar/<id>`.
- **Plan kartları:** `belgeler/plan.urunler` dizisi {id,no,grup,ad,site,fiyat,benzerlik,site_link,link_1688,img_s,img_a,durum}; görseller panel asset deposuna yüklenir (`Artifact publish asset:true`, `/_blob/<id>`; 600×800 JPEG q80); kullanıcı Onay/Ret + fiyat → `plan_kararlar`; buton onaylananları Claude'a mesajla yollar.
- Mesaj kanalı: panel "Send to Claude" yorumu → paneli **izleyen** oturuma gelir (`ArtifactComments watch`). Aynı paneli tek oturum izlesin (çift iş olmasın).
- Panel dış site açmaz, dış görsel yüklemez; linkler kopyalanır. Google Tablolar'da `=IMAGE()` için kullanıcının bir kez "Erişime izin ver" demesi gerekir.
- Mobil Claude uygulaması sesli yazma vermez → klavye mikrofonu.

## 10. Uzun süreli iş (gece işi)
- Kullanıcı "şu saate kadar durmadan" derse: iş tarifi + kuyruk dosyası yaz (ör. `docs/<proje>-gece-is.md`), planlı görev (2 saatte bir) kur, bitiş saatinde görevi kapat. Her tur: önce paneldeki bekleyen onayları işle, sonra kuyruktan sıradaki.
- Limit dolarsa bekle, sıfırlanınca devam; durumu `panel/is.engel`e yaz.

## 11. Oturum ve token düzeni
- Bir oturum uzarsa her panel mesajı pahalılaşır → `devir.md` (eşikler 250/400 bin; Merkez yönetir).
- Çalışma süreci yeniden başlayabilir; arka plan işleri ölür → log dosyalarından kalanı topla, yarım grubu tamamla.
- Kayıt dalına push reddedilirse oturumun kendi dalına push; sonraki oturum toplar.
