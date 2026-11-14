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
6. **Token tasarrufu (zorunlu):** ağır iş (tarama, 1688, görsel kontrol) alt ajanda (ucuz model), ana oturum ince; büyük çıktı dosyaya; panel yazmaları tek batch; hafıza %50'yi geçince yeni oturuma devret.
7. **Yöntem ortak, veriler ayrı:** projelerin verileri birbirine karışmaz; yöntem ve dersler bu skill'de ortaktır.
8. **Ders kaydı:** bir projede doğrulanan her yeni yöntem/kural `moduller.md`'ye (genel) ve projenin durum belgesine (özel) yazılır, `main`'e push edilir.

## Kullanıcının kalıcı tercihleri (tüm projeler)
- Türkçe, sade, kısa; ayrıntı panelde Rapor'da.
- Görseller premium: canlı modelde giyili, temiz arka plan (deepatelier ayarı).
- Küçük mağazalara takılma; büyük/güçlü kaynaklara öncelik.
- Satış fiyatlarını kullanıcı belirler; varsayılan kural projeye göre (bkz. moduller.md → Fiyatlama).
- Shopify'a önce TASLAK; yayına alma her zaman kullanıcıda.
