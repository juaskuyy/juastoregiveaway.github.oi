// ==========================
// FIREBASE JUASTORE GIVEAWAY
// ==========================

import { initializeApp } 
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"; 

import { 
getDatabase, 
ref, 
get, 
update, 
remove 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC5yGP6DEjbTPTfGXtBYGF-FuFDWSLu1M8",
  authDomain: "juastore-giveaway-a7bd4.firebaseapp.com",
  databaseURL: "https://juastore-giveaway-a7bd4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "juastore-giveaway-a7bd4",
  storageBucket: "juastore-giveaway-a7bd4.firebasestorage.app",
  messagingSenderId: "449734844473",
  appId: "1:449734844473:web:5dcdff3c22d8d1b8daede8"
};
// ==========================
// INISIALISASI FIREBASE
// ==========================

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


// ==========================
// AMBIL DATA PRODUK
// ==========================

const produkRef = ref(db, "produk");

async function loadProduk() {

    const snapshot = await get(produkRef);

    if (!snapshot.exists()) {

        document.getElementById("produk").innerHTML =
        "<h2>Tidak ada produk giveaway</h2>";

        return;
    }


    const data = snapshot.val();

    const container =
    document.getElementById("produk");


    container.innerHTML = "";


    const total =
    Object.keys(data).length;


    document.getElementById("totalProduk")
    .innerHTML = total;


    for (let key in data) {


        let produk = data[key];


        let statusClass =
        produk.stok > 0 ? "ready" : "sold";


        let statusText =
        produk.stok > 0 ? "READY ✅" : "SOLD OUT ❌";


        container.innerHTML += `

        <div class="card">

        <h2>
        ${produk.nama}
        </h2>


        <p>
        Status:
        <span class="${statusClass}">
        ${statusText}
        </span>
        </p>


        <p>
        Stok tersisa:
        ${produk.stok}
        </p>


        <button
        onclick="claim('${key}')"
        ${produk.stok <= 0 ? "disabled" : ""}
        >

        🎁 CLAIM SEKARANG

        </button>


        </div>

        `;

    }

}


// Jalankan pertama kali
loadProduk();
// ==========================
// FUNGSI CLAIM PRODUK
// ==========================

window.claim = async function(namaProduk) {

    const produkPath = ref(db, "produk/" + namaProduk);

    const snapshot = await get(produkPath);


    if (!snapshot.exists()) {

        alert("Produk tidak ditemukan!");

        return;

    }


    const produk = snapshot.val();


    // Cek stok
    if (produk.stok <= 0) {

        alert("❌ Maaf, stok produk sudah habis!");

        return;

    }


    // Ambil daftar akun
    const daftarAkun = produk.akun;


    // Ambil akun pertama
    const keyAkun =
    Object.keys(daftarAkun)[0];


    const akun =
    daftarAkun[keyAkun];


    // Tampilkan detail akun
    let detail = "";


    // Untuk produk tipe invite
    if (produk.tipe == "invite") {


        detail = `
        🔗 Link Invite:
        <br><br>
        ${akun.link}
        `;


    }


    // Untuk produk tipe login
    else {


        detail = `
        📧 Username / Email:
        <br>
        ${akun.email}
        <br><br>

        🔑 Password:
        <br>
        ${akun.password}
        `;

    }


    // Tampilkan popup
    document.getElementById("detailAkun").innerHTML =
    detail;


    document.getElementById("popup").style.display =
    "flex";



    // Hapus akun yang sudah diambil
    await remove(
        ref(
            db,
            "produk/" +
            namaProduk +
            "/akun/" +
            keyAkun
        )
    );


    // Kurangi stok
    const sisa = produk.stok - 1;


    // Update stok & status
    await update(produkPath, {

        stok: sisa,

        status:
        sisa <= 0
        ? "sold out"
        : "ready"

    });


    // Refresh tampilan produk
    loadProduk();

};


// ==========================
// TUTUP POPUP
// ==========================

window.tutupPopup = function() {

    document.getElementById("popup").style.display =
    "none";

};