
firebase.initializeApp(window.firebaseConfig);
const db=firebase.firestore(),$=id=>document.getElementById(id);
function setMessage(text,type='error'){const el=$('message');el.textContent=text;el.className=`message ${type}`}
function fillResult(data,code){
  $('resultProduct').textContent=data.product||'-';$('resultProduct2').textContent=data.product||'-';
  $('resultDuration').textContent=data.duration||'-';$('resultEmail').textContent=data.accountEmail||'-';
  $('resultPassword').textContent=data.accountPassword||'-';$('resultPin').textContent=data.accountPin||'-';
  $('resultCode').textContent=code;$('resultNotes').textContent=data.accountNotes||'-';
  $('resultSection').classList.remove('hidden');$('message').classList.add('hidden');
  window.scrollTo({top:$('resultSection').offsetTop-20,behavior:'smooth'});
}
async function redeem(){
  const code=$('giveawayCode').value.trim().toUpperCase();
  if(!/^JS-GW-[A-Z0-9]{6,12}$/.test(code)){setMessage('Masukkan kode giveaway yang valid, contoh JS-GW-8K4P7X.');return}
  $('redeemBtn').disabled=true;$('resultSection').classList.add('hidden');
  try{
    const ref=db.collection('giveaways').doc(code);
    const result=await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);if(!snap.exists)throw new Error('Kode giveaway tidak ditemukan.');
      const data=snap.data();
      if(data.status==='redeemed')throw new Error('Kode giveaway sudah pernah diredeem.');
      if(data.status==='disabled')throw new Error('Kode giveaway sedang dinonaktifkan.');
      tx.update(ref,{status:'redeemed',redeemedAt:firebase.firestore.FieldValue.serverTimestamp()});
      return data;
    });
    fillResult(result,code);
  }catch(err){setMessage(err.message||'Redeem gagal. Silakan coba kembali.')}
  finally{$('redeemBtn').disabled=false}
}
function detailText(){return `🎉 GIVEAWAY JUASTORE

📦 Produk: ${$('resultProduct2').textContent}
⏳ Durasi: ${$('resultDuration').textContent}
📧 Email/Username: ${$('resultEmail').textContent}
🔑 Password: ${$('resultPassword').textContent}
👤 PIN/Profil: ${$('resultPin').textContent}
🎟 Kode Giveaway: ${$('resultCode').textContent}

📝 Catatan:
${$('resultNotes').textContent}

⚠️ Simpan detail akun ini. Kode giveaway hanya dapat digunakan satu kali.

JuaStore — Premium Apps & Top Up Game`}
$('redeemBtn').addEventListener('click',redeem);
$('giveawayCode').addEventListener('keydown',e=>{if(e.key==='Enter')redeem()});
$('copyBtn').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(detailText());$('copyBtn').textContent='Berhasil Disalin ✓';setTimeout(()=>$('copyBtn').textContent='Salin Detail Akun',1800)}
  catch{alert('Gagal menyalin. Tekan lama pada detail akun lalu salin manual.')}
});
$('saveImageBtn').addEventListener('click',async()=>{
  const btn=$('saveImageBtn');btn.disabled=true;btn.textContent='Membuat Foto...';
  try{const canvas=await html2canvas($('accountCard'),{scale:2,backgroundColor:'#171a20'});const link=document.createElement('a');link.download=`giveaway-${$('resultCode').textContent}.png`;link.href=canvas.toDataURL('image/png');link.click()}
  catch{alert('Gagal menyimpan foto. Silakan gunakan screenshot layar.')}
  finally{btn.disabled=false;btn.textContent='Simpan sebagai Foto'}
});
