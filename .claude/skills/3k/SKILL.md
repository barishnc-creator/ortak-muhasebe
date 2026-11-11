---
name: 3k
description: 3K (Kanıtla · Kur · Kazan) iç çamaşırı e-ticaret projesi. Kullanıcı "3K" dediği her durumda kullan — "3K ne durumda", "3K'da durum ne", "3K durum", "3K'yı başlat", "3K'ye kaldığın yerden devam et", "3K devam" vb. Muhasebe uygulamasıyla ilgisi yok; notlar ayrı bir dalda.
---

# 3K

Kullanıcı hiçbir dal, belge veya araç adı söylemez. Nerede ne olduğunu sen takip edersin.

- **Notların tek kayıt yeri:** `claude/lingerie-ecommerce-planning-sw8cx4` dalı → `docs/ic-camasiri-projesi-durum.md` (ana belge; "Şu an" tablosu güncel durumu verir). Diğer belgeler aynı klasörde.
- **Araçlar:** bu skill ve `.claude/agents/rakip-avcisi.md`, `.claude/agents/urun-hazirlayici.md` — `main` dalında.
- **İzinler (kullanıcı, 11 Kas 2026):** kayıt dalına ve 3K araçları için `main`'e doğrudan push serbest. `main`'de yalnızca `.claude/` ve `CLAUDE.md` 3K için değişir; muhasebe uygulamasının koduna dokunma.

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
4. Bu skill veya alt ajanlar değişirse `main`'e de push et (yalnız `.claude/` ve `CLAUDE.md`).
