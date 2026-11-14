# Ortak Muhasebe

Bu depo ortak muhasebe uygulamasıdır.

## 3K Sistemi (ana yöntem)

Kullanıcının e-ticaret iş modeli. "Şu ürün için site yapacağız", "yeni proje", "şu siteye ürün ekleyeceğiz" gibi isteklerde ve tüm 3K projelerinde `3k-sistem` skill'ini kullan (`.claude/skills/3k-sistem/`: aşamalar, modüller, proje kurulumu, proje listesi, panel şablonu).

## 3K projesi

Kullanıcı "3K" derse (ör. "3K ne durumda", "3K'ye kaldığın yerden devam et") `3k` skill'ini kullan (`.claude/skills/3k/SKILL.md`). 3K, muhasebe uygulamasından ayrı bir iç çamaşırı e-ticaret projesidir. Notları `claude/lingerie-ecommerce-planning-sw8cx4` dalındadır. Skill bu dalı kendisi bulur ve okur; kullanıcıdan dal ya da belge adı isteme.

## 3K Vael

Kullanıcı "Vael" derse (ör. "Vael ne durumda", "Vael'e kaldığın yerden devam et") `vael` skill'ini kullan (`.claude/skills/vael/SKILL.md`). Vael Maison sitesini geliştirme işi; notları `claude/vael-kayit` dalında. 3K ile yöntem ortak, veriler ayrı.
