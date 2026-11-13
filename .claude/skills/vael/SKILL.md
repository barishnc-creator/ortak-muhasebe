---
name: vael
description: 3K Vael — Vael Maison (vaelmaison.com, Shopify) sitesini geliştirme işi; ilk hedef kışlık ürün eklemek. Kullanıcı "Vael" dediği her durumda kullan — "Vael ne durumda", "Vael'e kaldığın yerden devam et", "Vael devam" vb. 3K iç çamaşırı projesinden ayrıdır (yöntem ortak, veriler ayrı).
---

# 3K Vael

Kullanıcı hiçbir dal, belge veya araç adı söylemez. Nerede ne olduğunu sen takip edersin.

- **Notların tek kayıt yeri:** `claude/vael-kayit` dalı → `docs/vael-durum.md` ("Şu an" tablosu güncel durumu verir).
- **Araçlar:** bu skill; gerektiğinde `.claude/agents/urun-hazirlayici.md` (1688 arama + görsel doğrulama) — `main` dalında. Shopify MCP (mağaza okuma/yazma) bu ortamda bağlı.
- **Masaüstü paneli:** https://claude.ai/artifact/PTJJvgPc48BWr4ckDhVu3B — kullanıcı işi buradan izler ve yönetir. Verisi `ArtifactData` aracıyla (bu URL) okunup yazılır: `panel/durum`, `panel/is`, `panel/limit`, `onaylar`, `komutlar`, `sohbet`, `tablolar/*` (`tablolar/rakip` panelde "Site bilgileri", `tablolar/urunler` "Ürün listesi"), `belgeler/*` (`rapor`, `durum`, `plan`). Kullanıcı HER ŞEYİ panelin içinden yürütür; dışarıda sekme açtırma. Panel mesajları "Send to Claude" yorumu olarak paneli izleyen oturuma gelir ve `sohbet` koleksiyonuna da yazılır.
- **Panelden mesaj gelince:** işi yap; ara durumları ve sonucu `sohbet`e {`kim`: "claude", `metin`, `zaman`: ISO, `islendi`: true} olarak yaz; kullanıcının mesajını `islendi: true` yap; yorum dizisine tek satır yanıt (ArtifactComments).
- **İzinler (kullanıcı, 13 Kas):** kayıt dalına ve Vael araçları için `main`'e (yalnız `.claude/`, `CLAUDE.md`) doğrudan push serbest. Muhasebe uygulamasının koduna dokunma.
- **Shopify yazma kuralı:** ürün ekleme/değiştirme/silme, fiyat, yayına alma, tema değişikliği — her seferinde önce `onaylar`'a soru ekle, onay gelmeden yapma. Okumak serbest.
- **Yöntem 3K ile ortak, veriler ayrı:** 3K iç çamaşırı verisi (tablo, rakipler) buraya karışmaz.

## Token tasarrufu (kullanıcı, 12 Kas) — ZORUNLU
- Ana oturum ince kalır: tarama, 1688 araması ve **görsel karşılaştırma** işlerini alt ajanlara (ucuz model; ör. `urun-hazirlayici`, genel işler için general-purpose) ver; ana oturum yalnız sonuç özetini okur. Büyük görselleri/ızgaraları ana oturumda açma.
- Komut çıktısını kısa tut (`tail`, sayılar); büyük JSON/HTML'i ekrana basma, dosyaya yaz.
- Panel güncellemelerini tek `batch` çağrısında topla.
- Oturum hafızası %50'yi geçince (get_session → context_usage) işi yeni bir oturuma devret: durum belgesini güncelle, yeni oturum aç ("Vael'e kaldığın yerden devam et; paneli izle"), yeni oturum paneli izlemeye başlayınca eskisi `ArtifactComments watch on:false` ile bırakır.
- Panel mesajlarını alan oturum paneli izlemelidir: işe başlarken `ArtifactComments action:watch url:<panel>` çağır.

## Çalışma ritmi (kullanıcı, 11 Kas)
İşi **gruplar** halinde yap (ör. 10–20 ürünlük bir parti). Her grup bitince **dur ve raporla**: `belgeler/rapor` belgesini (panelde Kısayollar → Rapor; markdown: özet, rakipler, eşleşen ürünler, engeller/çözümler, senden bekleyen, sıradaki) güncelle, `sohbet`e kısa özet yaz, kullanıcının "devam" demesini bekle.

## Canlı iş ekranı (panel/is) — kullanıcı "her an ne durumda" görmek istiyor
Bir iş başlarken, her adım değiştiğinde ve en geç ~10 dakikada bir `panel/is` belgesini güncelle (`if_version` ile): {`baslik`, `durum`: calisiyor|bekliyor|engel|bitti|bos, `ilerleme`: 0–100, `sinyal`: şimdiki ISO zaman, `adimlar`: [{`ad`, `durum`: bitti|calisiyor|bekliyor|engel, `not`?}], `engel`: kullanıcının yapabileceği çözümle birlikte kısa açıklama ya da ""}. İş bitince `durum`: "bitti" ya da "bekliyor". Panel 15 dakikadan eski sinyalde kullanıcıyı uyarır.

## 1. Her seferinde önce: güncel kaydı topla

```bash
R=claude/vael-kayit
git fetch -q origin '+refs/heads/*:refs/remotes/origin/*'
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin | grep -v "origin/$R$\|origin/HEAD"); do
  n=$(git log --oneline origin/$R..$b -- docs/vael-* 2>/dev/null | wc -l); [ "$n" -gt 0 ] && echo "$b: $n yeni Vael commit"
done
git show origin/$R:docs/vael-durum.md
```
- Başka dalda Vael notu varsa kayıt dalına birleştir (worktree `../vael-kayit`), push et.
- Paneldeki bekleyenleri al: `onaylar` (islendi==false; onaylandi/reddedildi = karar → belgeye işle, gereğini yap, islendi:true), `sohbet` (kim=="sen", islendi==false → talimat), `komutlar` (islendi==false).

## 2a. "Vael ne durumda"
Kısa Türkçe özet (aşama, son yapılan, senden bekleyen, sıradaki). İş başlatma, yazma.

## 2b. "Vael'e kaldığın yerden devam et" / "Vael devam"
1. "Şu an" tablosundaki **Sıradaki adım**ı yap; araçları sormadan kullan (Shopify MCP okuma, `products.json`, 1688 aracı, WebSearch, alt ajanlar).
2. Onay gerekenler: Shopify'a her yazma, para, hesap, dışarıya yayın, aşama değiştirme.
3. Grup bitince dur, raporla, onay bekle.

## 3. Kaydet (her ilerlemeden sonra, sorulmadan)
1. `docs/vael-durum.md`: "Şu an" tablosunu güncelle (eskiyi sil), "Geçmiş"in en üstüne satır, yeni yöntem → "Nasıl yapılır", karar → "Kararlar". Commit + `git push origin claude/vael-kayit` (ağ hatasında 2/4/8/16 sn tekrar).
2. **Paneli güncelle** (tek `batch`): `panel/durum` {asama, asamaAdi, sonYapilan, bekleyen, siradaki, guncelleme, sayilar: {rakip: hazırlanan ürün, aday: taslak, taranan: incelenen, eslesen: onay bekleyen, onaylanan: sitede yayında, hedef}, gecmis (≤8)}; `panel/is` (canlı iş); `panel/limit` (get_session → rate_limit_info, context_usage); `belgeler/rapor` (grup sonunda), `belgeler/durum` (belgenin tam metni); gerekirse `tablolar/rakip` ("Site bilgileri": anahtar bilgiler tablosu) ve `tablolar/urunler` (aday/eklenen ürünler).
3. **Onay gerekiyorsa** `onaylar`'a {soru, detay, durum:"bekliyor", olusturma, islendi:false}.
4. Skill değişirse `main`'e de push et.
