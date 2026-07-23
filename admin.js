
firebase.initializeApp(window.firebaseConfig);
const auth=firebase.auth(),db=firebase.firestore(),$=id=>document.getElementById(id);
let editingCode=null,allData=[];
function generateCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let out='JS-GW-';for(let i=0;i<7;i++)out+=chars[Math.floor(Math.random()*chars.length)];$('giveawayCodeAdmin').value=out}
function msg(id,text,type='error'){const el=$(id);el.textContent=text;el.className=`message ${type}`}
function resetForm(){editingCode=null;['product','duration','accountEmail','accountPassword','accountPin','accountNotes'].forEach(id=>$(id).value='');$('formTitle').textContent='Tambah Akun Giveaway';$('saveBtn').textContent='Simpan Giveaway';$('formMessage').classList.add('hidden');generateCode()}
function formatDate(v){if(!v)return'-';const d=v.toDate?v.toDate():new Date(v);return d.toLocaleString('id-ID')}
async function save(){
  const code=$('giveawayCodeAdmin').value.trim().toUpperCase();
  const data={product:$('product').value.trim(),duration:$('duration').value.trim(),accountEmail:$('accountEmail').value.trim(),accountPassword:$('accountPassword').value.trim(),accountPin:$('accountPin').value.trim(),accountNotes:$('accountNotes').value.trim()};
  if(!code||!data.product||!data.accountEmail||!data.accountPassword){msg('formMessage','Produk, email/username, password, dan kode giveaway wajib diisi.');return}
  $('saveBtn').disabled=true;
  try{
    if(editingCode){await db.collection('giveaways').doc(editingCode).update({...data,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})}
    else{const ref=db.collection('giveaways').doc(code);const existing=await ref.get();if(existing.exists)throw new Error('Kode giveaway sudah digunakan. Generate kode baru.');await ref.set({...data,code,status:'ready',createdAt:firebase.firestore.FieldValue.serverTimestamp(),redeemedAt:null})}
    msg('formMessage',editingCode?'Data berhasil diperbarui.':'Giveaway berhasil dibuat.','success');setTimeout(resetForm,900);
  }catch(e){msg('formMessage',e.message||'Gagal menyimpan data.')}
  finally{$('saveBtn').disabled=false}
}
function render(data){
  const q=$('adminSearch').value.trim().toLowerCase();const filtered=data.filter(x=>(x.code+' '+x.product+' '+x.accountEmail).toLowerCase().includes(q));
  $('giveawayList').innerHTML=filtered.length?filtered.map(x=>`
    <article class="giveaway-item">
      <div class="item-head"><div><h3>${x.product||'-'}</h3><p>${x.code}</p></div><span class="badge ${x.status}">${String(x.status||'ready').toUpperCase()}</span></div>
      <div class="item-meta"><div><small>AKUN</small><b>${x.accountEmail||'-'}</b></div><div><small>DURASI</small><b>${x.duration||'-'}</b></div><div><small>REDEEM</small><b>${formatDate(x.redeemedAt)}</b></div></div>
      <div class="item-actions"><button class="secondary edit-btn" data-code="${x.code}" type="button">Edit</button><button class="secondary status-btn" data-code="${x.code}" type="button">${x.status==='disabled'?'Aktifkan':'Nonaktifkan'}</button><button class="danger delete-btn" data-code="${x.code}" type="button">Hapus</button></div>
    </article>`).join(''):'<div class="message">Belum ada data giveaway.</div>';
  document.querySelectorAll('.edit-btn').forEach(b=>b.addEventListener('click',()=>editItem(b.dataset.code)));
  document.querySelectorAll('.status-btn').forEach(b=>b.addEventListener('click',()=>toggleStatus(b.dataset.code)));
  document.querySelectorAll('.delete-btn').forEach(b=>b.addEventListener('click',()=>deleteItem(b.dataset.code)));
}
function editItem(code){const x=allData.find(v=>v.code===code);if(!x)return;editingCode=code;['product','duration','accountEmail','accountPassword','accountPin','accountNotes'].forEach(id=>$(id).value=x[id]||'');$('giveawayCodeAdmin').value=code;$('formTitle').textContent='Edit Akun Giveaway';$('saveBtn').textContent='Simpan Perubahan';window.scrollTo({top:180,behavior:'smooth'})}
async function toggleStatus(code){const x=allData.find(v=>v.code===code);if(!x)return;const next=x.status==='disabled'?'ready':'disabled';await db.collection('giveaways').doc(code).update({status:next,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})}
async function deleteItem(code){if(!confirm(`Hapus giveaway ${code}?`))return;await db.collection('giveaways').doc(code).delete()}
function listen(){db.collection('giveaways').orderBy('createdAt','desc').onSnapshot(s=>{allData=s.docs.map(d=>({code:d.id,...d.data()}));$('totalCount').textContent=allData.length;$('readyCount').textContent=allData.filter(x=>x.status==='ready').length;$('redeemedCount').textContent=allData.filter(x=>x.status==='redeemed').length;render(allData)},e=>msg('formMessage','Gagal membaca data: '+e.message))}
$('loginBtn').addEventListener('click',async()=>{try{await auth.signInWithEmailAndPassword($('loginEmail').value.trim(),$('loginPassword').value)}catch(e){msg('loginMessage',e.message)}});
$('logoutBtn').addEventListener('click',()=>auth.signOut());$('generateCodeBtn').addEventListener('click',generateCode);$('resetBtn').addEventListener('click',resetForm);$('saveBtn').addEventListener('click',save);$('adminSearch').addEventListener('input',()=>render(allData));
auth.onAuthStateChanged(user=>{$('loginSection').classList.toggle('hidden',!!user);$('adminSection').classList.toggle('hidden',!user);$('logoutBtn').classList.toggle('hidden',!user);if(user){resetForm();listen()}});
