firebase.initializeApp(window.firebaseConfig);
const auth=firebase.auth(),db=firebase.firestore(),$=id=>document.getElementById(id);
let editingCode=null,allData=[],unsubscribe=null;
const REDEEM_URL='https://juastoregiveaway.biz.id/';

function generateCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out='JS-GW-';
  for(let i=0;i<7;i++)out+=chars[Math.floor(Math.random()*chars.length)];
  return out;
}
function setCode(){$('giveawayCodeAdmin').value=generateCode()}
function msg(id,text,type='error'){const el=$(id);el.textContent=text;el.className=`message ${type}`}
function toDateValue(v){
  if(!v)return'';
  const d=v.toDate?v.toDate():new Date(v);
  const pad=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromInput(id){const v=$(id).value;return v?firebase.firestore.Timestamp.fromDate(new Date(v)):null}
function resetForm(){
  editingCode=null;
  ['product','duration','accountEmail','accountPassword','accountPin','accountNotes','activeFrom','expiresAt'].forEach(id=>$(id).value='');
  $('mysteryMode').checked=false;$('limitOneDevice').checked=true;
  $('formTitle').textContent='Tambah Satu Akun';$('saveBtn').textContent='Simpan Giveaway';
  $('formMessage').classList.add('hidden');setCode();
}
function computedStatus(x){
  const now=Date.now();
  const start=x.activeFrom?.toDate?.().getTime?.()||0;
  const end=x.expiresAt?.toDate?.().getTime?.()||0;
  if(x.status==='redeemed'||x.status==='disabled')return x.status;
  if(start&&now<start)return'scheduled';
  if(end&&now>end)return'expired';
  return'ready';
}
function formatDate(v){if(!v)return'-';const d=v.toDate?v.toDate():new Date(v);return d.toLocaleString('id-ID')}
async function save(){
  const code=$('giveawayCodeAdmin').value.trim().toUpperCase();
  const data={
    product:$('product').value.trim(),duration:$('duration').value.trim(),
    accountEmail:$('accountEmail').value.trim(),accountPassword:$('accountPassword').value.trim(),
    accountPin:$('accountPin').value.trim(),accountNotes:$('accountNotes').value.trim(),
    activeFrom:fromInput('activeFrom'),expiresAt:fromInput('expiresAt'),
    mysteryMode:$('mysteryMode').checked,limitOneDevice:$('limitOneDevice').checked
  };
  if(!code||!data.product||!data.accountEmail||!data.accountPassword){msg('formMessage','Produk, akun, password, dan kode wajib diisi.');return}
  $('saveBtn').disabled=true;
  try{
    if(editingCode){
      await db.collection('giveaways').doc(editingCode).update({...data,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    }else{
      const ref=db.collection('giveaways').doc(code),snap=await ref.get();
      if(snap.exists)throw new Error('Kode sudah ada. Generate kode baru.');
      await ref.set({...data,code,status:'ready',createdAt:firebase.firestore.FieldValue.serverTimestamp(),redeemedAt:null});
    }
    msg('formMessage',editingCode?'Data berhasil diperbarui.':'Giveaway berhasil dibuat.','success');
    setTimeout(resetForm,900);
  }catch(e){msg('formMessage',e.message||'Gagal menyimpan data.')}
  finally{$('saveBtn').disabled=false}
}
async function bulkCreate(){
  const lines=$('bulkData').value.split('\n').map(v=>v.trim()).filter(Boolean);
  if(!lines.length){msg('bulkMessage','Masukkan minimal satu baris data.');return}
  if(lines.length>400){msg('bulkMessage','Maksimal 400 akun sekali proses.');return}
  const parsed=lines.map((line,i)=>{
    const p=line.split('|').map(v=>v.trim());
    if(p.length<3||!p[0]||!p[1]||!p[2])throw new Error(`Format baris ${i+1} tidak lengkap.`);
    return {product:p[0],accountEmail:p[1],accountPassword:p[2],accountPin:p[3]||'',duration:p[4]||'',accountNotes:p[5]||''};
  });
  $('bulkCreateBtn').disabled=true;
  try{
    const batch=db.batch(),codes=[];
    parsed.forEach(item=>{
      const code=generateCode();codes.push(code);
      const ref=db.collection('giveaways').doc(code);
      batch.set(ref,{...item,code,status:'ready',createdAt:firebase.firestore.FieldValue.serverTimestamp(),redeemedAt:null,
        activeFrom:fromInput('bulkActiveFrom'),expiresAt:fromInput('bulkExpiresAt'),
        mysteryMode:$('bulkMysteryMode').checked,limitOneDevice:$('bulkLimitDevice').checked});
    });
    await batch.commit();
    msg('bulkMessage',`${codes.length} akun berhasil dibuat. Semua kode sudah masuk daftar Ready.`,'success');
    $('bulkData').value='';
  }catch(e){msg('bulkMessage',e.message||'Bulk generator gagal.')}
  finally{$('bulkCreateBtn').disabled=false}
}
function readyItems(){return allData.filter(x=>computedStatus(x)==='ready')}
function broadcastText(withLinks=false){
  const ready=readyItems();if(!ready.length)return'';
  let out='🎉 GIVEAWAY JUASTORE 🎉\n\n';
  out+=`🌐 Redeem: ${REDEEM_URL}\n\n`;
  ready.forEach((x,i)=>{
    const title=x.mysteryMode?'Hadiah Misteri':x.product;
    out+=`${i+1}. ${title}\n🎟 ${x.code}\n`;
    if(withLinks)out+=`🔗 ${REDEEM_URL}?code=${encodeURIComponent(x.code)}\n`;
    out+='\n';
  });
  return out+'⚠️ Satu kode hanya berlaku satu kali.\n⚡ Siapa cepat, dia dapat!\n\nJuaStore — Premium Apps & Top Up Game';
}
async function copyText(text,buttonId){
  if(!text){alert('Tidak ada kode READY.');return}
  await navigator.clipboard.writeText(text);
  const b=$(buttonId),old=b.textContent;b.textContent='Berhasil Disalin ✓';setTimeout(()=>b.textContent=old,1700);
}
function exportExcel(){
  if(!window.XLSX){alert('Library Excel belum termuat.');return}
  const rows=allData.map(x=>({
    Code:x.code,Product:x.product,Email:x.accountEmail,Password:x.accountPassword,PIN:x.accountPin,
    Duration:x.duration,Notes:x.accountNotes,Status:computedStatus(x),Mystery:x.mysteryMode?'YES':'NO',
    LimitDevice:x.limitOneDevice?'YES':'NO',ActiveFrom:formatDate(x.activeFrom),ExpiresAt:formatDate(x.expiresAt),
    RedeemedAt:formatDate(x.redeemedAt)
  }));
  const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Giveaways');
  XLSX.writeFile(wb,`JuaStore-Giveaway-${new Date().toISOString().slice(0,10)}.xlsx`);
}
async function importExcel(file){
  if(!file||!window.XLSX)return;
  const data=await file.arrayBuffer(),wb=XLSX.read(data),sheet=wb.Sheets[wb.SheetNames[0]];
  const rows=XLSX.utils.sheet_to_json(sheet,{defval:''});
  if(!rows.length){alert('File kosong.');return}
  if(rows.length>400){alert('Maksimal 400 baris per import.');return}
  const batch=db.batch();
  rows.forEach(r=>{
    const code=String(r.Code||r.code||generateCode()).trim().toUpperCase();
    const ref=db.collection('giveaways').doc(code);
    batch.set(ref,{
      code,product:String(r.Product||r.product||'').trim(),accountEmail:String(r.Email||r.email||'').trim(),
      accountPassword:String(r.Password||r.password||'').trim(),accountPin:String(r.PIN||r.pin||'').trim(),
      duration:String(r.Duration||r.duration||'').trim(),accountNotes:String(r.Notes||r.notes||'').trim(),
      status:'ready',mysteryMode:String(r.Mystery||'').toUpperCase()==='YES',
      limitOneDevice:String(r.LimitDevice||'YES').toUpperCase()!=='NO',
      activeFrom:null,expiresAt:null,redeemedAt:null,createdAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
  });
  await batch.commit();alert(`${rows.length} data berhasil diimport.`);
}
function render(){
  const q=$('adminSearch').value.trim().toLowerCase(),f=$('statusFilter').value;
  const filtered=allData.filter(x=>{
    const st=computedStatus(x);
    return (f==='all'||st===f)&&(`${x.code} ${x.product} ${x.accountEmail}`.toLowerCase().includes(q));
  });
  $('giveawayList').innerHTML=filtered.length?filtered.map(x=>{
    const st=computedStatus(x);
    return `<article class="giveaway-item">
      <div class="item-head"><div><h3>${x.product||'-'}</h3><p>${x.code}</p></div><span class="badge ${st}">${st.toUpperCase()}</span></div>
      <div class="item-meta">
        <div><small>AKUN</small><b>${x.accountEmail||'-'}</b></div>
        <div><small>DURASI</small><b>${x.duration||'-'}</b></div>
        <div><small>AKTIF</small><b>${formatDate(x.activeFrom)}</b></div>
        <div><small>EXPIRED</small><b>${formatDate(x.expiresAt)}</b></div>
      </div>
      <div class="item-actions">
        <button class="secondary copy-one" data-code="${x.code}" type="button">Copy Kode</button>
        <button class="secondary edit-btn" data-code="${x.code}" type="button">Edit</button>
        <button class="secondary status-btn" data-code="${x.code}" type="button">${x.status==='disabled'?'Aktifkan':'Nonaktifkan'}</button>
        <button class="danger delete-btn" data-code="${x.code}" type="button">Hapus</button>
      </div>
    </article>`}).join(''):'<div class="message">Tidak ada data yang cocok.</div>';
  document.querySelectorAll('.copy-one').forEach(b=>b.addEventListener('click',()=>copyText(`${REDEEM_URL}\nKode: ${b.dataset.code}`,null)));
  document.querySelectorAll('.edit-btn').forEach(b=>b.addEventListener('click',()=>editItem(b.dataset.code)));
  document.querySelectorAll('.status-btn').forEach(b=>b.addEventListener('click',()=>toggleStatus(b.dataset.code)));
  document.querySelectorAll('.delete-btn').forEach(b=>b.addEventListener('click',()=>deleteItem(b.dataset.code)));
}
function editItem(code){
  const x=allData.find(v=>v.code===code);if(!x)return;editingCode=code;
  ['product','duration','accountEmail','accountPassword','accountPin','accountNotes'].forEach(id=>$(id).value=x[id]||'');
  $('activeFrom').value=toDateValue(x.activeFrom);$('expiresAt').value=toDateValue(x.expiresAt);
  $('mysteryMode').checked=!!x.mysteryMode;$('limitOneDevice').checked=x.limitOneDevice!==false;
  $('giveawayCodeAdmin').value=code;$('formTitle').textContent='Edit Akun Giveaway';$('saveBtn').textContent='Simpan Perubahan';
  window.scrollTo({top:180,behavior:'smooth'});
}
async function toggleStatus(code){
  const x=allData.find(v=>v.code===code);if(!x)return;
  await db.collection('giveaways').doc(code).update({status:x.status==='disabled'?'ready':'disabled',updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
}
async function deleteItem(code){if(confirm(`Hapus ${code}?`))await db.collection('giveaways').doc(code).delete()}
function listen(){
  if(unsubscribe)unsubscribe();
  unsubscribe=db.collection('giveaways').orderBy('createdAt','desc').onSnapshot(s=>{
    allData=s.docs.map(d=>({code:d.id,...d.data()}));
    $('totalCount').textContent=allData.length;
    $('readyCount').textContent=allData.filter(x=>computedStatus(x)==='ready').length;
    $('redeemedCount').textContent=allData.filter(x=>computedStatus(x)==='redeemed').length;
    $('scheduledCount').textContent=allData.filter(x=>['scheduled','expired'].includes(computedStatus(x))).length;
    render();
  },e=>msg('formMessage','Gagal membaca data: '+e.message));
}
$('loginBtn').addEventListener('click',async()=>{try{await auth.signInWithEmailAndPassword($('loginEmail').value.trim(),$('loginPassword').value)}catch(e){msg('loginMessage',e.message)}});
$('logoutBtn').addEventListener('click',()=>auth.signOut());
$('generateCodeBtn').addEventListener('click',setCode);$('resetBtn').addEventListener('click',resetForm);
$('saveBtn').addEventListener('click',save);$('bulkCreateBtn').addEventListener('click',bulkCreate);
$('copyReadyCodesBtn').addEventListener('click',()=>copyText(broadcastText(false),'copyReadyCodesBtn'));
$('copyReadyLinksBtn').addEventListener('click',()=>copyText(broadcastText(true),'copyReadyLinksBtn'));
$('exportExcelBtn').addEventListener('click',exportExcel);
$('importExcelInput').addEventListener('change',e=>importExcel(e.target.files[0]).catch(err=>alert(err.message)));
$('adminSearch').addEventListener('input',render);$('statusFilter').addEventListener('change',render);
auth.onAuthStateChanged(user=>{
  $('loginSection').classList.toggle('hidden',!!user);$('adminSection').classList.toggle('hidden',!user);$('logoutBtn').classList.toggle('hidden',!user);
  if(user){resetForm();listen()}else if(unsubscribe){unsubscribe();unsubscribe=null}
});