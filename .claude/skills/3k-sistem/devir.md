# 3K Sistemi — Oturum devri (bağlam yönetimi)

Kullanıcı kararı (14 Kas 2026): devir sistemini Merkez yönetir; "hangisine ne gerekiyorsa ona göre devir yap, her zaman sorunsuz devam etsin." Devir için ayrıca onay istenmez. Para, yayın, hesap ve Shopify'a yazma kuralları devirde de aynen geçerli.

## Model (kullanıcı kararı 14 Kas 2026)
Yeni açılan tüm oturumlar (Merkez ve çalışanlar) Sonnet ile açılır: `create_session model:"claude-sonnet-5-5"`. Geçiş yalnız devirde olur; açık oturumda model değiştirilmez. Zor kararlarda gerekiyorsa tek seferlik Opus alt ajanı (`Agent model:"opus"`) kullanılır.

## Neden
Oturumların penceresi 1M token, ama her mesajda tüm bağlam yeniden okunur. 300 bin tokenlık bir oturumda her adım, 50 bin tokenlık bir oturuma göre ~6 kat pahalıdır ve kullanım sınırını o kadar hızlı doldurur. Bu yüzden devir erken ve düzenli yapılır. Otomatik sıkıştırma (784 bin) beklenmez.

## Eşikler (`get_session` → `external_metadata.context_usage.used_tokens`)

| Oturum | Hazırlık | Devir | Zorunlu |
|---|---|---|---|
| Proje çalışanı | 250 bin: yeni büyük iş başlatma, mevcut grubu bitir | Grup sonunda ya da beklemedeyken | 400 bin: ilk güvenli noktada hemen |
| 3K Merkez | — | 300 bin, tur sonunda | 400 bin |

Not: Merkez'in araç listesi büyük olduğu için temel bağlamı ~150 bindir. Eşik bu yüzden 300 bindir.

**Güvenli nokta:** Shopify yazmasının, push'un ya da panel batch'inin ortası değil. Alt ajan sürüyorsa önce biter. Yarım grup durum belgesine "yarım: şu kadarı bitti" diye yazılır.

## Kim tetikler
- **Merkez** her uyandığında çalışanların bağlamına bakar: panel mesajı, çalışan haberi, günlük özet ve 4 saatte bir "devir kontrolü" görevi.
- **Çalışan** da kendi bağlamını her grup sonunda kontrol eder. Eşikteyse kendiliğinden devir notunu yazar ve Merkez'e bildirir. Çalışan yeni oturumu kendisi açmaz, açılışı Merkez yapar. Tek yer, tek kayıt.

## Akış — proje çalışanı
1. **Merkez → çalışan** (send_message): "[Devir] Bağlam X bin. İşi güvenli noktada bitir; devir notunu yaz; yeni iş başlatma."
2. **Çalışan:**
   - `anthropic-skills:devir-notu` skill'i ile kayıt dalına `docs/<ad>-devir.md` yazar (üzerine yazılır). Notta şunlar olur: şu an ne yapılıyordu, yarım kalan, bekleyen onaylar, kullanıcının son kararları, açık zamanlanmış görevler (ad, saat, prompt özeti), izlenen panel, önemli dosya ve tablo yolları, dersler.
   - Durum belgesini günceller ve push eder.
   - Kendi zamanlanmış görevlerini kapatır (`update_trigger enabled:false`); bunlar nota yazılı olur.
   - Panel izlemesini bırakır (`ArtifactComments watch on:false`).
   - Merkez'e `calisanlar/<ad>` için tek batch yazar: `durum:"devir-hazir"`, `devirNotu:"<dal>:docs/<ad>-devir.md"`, `guncelleme`. Merkez'e send_message da atar (araç yoksa batch yeter).
3. **Merkez:** `create_session` çağırır: `source_url` ortak-muhasebe, aynı ortam, `model:"claude-sonnet-5-5"`, `tags:[<ad>]`, `title:"3K <Ad> · <gün ay>"`, prompt aşağıdaki **Çalışan açılış metni**.
4. **Yeni oturum** "hazır" deyince Merkez şunları yapar:
   - `projeler/<ad>.oturum`, `calisanlar/<ad>.oturum` ve `durum` alanlarını günceller.
   - `devirler/<ISO>` kaydı ekler: {proje, eski, yeni, baglam, zaman}.
   - `akis` kaydı ekler.
   - Eski oturumu `archive_session` ile kapatır.
   - Bekleyen kullanıcı cevaplarını yeni oturuma iletir.
5. Çalışan devir notu yazamıyorsa (bozuk ya da limitte) Merkez beklemez. Yeni oturum, kayıt dalındaki durum belgesinden ve son `list_events` özetinden açılır. Merkez notta eksik kalanı açılış mesajına ekler.

## Akış — 3K Merkez
1. Merkez `claude/merkez-kayit` dalına `docs/merkez-devir.md` yazar. Notta şunlar olur: çalışanların oturumları, bekleyen onaylar ve kime ait oldukları, iletilmemiş mesajlar, açık işler, zamanlanmış görev kimlikleri.
2. `create_session` ile yeni Merkez açar: aynı ortam, `model:"claude-sonnet-5-5"`, `title:"3K Merkez · <gün ay>"`, prompt aşağıdaki **Merkez açılış metni**.
3. Yeni Merkez "hazır" deyince eski Merkez şunları yapar:
   - Kendi zamanlanmış görevlerini siler: günlük özet, haftalık özet, devir kontrolü. Yeni Merkez bunları kendine yeniden kurar.
   - Panel izlemesini bırakır.
   - `calisanlar/merkez.oturum` alanının güncellendiğini doğrular.
4. Çalışanlar Merkez'i her zaman `calisanlar/merkez.oturum` alanından bulur, kimlik ezbere yazılmaz.

## Limit (kullanım sınırı) durumları
- 5 saatlik sınır devir sebebi değildir. Oturum sağlamsa sınır sıfırlanınca aynı oturum devam eder.
- Haftalık sınır uyarıdaysa Merkez `butce/claude` kalemini sarıya çeker ve yeni ağır işleri kullanıcıya sorar.
- Sınır sonrası "devam", yalnız kullanıcının önceden onayladığı iş içindir (ör. süresi geçmemiş gece taraması). Yeni iş yine onaya gider.

## Çalışan açılış metni (Merkez bunu doldurup gönderir)
```
<Ad>'e kaldığın yerden devam et. `<skill>` ve `3k-sistem` skill'lerini kullan (devir.md dahil).
Bu bir devir: önceki oturum <eski-id>. Önce kayıt dalındaki docs/<ad>-devir.md ve durum belgesini oku.
Proje panelini izle (ArtifactComments watch <panel-url>); notta açık zamanlanmış görev varsa kendine yeniden kur (create_trigger, aynı ad/saat/prompt).
3K Merkez (https://claude.ai/artifact/RxQ3VJCi6xneTNo88n7s7z): calisanlar/<ad> = {oturum:<senin id'n>, durum, gorev, guncelleme} yaz; her grup/iş bitince ve beklemede projeler/<ad>, calisanlar/<ad>, akis kayıtlarını tek batch ile güncelle.
Bağlam kuralı: 250 binde yeni büyük iş başlatma, grup sonunda devir notunu yaz ve Merkez'e "devir-hazir" bildir; 400 binde hemen (devir.md).
Hazır olunca panele "hazır" yaz, Merkez'e bildir. <Varsa: bekleyen kullanıcı cevabı / sıradaki iş.> Grup sonunda dur.
```

## Merkez açılış metni
```
Sen 3K Merkez yöneticisisin. `.claude/skills/3k-sistem/` altındaki SKILL.md, merkez.md, devir.md ve projeler.md'yi oku, kuralları aynen uygula.
Bu bir devir: önceki Merkez <eski-id>. `claude/merkez-kayit` dalındaki docs/merkez-devir.md'yi oku.
Paneli izle (ArtifactComments watch https://claude.ai/artifact/RxQ3VJCi6xneTNo88n7s7z); calisanlar/merkez.oturum'a kendi id'ni yaz.
Zamanlanmış görevlerini kendine kur (merkez.md → Zamanlanmış görevler). Hazır olunca eski Merkez'e send_message ile "hazır" de ve panel sohbetine kısa not yaz.
```
