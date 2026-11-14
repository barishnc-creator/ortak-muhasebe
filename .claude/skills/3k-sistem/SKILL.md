---
name: 3k-sistem
description: 3K Sistemi — kullanıcının e-ticaret iş modelinin ana yöntemi (Kanıtla · Kur · Kazan). Kullanıcı "şu ürün için site yapacağız", "yeni proje", "X için mağaza kur", "şu siteye ürün ekleyeceğiz", "yeni iş" dediğinde ya da bir projenin hangi aşamada olduğunu, sıradaki aşamayı, genel yöntemi sorduğunda kullan. Mevcut projeler (3K Bikini, 3K Vael) kendi skill'lerini (3k = 3K Bikini, vael = 3K Vael) bununla birlikte kullanır.
---

# 3K Sistemi — Kanıtla · Kur · Kazan

Kullanıcının **iş sektörünün kendisi**: yurt dışında kanıtlanmış ürünleri bulup 1688'den tedarik ederek kendi Shopify mağazasında satmak. Her proje bu sistemin bir uygulamasıdır; her projede öğrenilen her şey buraya geri işlenir. Kullanıcı yalnızca **"şu ürün için site yapacağız"** der; gerisini bu sistem baştan sona, aşama aşama yürütür.

## Dosyalar (bu klasör)
- `asamalar.md` — iş akışının aşamaları, her aşamanın girdisi/çıktısı/onay kapısı. **İki mod:** A) Yeni site kur (0→5), B) Mevcut siteyi geliştir/ürün ekle.
- `moduller.md` — yeniden kullanılabilir yöntemler (rakip bulma, reklam ölçme, ürün çekme, 1688 eşleştirme, görsel doğrulama, fotoğraf ölçütü, fiyatlama, Shopify taslak yükleme, panel, gece işi). Doğrulanmış komutlar ve dersler burada.
- `proje-kurulum.md` — yeni proje açma adımları (panel, kayıt dalı, proje skill'i, yeni oturum).
- `projeler.md` — tüm projelerin listesi (ad, komut, panel, kayıt dalı, aşama).
- `panel-sablon.html` — yönetim paneli şablonu (yeni projede kopyalanır).
- `devir.md` — oturum devri: eşikler, akış, açılış metinleri (tüm oturumlar uyar).
- `merkez.md` — 3K Merkez yönetici oturumunun görevleri ve zamanlanmış görevleri.

## Kullanıcı yeni iş verdiğinde ("X için site yapacağız")
1. `projeler.md`'yi oku; aynı iş varsa onun skill'iyle devam et.
2. Yoksa modu belirle: yeni mağaza → **Mod A**; var olan mağazaya ürün/geliştirme → **Mod B**. Emin değilsen tek soru sor.
3. `proje-kurulum.md`'yi uygula (onay al: "şunları kuracağım" diye kısaca açıkla, onay gelince kur).
4. Yeni projenin oturumu `asamalar.md`'deki aşamaları sırayla yürütür; her aşama sonunda onay kapısı.

## Değişmez çalışma kuralları (her projede)
1. **Kendi kafana göre karar verme.** İşi gruplar halinde yap; her grup sonunda dur, panelde Rapor + sohbet özeti, "devam" bekle.
2. **Onay kapıları:** para harcama, hesap açma, dışarıya yayın, Shopify'a her yazma (ürün ekleme/değiştirme/fiyat/yayına alma/tema), aşama değiştirme. Okumak serbest.
3. **Araçları sormadan kullan;** "olmuyor" demeden tüm alternatifleri tara (skill'ler, GitHub, ücretsiz yollar), en iyi çözümü kanıtıyla sun. **Ücretsiz yol önce.**
4. **Her şey panelden:** kullanıcı yalnız proje panelini kullanır; dış sekme açtırma. Panel mesajları paneli izleyen oturuma gelir.
5. **Tek kayıt yeri:** her projenin tek durum belgesi (kayıt dalında). Her ilerlemeden sonra sorulmadan güncelle + push; paneli de güncelle.
6. **Token tasarrufu (zorunlu):** ağır iş (tarama, 1688, görsel kontrol) alt ajanda (ucuz model), ana oturum ince; büyük çıktı dosyaya; panel yazmaları tek batch; bağlam eşiğinde (çalışan 250–400 bin, Merkez 300 bin) `devir.md`'ye göre yeni oturuma devret; devri Merkez yönetir.
7. **Kullanım koruma (kullanıcı kararı 14 Kas, kesin):** Kullanım sınırını boşa harcatan hiçbir şey yapılmaz ve önerilmez. Çalışan bir oturumda model değiştirilmez/değiştirilmesi istenmez (tüm bağlam yeniden okunur); model değişikliği yalnız devirde, yeni oturum açılırken yapılır. Oturumu yeniden başlatma, paneli süs için yeniden yayınlama, aynı belgeyi tekrar tekrar okuma, büyük çıktılı araç çağrısı yok. Maliyeti belirgin her adımdan önce kullanıcıya maliyetiyle birlikte sor.
8. **Yöntem ortak, veriler ayrı:** projelerin verileri birbirine karışmaz; yöntem ve dersler bu skill'de ortaktır.
9. **Ders kaydı:** bir projede doğrulanan her yeni yöntem/kural `moduller.md`'ye (genel) ve projenin durum belgesine (özel) yazılır, `main`'e push edilir.

## Kullanıcının kalıcı tercihleri (tüm projeler)
- Türkçe, sade, kısa; ayrıntı panelde Rapor'da.
- Görseller premium: canlı modelde giyili, temiz arka plan (deepatelier ayarı).
- Küçük mağazalara takılma; büyük/güçlü kaynaklara öncelik.
- Satış fiyatlarını kullanıcı belirler; varsayılan kural projeye göre (bkz. moduller.md → Fiyatlama).
- Shopify'a önce TASLAK; yayına alma her zaman kullanıcıda.

Ayrıca:
- **Onay ve soru:** Kullanıcıdan karar gerekince proje panelinin `onaylar`'ına ek olarak Merkez'e bildir (`projeler/<ad>.onay` sayısı). Merkez bunu `onaylar`'a ekler, kararı sana iletir.
- **Bağlam:** Her grup sonunda `get_session` ile kendi bağlamına bak. 250 binde yeni büyük iş başlatma, 400 binde hemen devret (`devir.md`). Devir notunu `anthropic-skills:devir-notu` ile yaz, Merkez'e `calisanlar/<ad>.durum:"devir-hazir"` yaz. Yeni oturumu Merkez açar.
- Merkez'in oturum kimliği her zaman `calisanlar/merkez.oturum` alanındadır.

## Uyandırma kuralı (14 Kas, token)
Her `send_message` karşı oturumu uyandırır ve o oturumun tüm bağlamı yeniden okunur. Bu yüzden:
- Çalışan olağan ilerlemeyi YALNIZ Merkez veritabanına yazar (yazmak kimseyi uyandırmaz). Merkez'e `send_message` yalnız `devir-hazir`, engel/hata ya da kullanıcı kararı gereken yeni bir soru için atılır.
- Merkez, çalışandan gelen bilgi mesajına cevap yazmaz; yalnız kullanıcının talimatını ya da kararını iletir.
- Projeye özel kararlar proje panelinden verilir (yalnız o çalışan uyanır). Merkez paneli genel işler ve projeler arası konular içindir.
- Devredilen eski oturum hemen arşivlenir. Mesajlar `calisanlar/merkez.oturum` alanındaki güncel Merkez'e gider.
