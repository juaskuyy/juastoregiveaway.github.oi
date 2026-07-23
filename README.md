# JuaStore Giveaway V1

Website giveaway berbasis Firebase Firestore dan GitHub Pages.

## Fitur
- Login admin Firebase Authentication.
- Admin memasukkan akun giveaway.
- Kode otomatis `JS-GW-XXXXXXX`.
- Satu akun memiliki satu kode giveaway.
- Customer dapat menyalin detail akun.
- Customer dapat menyimpan detail akun sebagai foto PNG.
- Link Bot Telegram dan Grup WhatsApp JuaStore.
- Tampilan JuaStore Premium Apps & Top Up Game.
- Tidak membutuhkan Firebase Blaze.

## Instalasi
1. Aktifkan Firebase Authentication Email/Password.
2. Buat akun admin di Authentication → Users.
3. Aktifkan Firestore.
4. Tempel konfigurasi Firebase ke `firebase-config.js`.
5. Tempel isi `firestore.rules` ke Firestore Rules lalu Publish.
6. Upload semua file ke GitHub Pages.

## Catatan keamanan
Versi tanpa server ini menggunakan transaksi Firestore sehingga redeem kedua ditolak oleh tampilan website. Untuk sistem satu kali yang benar-benar aman terhadap pengguna teknis, gunakan Cloud Functions/API server agar detail akun tidak pernah dapat dibaca setelah status redeemed.


## Fitur V3 Professional
- Bulk generator hingga 400 akun sekali proses.
- Salin semua kode Ready.
- Salin link redeem langsung per kode.
- Mode hadiah misteri.
- Jadwal aktif dan waktu kedaluwarsa.
- Pembatasan satu redeem per browser/perangkat.
- Dashboard status lengkap.
- Filter dan pencarian.
- Import dan export Excel.
- Edit, nonaktifkan, dan hapus akun.

Catatan: pembatasan perangkat memakai localStorage browser, bukan IP. Pengguna yang menghapus data browser dapat melewati pembatasan. Batas IP yang kuat memerlukan backend/Cloud Functions.
