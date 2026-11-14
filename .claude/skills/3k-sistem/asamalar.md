# 3K Sistemi — Aşamalar

Her aşama: **girdi → iş → çıktı → onay kapısı**. Bir aşama bitmeden ve kullanıcı onaylamadan sonrakine geçilmez. Her aşama içinde iş gruplar halinde yapılır (grup sonu: dur, raporla).

---

## MOD A — Yeni site kur ("X ürünü için site yapacağız")

### 0. Brief
- **Girdi:** ürün kategorisi (ör. bikini), hedef pazar (ör. Türkiye), reklam başlangıç tarihi.
- **İş:** kategori/pazar kararlarını netleştir (ağırlık hangi alt kategori, hariçler: ör. erkek, genel moda, oyuncak), takvim çıkar (geri sayım: reklam tarihi).
- **Çıktı:** proje kurulumu (`proje-kurulum.md`) + durum belgesinde Kararlar tablosu + takvim.
- **Onay:** kriterler ve takvim.

### 1. Kanıtla — rakip taraması
- **Rakip tanımı:** Shopify mağaza + **güçlü Meta reklamı** (Güçlü ≥300 aktif, Orta 100–299) + **ürünleri 1688'de birebir eşleşiyor** (≈10 örnek üründen en az 1 birebir). Biri eksikse yalnız "aday".
- **İş:** aday bul (Modül 1) → küçük mağazaları ele (<~150 ürün) → 1688 testi (Modül 3–5, aday başına ≤10 ürün; ilk 10'da ≥0,80 yoksa geç) → yalnız 1688'i geçenlerin reklamını ölç (Modül 2).
- **Çıktı:** "Rakip Siteler" tablosu (Durum: Rakip/Aday/Elendi).
- **Onay:** hangi rakiplerle devam.
- **Ders:** marka/kendi tasarımı siteler (Triangl, Jolyn) 1688'de yok; Avidlove tipi "Çin fabrika" siteler altın madeni (taranan iç giyimin ~yarısı birebir).

### 2. Kanıtla — ürün eşleştirme
- **İş:** rakiplerin kataloğunu grup grup tara (Modül 3–5), görselle doğrula, eşleşenleri ürün listesine yaz (Google tablo `Sayfa1` + panel `tablolar/urunler`).
- **Çıktı:** eşleşmiş ürün listesi (rakip linki, 1688 linki, rakip fiyatı, kaç rakipte).
- **Onay:** görselle doğrulananlar doğrudan "Eşleşti" (kullanıcı onayı verildiyse); şüpheliler kullanıcıya.

### 3. Ürün seçimi
- **Hedef:** ≥1000 temiz ürün (kategori oranı ürünlere göre). Ölçütler: 1688 eşleşmesi kesin, birden fazla rakipte satılıyor, iyi görsel/manken (Modül 6), kategori dengesi.
- **Çıktı:** kilitli ürün listesi. **Onay:** listeyi kullanıcı kilitler.

### 4. Kur — mağaza
- Marka adı + alan adı (Shopify araçları: isim/alan adı önerisi; satın alma onaylı), tema, Türkçe başlık/açıklama (mağaza tarzı), fiyatlama (Modül 7), toplu TASLAK yükleme (Modül 8), sayfalar, kargo/iade, ödeme (kullanıcı), piksel.
- **Onay:** her yayın/satın alma; yayına alma kullanıcıda.

### 5. Kazan — reklam
- Rakip reklam analizi, kreatifler (reklam metni becerileri), ayrı Business Manager, test siparişleri, reklam başlangıcı.
- **Risk notu:** fantezi görseller Meta'da hesap kapatabilir → reklamda sade görsel.
- **Onay:** her harcama ve yayın.

---

## MOD B — Mevcut siteyi geliştir ("şu siteye X ekleyeceğiz")

### B1. Site analizi (yalnız okuma)
- Shopify MCP ile: ürün sayısı, koleksiyonlar, ürün tipleri, fiyat aralıkları, başlık/açıklama tarzı, beden yapısı, stok modeli, tema; eksik kategoriler (boşluk analizi). Uyarı ver: katalog kaynağı, görsel hakları vb.
- **Çıktı:** "Site bilgileri" + boşluk listesi + ekleme planı (kategoriler × adet). **Onay:** plan.

### B2. Kaynak seçimi
- Doğrudan 1688 listesi sunma (kullanıcı reddetti). Yol: **güçlü/kalite kaynak site → ürün → 1688** ya da **1688 en çok satan → Google Lens → aynı ürünü iyi modelle satan site**. Kullanıcının verdiği kaynak siteler varsa onlar, verilen sırayla.
- Fotoğraf ölçütü zorunlu (Modül 6).

### B3. Eşleştirme + sunum
- Kaynak ürün ↔ 1688 (Modül 4–5). Panelde **Plan kartları**: büyük karşılaştırma görseli, rakip linki, 1688 linki, rakip fiyatı, Onay/Ret, fiyat kutusu.

### B4. Taslak yükleme (onaylılar)
- Modül 8: Shopify'a DRAFT, doğru koleksiyon, mağaza tarzında Türkçe metin, kullanıcı fiyatı (yoksa kural), görseller kaynak siteden (kullanıcı izni). Plan'da "eklendi" işaretle.

### B5. Yayın — her zaman kullanıcıda.

---

## Her aşamada
- Durum belgesi "Şu an" + Geçmiş + Kararlar güncel; panel (durum, iş, rapor, tablolar) güncel.
- Yeni öğrenilen yöntem → `moduller.md`.
- Grup sonu: dur, raporla, "devam" bekle. Uzun süreli iş istenirse (ör. "yarın 14:00'e kadar durmadan") → Modül 10 (gece işi).
