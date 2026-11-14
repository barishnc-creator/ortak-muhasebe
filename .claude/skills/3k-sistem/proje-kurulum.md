# 3K Sistemi — Yeni proje kurulumu

Kullanıcı "X için site yapacağız" / "şu siteye ürün ekleyeceğiz" dediğinde. Önce kısaca açıkla (ne kurulacak), **onay gelince** kur. 3K ve 3K Vael bu adımlarla kuruldu.

1. **Ad ve komut:** kısa proje adı (ör. "Vael"); komutlar "<Ad> ne durumda", "<Ad>'e kaldığın yerden devam et". Başka projeyle karışmayan bir kelime seç.
2. **Kayıt dalı:** `claude/<ad>-kayit` (main'den), `docs/<ad>-durum.md` — bölümler: Şu an (Aşama / Son yapılan / Bekleyen / Sıradaki adım), Bağlantılar, Çalışma kuralları, Kararlar, Nasıl yapılır, Geçmiş. Mod ve ilk aşama `asamalar.md`'den.
3. **Panel:** `panel-sablon.html`'i kopyala; değiştir: `<title>`, başlık (`<span>Ad</span> Kontrol Paneli`), eyebrow, "Vael" geçen komut metinleri → yeni ad, `STAGES` dizisi (moda göre aşama adları), "…yayında" bitiş kutusu, halka etiketleri, kısayol etiketleri. Yayınla (yeni dosya yolu → yeni URL), `capabilities: {db:{}, comments:{}, dictation:{}}`. Başlangıç verisi (tek batch): `panel/durum`, `panel/is`, `panel/limit`, `belgeler/durum`, `belgeler/rapor`, `sohbet/hosgeldin`.
4. **Proje skill'i:** `.claude/skills/<ad>/SKILL.md` — `vael` skill'ini örnek al: kayıt dalı, panel URL'si, projeye özel kurallar; genel yöntem için "bkz. `3k-sistem`". `CLAUDE.md`'ye bir bölüm ekle. `main`'e push (yalnız `.claude/`, `CLAUDE.md`).
5. **Proje listesi:** `projeler.md`'ye satır ekle.
6. **Yeni oturum:** `create_session` (repo ortak-muhasebe, etiket `<ad>`), prompt: "<Ad>'e kaldığın yerden devam et. <skill>'i kullan; paneli izle (ArtifactComments watch <url>); panele 'hazır' yaz; Sıradaki adımı yap; grup sonunda dur." Kuran oturum yeni paneli izlemeyi bırakır (`watch on:false`).
7. **Ortam:** aynı bulut ortamı (1688 aracı, anahtar, izinli siteler) kullanılır; yeni siteler için `update_environment` (kullanıcı onayı).
8. Kullanıcıya: panel linki + masaüstüne kurma (Chrome ⋮ → Yayınla, kaydet ve paylaş → Kısayol oluştur → Pencere olarak aç).
