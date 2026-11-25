# PAKET — Tidex Muhasebe (Atölye Defteri)

Son güncelleme: 25 Kas 2026. Bu işin güncellemeleri yalnız bu paketin tek oturumundan yürür ("Tidex Muhasebe" başlıklı, sol menüde sabitli). Bu depo AÇIKTIR: buraya yalnız Tidex uygulamasının bilgisi yazılır; başka işlere ait içerik, kişisel bilgi, gizli anahtar, davet kodu asla yazılmaz (bkz. `CLAUDE.md`, `.github/workflows/gizlilik.yml`).

## Amaç
Tidex Technology'nin ortaklı ortak muhasebe ve operasyon uygulaması + 3D baskı atölye defteri: siparişler, tahsilat, üretim/baskı sırası, kasa, partner fiyat listeleri, ürün kataloğu. İki ortak kullanır.

## Uygulama (kod ne yapıyor)
- `index.html` — Atölye Defteri (tek sayfa, Supabase ile bulut senkron). Sekmeler: Özet, Takvim, Siparişler, Teklifler, Partnerler, Üretim, Üretim planlaması, Kasa ve sonrası (raporlar: haftalık gelir, partner satışları, en kârlı ürünler, müşteri bağımlılığı, borçlar, defter, firma bilgileri).
- `catalog.html` — herkese açık Ürün Kataloğu (sepet, toptan indirim, kampanyalar, çok görselli ürünler, partner kataloğu); gelen siparişler deftere düşer ve bildirim gider.
- `supabase/functions/catalog-push` — katalog siparişinde web-push bildirimi (VAPID; gizli anahtarlar Supabase'te).
- `atolye.js` (3D Atölye: fotoğraftan figür konsepti, STL ölçekleme), `plan.js`, `ozet.js`, `kademe.js`, `galeri.js` — saf hesap modülleri; testler `tests/` (`node --test tests/*.test.mjs` ve `.cjs`; para hesabında float yok).
- `mesai-defteri/` — bağımsız mesai takip sitesi. `kantin/` — Kantin Takip uygulamasının DERLENMİŞ hâli (aynı Supabase projesinde, `/kantin` altında yayınlı; kaynak kodu başka yerde tutulur, bu depoya kaynak/not yazılmaz).
- Yayın: GitHub Pages (main), barishnc-creator.github.io/ortak-muhasebe. Veri: Supabase projesi (ref `woogrfdcjonaurwgwoor`, Singapur; adres ve `sb_publishable_` anahtarı tasarım gereği açık, gizli sunucu anahtarı yalnız Vault'ta).

## Şu anki durum
- Canlı, bakım modunda; son commit'ler (22–25 Kas) Kantin uygulamasının yayın güncellemeleri. Atölye Defteri'nde açık geliştirme yok.
- Haftalık öneri görevi çalışıyor (aşağıda). Son rapor (23 Kas): 3 öneri, **1. öncelik: Kantin ile Tidex verisinin Supabase'te ayrılması** (aynı projede iki ayrı iş: yetki/veri karışma riski, kota paylaşımı); kod değiştirilmedi.

## Açık işler / sıradaki adımlar
1. Kantin/Tidex Supabase ayrımı: karar kullanıcıda; ayrı proje kurulacaksa Kantin tablolarını taşıma planı (Kantin kaynağı ayrı yerde, bu depoya not yazılmaz).
2. Haftalık görevin önerdiği diğer iki geliştirme (23 Kas raporu oturum hafızasında): uygulanması kullanıcı onayına bağlı.
3. Kontrol: `gizlilik.yml` `docs/` klasörünü yasaklar; yalnız `docs/PAKET.md` istisnadır (25 Kas'ta eklendi). Başka docs dosyası eklenmez.
4. Küçük iş: gizlilik kontrolü, Supabase kütüphanesindeki sabit bir metni yanlış alarm olarak yakalayabiliyor (kontrol desenini daraltma onay bekliyor).

## Kararlar ve tercihler (bu işe özel)
- Para hesabında float yok; veri güvenliği ve kullanım kolaylığı öncelikli.
- Kod değiştirme/PR açma haftalık görevde yok: görev yalnız öneri listesi verir. Değişiklik kullanıcı isteğiyle bu oturumdan yapılır.
- Açık depo: gizlilik kuralı kesin.

## Kimlikler
- Depo (açık): github.com/barishnc-creator/ortak-muhasebe, dal main.
- Zamanlanmış görev: trig_016rJE2xzGqMRmmjvqda3sgy "Haftalık Tidex geliştirme önerileri" — Pzt 09:00 (İstanbul), oturum `session_01Ry9EY9fpN7jsYRGEUxBkk6`'ya bağlı (Claude Hearth kanalı). Görevin model alanı boş (hesap varsayılanı); bağlı oturum Opus, orta çaba. 25 Kas'ta DOKUNULMADI (model ucuz değil: raporlandı; ucuza çekmek kullanıcı kararı).
- Tek oturum: `session_01Ry9EY9fpN7jsYRGEUxBkk6` (~192 bin bağlam, 200 bine yaklaşıyor → yeni oturuma devir gerekecek; haftalık görev o zaman yeni oturuma taşınır).

## Skill ve araçlar
Depoda `.claude/skills` yok (açık depo). Hesap skill'leri: `anthropic-skills:yazilim-test-ve-hata-ayiklama`, `guvenlik-denetimi`, `xlsx` (rapor/aktarım), `3d-model-paketi` / `hunyuan-figur-uretimi` / `openscad` (atölye modelleri), `tasarim-paketi`. Araçlar: Supabase MCP (ortak-muhasebe hesabı), Playwright, Node testleri.

## Bilinen sorunlar / dersler
- Gizlilik kontrolü `docs/`, `.claude/skills|agents` yollarını ve belirli anahtar kelimeleri reddeder; PAKET.md yazarken bu kelimeleri kullanma.
- Eski dal `arsiv/ortak-muhasebe-main-2026-11-14` arşivdir, dokunma.

## Eski oturumlar
Haftalık öneri oturumu (yukarıdaki, aktif tek oturum) · Çalışan saat takip uygulaması (14 Kas, Mesai Defteri; arşivli). Not: 3D baskı plaket/trend araştırması ayrı bir iştir (kendi paketi), bu pakete dahil değil.
