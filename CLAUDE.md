# Ortak Muhasebe

Bu depo ortak muhasebe uygulamasıdır. **Depo herkese açıktır** ve uygulama GitHub Pages'te yayındadır (`barishnc-creator.github.io/ortak-muhasebe`).

## Gizlilik kuralı (kesin)

Bu depoya yalnız muhasebe uygulamasının kodu girer. Şunlar **asla** bu depoya yazılmaz (ne main'e ne başka bir dala):

- 3K Sistemi / 3K Bikini / 3K Vael ile ilgili her şey: skill'ler, ajanlar, durum ve devir notları, rakip/ürün/tedarikçi (1688) verisi, tablo linkleri, paneller.
- Gizli anahtar, şifre, token, davet kodu, müşteri bilgisi.

Supabase'in `sb_publishable_` anahtarı tasarım gereği açıktır; `service_role` ve diğer gizli anahtarlar yalnız Supabase Vault'ta durur.

`.github/workflows/gizlilik.yml` bu kuralı her push'ta kontrol eder.

## 3K işleri → gizli depo

Kullanıcı "Bikini", "3K", "Vael", "3K Merkez" derse ya da "şu ürün için site yapacağız", "yeni proje" gibi bir 3K işi isterse: bu işler gizli **`barishnc-creator/3k-isler`** deposundadır. Skill'ler (`3k`, `3k-sistem`, `vael`) ve notlar oradadır.

1. `add_repo` (owner `barishnc-creator`, repo `3k-isler`, access `push`).
2. `git clone --depth 1 https://github.com/barishnc-creator/3k-isler /home/user/3k-isler`, ardından `register_repo_root`.
3. O deponun `CLAUDE.md`'sine ve skill'lerine göre işi **o depodan** yürüt; bu depoya hiçbir şey yazma.

Yeni 3K oturumları doğrudan `source_url` https://github.com/barishnc-creator/3k-isler ile açılır.
