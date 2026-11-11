---
name: 3k
description: 3K (Kanıtla · Kur · Kazan) iç çamaşırı e-ticaret projesi. Kullanıcı "3K" dediği her durumda kullan — "3K ne durumda", "3K'da durum ne", "3K durum", "3K'yı başlat", "3K'ye kaldığın yerden devam et", "3K devam" vb. Muhasebe uygulamasıyla ilgisi yok; notlar ayrı bir dalda.
---

# 3K

Kullanıcı hiçbir dal, belge veya araç adı söylemez. Nerede ne olduğunu sen takip edersin.

- **Notların tek kayıt yeri:** `claude/lingerie-ecommerce-planning-sw8cx4` dalı → `docs/ic-camasiri-projesi-durum.md` (ana belge; "Şu an" tablosu güncel durumu verir). Diğer belgeler aynı klasörde.
- **Araçlar:** bu skill ve `.claude/agents/rakip-avcisi.md`, `.claude/agents/urun-hazirlayici.md` — `main` dalında.
- **Masaüstü paneli:** https://claude.ai/artifact/77euetsRAMfcKRiC715DXW — kullanıcı işi buradan izler ve yönetir. Verisi `ArtifactData` aracıyla (bu URL) okunup yazılır: `panel/durum`, `onaylar`, `komutlar`, `tablolar/*`, `belgeler/*`. Kullanıcı HER ŞEYİ panelin içinden yürütür; dışarıda sekme açtırma, ona Claude Code'a gitmesini söyleme. Panel mesajları (devam, durum, onay, serbest yazı) "Send to Claude" yorumu olarak paneli izleyen oturuma gelir (`[Artifact comment sent to Claude]`) ve `sohbet` koleksiyonuna da yazılır.
- **Panelden mesaj gelince:** işi yap; her anlamlı adımda ve sonunda `sohbet` koleksiyonuna {`kim`: "claude", `metin`: kısa sade Türkçe, `zaman`: ISO, `islendi`: true} ekle (panelde sohbet balonu olarak görünür); kullanıcının mesajını (`kim`: "sen") `islendi: true` yap; yorum dizisine de tek satırlık yanıt yaz (ArtifactComments). Uzun iş sürerken ara durumları `sohbet`e yaz ki kullanıcı ilerlemeyi panelde görsün.
- **İzinler (kullanıcı, 11 Kas 2026):** kayıt dalına ve 3K araçları için `main`'e doğrudan push serbest. `main`'de yalnızca `.claude/` ve `CLAUDE.md` 3K için değişir; muhasebe uygulamasının koduna dokunma.

## Rakip tanımı (kullanıcı kuralı)
Site ancak **güçlü reklam + ürünleri 1688'de birebir eşleşiyor** ise rakiptir; aksi halde yalnızca tarama adayıdır. Ürün listesine (Sayfa1) sadece rakip sitelerin ürünleri girer. Adayı rakibe çevirmek için `urun-hazirlayici` ile rakip testi yap; Eşik (kullanıcı, 11 Kas): ~10 örnek üründen **en az 1** birebir eşleşme yeter. **Birebir doğrulama iki aşamalı:** puan ≥0,95 ya da puan ≥0,80 + rakip görseli ile 1688 `image_url` görselini yan yana koyup gözle aynı ürün olduğunu teyit et (rakipler kendi fotoğrafını kullandığı için aynı ürün çoğu zaman 0,80–0,90 alır). Ayrıntı durum belgesinde "Eşleşme doğrulama".

**Erişim:** Aday sitelerin `products.json`'u, alan adı ortam izinli adreslerine eklenince curl ile ücretsiz çekilir (update_environment, kullanıcı onayı); Firecrawl kredisine bağlı kalma.

## Canlı iş ekranı (panel/is) — kullanıcı "her an ne durumda" görmek istiyor
Bir iş başlarken, her adım değiştiğinde ve en geç ~10 dakikada bir `panel/is` belgesini güncelle (`if_version` ile): {`baslik`, `durum`: calisiyor|bekliyor|engel|bitti|bos, `ilerleme`: 0–100, `sinyal`: şimdiki ISO zaman, `adimlar`: [{`ad`, `durum`: bitti|calisiyor|bekliyor|engel, `not`?}], `engel`: kullanıcının yapabileceği çözümle birlikte kısa açıklama ya da ""}. İş bitince `durum`: "bitti" ya da "bekliyor". Panel 15 dakikadan eski sinyalde kullanıcıyı uyarır.

## 1. Her seferinde önce: güncel kaydı topla

```bash
R=claude/lingerie-ecommerce-planning-sw8cx4
git fetch -q origin '+refs/heads/*:refs/remotes/origin/*'
# Kayıt dalına henüz girmemiş 3K notu taşıyan başka dal var mı? (gönderemeyen eski oturumlar kendi dalına yazmış olabilir)
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin | grep -v "origin/$R$\|origin/HEAD"); do
  n=$(git log --oneline origin/$R..$b -- docs/ic-camasiri-* docs/3k-* docs/asama* docs/github-arastirmasi.md 2>/dev/null | wc -l)
  [ "$n" -gt 0 ] && echo "$b: $n yeni 3K commit"
done
git show origin/$R:docs/ic-camasiri-projesi-durum.md
```

- Döngü bir dal bulursa: kayıt dalını ayrı bir worktree'de aç (`git worktree add ../3k-kayit origin/$R -B $R`), o dalı birleştir (`git merge <dal>`; çakışmada her iki tarafın bilgisini koru, "Şu an" tablosunu en yeni bilgiyle yaz), push et. Kullanıcıya bundan bahsetme; sadece işi düzgün yap.
- **Paneldeki cevapları al:** `ArtifactData` `query`, `onaylar`, where `islendi == false`. `durum` `onaylandi` ya da `reddedildi` olanlar kullanıcının kararıdır: kararı durum belgesine (Kararlar / Geçmiş) işle, gereğini yap, sonra o belgeyi `update` ile `islendi: true` yap (`if_version` ile). Kullanıcı aynı onayı sohbette de verebilir; hangisi gelirse geçerlidir.
- **Bekleyen panel mesajlarını al:** `sohbet` where `kim == "sen"` and `islendi == false` (Claude bağlı değilken yazılmış olabilir) — talimat olarak uygula, `islendi: true` yap.
- **Paneldeki notları al:** `ArtifactData` `query`, `komutlar`, where `islendi == false`. Her biri kullanıcının panelden yazdığı talimattır (`not`, `tur`: devam/durum); uygula, sonra `islendi: true` yap. Not ayrıca oturumun ilk mesajında "Kullanıcının notu:" diye de gelebilir; aynı talimatı iki kez uygulama.
- Ana belgedeki "Şu an" tablosu esas alınır. Diğer belgelerle çelişki görürsen ana belgeyi düzelt.
- Gerekirse oku: `docs/ic-camasiri-projesi-plan.md`, `docs/3k-is-modeli.md`, `docs/asama1-rakip-tablosu.md`, Google tablo (Composio, ID belgede), ortak belge (Claude Docs, link belgede).

## 2a. "3K ne durumda" / "3K'da durum ne"

Kısa Türkçe özet: hangi aşamadayız, en son ne yapıldı, senden ne bekleniyor, sıradaki adım. Hiçbir iş başlatma, hiçbir şey yazma.

## 2b. "3K'yı başlat" / "3K'ye kaldığın yerden devam et" / "3K devam"

1. "Şu an" tablosundaki **Sıradaki adım**ı yap.
2. Gereken araçları sormadan kullan:
   - 1688: `/opt/1688-product-find` + `/opt/1688-venv` (yoksa belgedeki kurulum komutu). Anahtar `ALI_1688_AK`; değeri asla yazdırma. Shopify görselini önce indir, dosya olarak ara.
   - Firecrawl (site/ürün çekme), Gemini (görsel puanı), Composio (Google tablo).
   - Alt ajanlar: yeni rakip için `rakip-avcisi`, bir sitenin ürünleri için `urun-hazirlayici`. Bağımsız işleri paralel ver. Her göreve sınır koy (ör. "avidlove.com, ilk 20 ürün"), dönen sonucu tabloda kontrol et (sütun sırası, Shopify şartı, kopya satır, kullanıcı hücreleri), hatayı düzelt. Alt ajanlar dala/belgeye yazmaz; kaydı sen tutarsın.
3. Onay gerekenler: para harcama, geri alınamayan iş, dışarıya yayın, hesap açma, aşama değiştirme.
4. Aşama ya da adım bitince dur, sonucu kısa özetle, onay bekle.

## 3. Kaydet (her ilerlemeden sonra, sorulmadan)

1. Kayıt dalının worktree'sinde `docs/ic-camasiri-projesi-durum.md`:
   - "Şu an" tablosunu güncelle (aşama, son yapılan, bekleyen, sıradaki adım). Eskiyen bilgiyi sil; aynı konuda ikinci bir "Sıradaki adım" başlığı açma.
   - "Geçmiş" tablosunun en üstüne bir satır ekle. Tarih = `date +%d` ile bugünün tarihi.
   - Yeni doğrulanmış yöntem varsa "Nasıl yapılır"a, yeni karar varsa "Kararlar"a yaz.
2. Commit et ve `git push origin claude/lingerie-ecommerce-planning-sw8cx4`. Ağ hatasında 2/4/8/16 sn arayla tekrar dene.
3. Kayıt dalına push reddedilirse oturumun kendi dalına push et; bir sonraki oturum 1. adımda bunu toplar.
4. **Paneli güncelle** (her kayıtta, sorulmadan): `ArtifactData` `get` `panel/durum` → `set` (`if_version` ile) şu alanlarla: `asama` (sayı), `asamaAdi`, `sonYapilan`, `bekleyen`, `siradaki` (durum belgesinin "Şu an" tablosuyla aynı, kısa ve sade Türkçe), `guncelleme` (ISO zaman, `date -u +%FT%TZ`), `sayilar` {`rakip`, `taranan`, `eslesen`, `onaylanan`, `hedef`: 1000} (Google tablodan say), `gecmis` (en yeni başta, en fazla 8 öğe, {`tarih`: "11 Kas", `metin`}).
4b. **Panel içi görünümleri güncelle** (panel dış sekme açmaz; her şeyi buradan gösterir). `ArtifactData` `set` (`file_path` ile JSON dosyası, var olana `if_version`):
   - `tablolar/rakip`: Google tablo `Rakip Siteler` sekmesi → {`baslik`: "Rakip Siteler", `sutunlar`: [başlık satırı], `satirlar`: [{`c`: [hücreler]}], `toplam`, `guncelleme`}.
   - `tablolar/urunler`: `Sayfa1` → aynı biçim, `baslik`: "Ürün listesi"; görsel sütununu çıkar (panel dış görsel gösteremez); en yeni 400 satır, `toplam` gerçek satır sayısı.
   - `belgeler/durum` ve `belgeler/plan`: {`baslik`, `md`: dosyanın tam metni, `guncelleme`} — `docs/ic-camasiri-projesi-durum.md` ve `docs/ic-camasiri-projesi-plan.md`.
5. **Onay gerekiyorsa** (aşama sonu, para/yayın/hesap işi, öneri): `onaylar` koleksiyonuna yeni belge ekle — `soru` (tek cümle), `detay` (kısa gerekçe/maliyet), `durum`: "bekliyor", `olusturma` (ISO), `islendi`: false. Artık geçerli olmayan bekleyen onayı silme; `durum`: "iptal", `islendi`: true yap.
6. Bu skill veya alt ajanlar değişirse `main`'e de push et (yalnız `.claude/` ve `CLAUDE.md`).
