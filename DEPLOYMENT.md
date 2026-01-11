# Cara Publish MyChat ke Internet 🌐

Biar teman-temanmu bisa pakai **MyChat**, kamu bisa menaruh website ini di internet. Caranya **GRATIS** dan gampang banget!

## Cara 1: Paling Gampang (Drag & Drop) 🚀
Cocok kalau kamu nggak mau ribet pake coding/git.

1. Buka [Netlify Drop](https://app.netlify.com/drop).
2. Di komputermu, cari folder `ghosting-analytics` (folder project ini).
3. **Tarik (Drag)** satu folder `ghosting-analytics` itu lalu **Lepas (Drop)** ke kotak di website Netlify tadi.
4. Tunggu sebentar... dan **BOOM!** Website kamu sudah online. 🎉
5. Kamu bakal dapet link aneh (contoh: `random-name-12345.netlify.app`). Kamu bisa ubah nama link-nya di `Site Settings > Change site name`.

### Cara Update Website 🔄
Kalau kamu ada perubahan baru (misal ganti warna atau nambah fitur):
1. Buka dashboard situs kamu di Netlify (login dulu).
2. Masuk ke menu **Deploys**.
3. Di sana ada kotak kosong bertuliskan *"Need to update your site? Drag and drop your output folder here"*.
4. **Drag & Drop ulang** folder `ghosting-analytics` kamu ke situ.
5. Selesai! Website otomatis ter-update dalam hitungan detik.

### Cara Pakai Domain Sendiri (Custom Domain) 🔗
Mau alamat keren kayak `chat.nabielherdiana.my.id`? Bisa!

> [!CAUTION]
> **Punya Website Lain?**
> Kalau domain utama kamu (`nabielherdiana.my.id`) sudah dipakai untuk website lain (Portfolio/Wordpress), **JANGAN** pakai domain utama. Nanti website lama kamu mati! 😱
> Gunakan **Subdomain** (contoh: `chat.nabielherdiana.my.id`) biar aman.

#### Langkah-langkah:

1. Di dashboard Netlify situs kamu, pilih **Domain Management** (atau *Domain Settings*).
2. Klik **Add a domain**.
2. Klik **Add a domain**.
3. Masukkan nama **Subdomain** kamu: `chat.nabielherdiana.my.id` (ganti `chat` sesuka hati).
4. Netlify bakal ngasih tau kamu harus setting DNS.
5. Buka tempat kamu beli domain (misal: Niagahoster, Domainesia, Namecheap dll).
6. Masuk ke pengaturan **DNS Management**.
7. Tambahkan **CNAME Record**:
7. Tambahkan **CNAME Record**:
   - **Name/Host**: `chat` (ini nama subdomainnya).
   - **Value/Points to**: Link netlify kamu (contoh: `mychatgueh.netlify.app`).
   - **TTL**: Default (atau 3600).
8. Simpan, tunggu beberapa menit, dan website kamu sudah bisa diakses lewat domain sendiri! ✨

### Khusus Pengguna Cloudflare ☁️
Kalau domain kamu diatur lewat Cloudflare, caranya mirip:
1. Masuk dashboard Cloudflare > Pilih domain kamu.
2. Klik menu **DNS** di kiri.
3. Klik **Add Record**.
   - **Type**: CNAME
   - **Name**: `chat` (ini akan jadi `chat.nabielherdiana.my.id`)
   - **Target**: Link netlify kamu (contoh: `mychatgueh.netlify.app`)
   - **Proxy status**: **Proxied** (Awan Oranye ☁️) itu Oke. Netlify support Cloudflare.
4. Save.

### 🆘 Netlify Minta Verifikasi? (TXT Record)
Kalau muncul pesan *"To verify ownership..."* dan dikasih **Host** & **Value**:

1. Lihat di Netlify:
   - **Host**: (biasanya `verified-for-netlify` atau `subdomain-owner-verification`)
   - **Value**: (kode panjang aneh-aneh)

2. Di Cloudflare, klik **Add Record**:
   - **Type**: `TXT`
   - **Name**: Paste isi **Host** tadi (misal: `subdomain-owner-verification`).
   - **Content**: Paste isi **Value** tadi.

3. Save.
4. Kembali ke Netlify, klik **Verify**.
5. Kalau sudah hijau/sukses, baru lanjut langkah CNAME (langkah 3 di atas).

Selesai! Tunggu 1-2 menit.

### 🔒 Website "Not Secure" / Tidak Aman?
Kalau pas dibuka muncul tulisan *"Connection is not secure"* atau gembok merah dicoret:

1. **JANGAN PANIK**, itu wajar karena sertifikat keamanan (SSL) baru dibuat.
2. Buka Dashboard Netlify > **Domain Management**.
3. Scroll ke bawah sampai ketemu **HTTPS**.
4. Kalau ada tombol **Verify DNS Configuration** atau **Provision Certificate**, KLIK tombol itu.
5. Tunggu 5-10 menit. Refresh halaman Netlify sampai statusnya **Active** (Hijau).
6. Setelah hijau, coba buka website kamu lagi (refresh atau clear cache). Pasti sudah aman! 🛡️

---

## Cara 2: GitHub Pages (Paling Rekomen) 🐙
Cocok kalau kamu sudah punya akun GitHub dan mau update-update terus.

1. Bikin repository baru di GitHub (misal: `mychat-app`).
2. Upload semua file project ini ke repository itu.
3. Buka tab **Settings** di repository GitHub kamu.
4. Scroll ke menu **Pages** (di menu kiri).
5. Di bagian **Build and deployment**, pilih `main` branch dan klik Save.
6. Tunggu 1-2 menit, link website kamu akan muncul di situ!

---

**PENTING! ⚠️**
Jangan lupa kasih tau teman-temanmu bahwa **Data Chat Mereka AMAN**. 
Aplikasi ini cuma jalan di browser mereka sendiri (Client-Side), jadi chat mereka **NGGAK** dikirim ke server kamu. Privasi terjaga! 🔒
