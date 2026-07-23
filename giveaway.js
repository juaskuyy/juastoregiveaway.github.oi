firebase.initializeApp(window.firebaseConfig);
const db=firebase.firestore(),$=id=>document.getElementById(id);
function setMessage(text,type='error'){const e=$('message');e.textContent=text;e.className=`message ${type}`}
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
  if(!/^JS-GW-[A-Z0-9]{6,12}$/.test(code)){setMessage('Masukkan kode giveaway yang valid.');return}
  $('redeemBtn').disabled=true;$('resultSection').classList.add('hidden');
  try{
    const ref=db.collection('giveaways').doc(code);
    const result=await db.runTransaction(async tx=>{
      const snap=await tx.get(ref);if(!snap.exists)throw new Error('Kode giveaway tidak ditemukan.');
      const data=snap.data(),now=Date.now();
      if(data.status==='redeemed')throw new Error('Kode giveaway sudah pernah diredeem.');
      if(data.status==='disabled')throw new Error('Kode giveaway sedang dinonaktifkan.');
      const start=data.activeFrom?.toDate?.().getTime?.()||0,end=data.expiresAt?.toDate?.().getTime?.()||0;
      if(start&&now<start)throw new Error('Kode belum aktif. Silakan coba setelah jadwal dimulai.');
      if(end&&now>end)throw new Error('Kode giveaway sudah kedaluwarsa.');
      if(data.limitOneDevice!==false&&localStorage.getItem('juastore_device_redeemed')==='yes'){
        throw new Error('Perangkat/browser ini sudah pernah menggunakan giveaway.');
      }
      tx.update(ref,{status:'redeemed',redeemedAt:firebase.firestore.FieldValue.serverTimestamp()});
      return data;
    });
    if(result.limitOneDevice!==false)localStorage.setItem('juastore_device_redeemed','yes');
    fillResult(result,code);
  }catch(err){setMessage(err.message||'Redeem gagal.')}
  finally{$('redeemBtn').disabled=false}
}
function detailText(){return `🎉 GIVEAWAY JUASTORE

📦 Produk: ${$('resultProduct2').textContent}
⏳ Durasi: ${$('resultDuration').textContent}
📧 Email/Username: ${$('resultEmail').textContent}
🔑 Password: ${$('resultPassword').textContent}
👤 PIN/Profil: ${$('resultPin').textContent}
🎟 Kode: ${$('resultCode').textContent}

📝 Catatan:
${$('resultNotes').textContent}

JuaStore — Premium Apps & Top Up Game`}
$('redeemBtn').addEventListener('click',redeem);$('giveawayCode').addEventListener('keydown',e=>{if(e.key==='Enter')redeem()});
$('copyBtn').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(detailText());$('copyBtn').textContent='Berhasil Disalin ✓';setTimeout(()=>$('copyBtn').textContent='Salin Detail Akun',1600)}catch{alert('Gagal menyalin.')}});
$('saveImageBtn').addEventListener('click',async()=>{const b=$('saveImageBtn');b.disabled=true;b.textContent='Membuat Foto...';try{const c=await html2canvas($('accountCard'),{scale:2,backgroundColor:'#171a20'}),a=document.createElement('a');a.download=`giveaway-${$('resultCode').textContent}.png`;a.href=c.toDataURL('image/png');a.click()}catch{alert('Gunakan screenshot layar.')}finally{b.disabled=false;b.textContent='Simpan sebagai Foto'}});
const qs=new URLSearchParams(location.search).get('code');if(qs){$('giveawayCode').value=qs.toUpperCase()}