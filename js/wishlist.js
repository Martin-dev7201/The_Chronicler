const $w=s=>document.querySelector(s);
const WISH_KEY="vv_wishlist";

function readWish(){try{const v=JSON.parse(localStorage.getItem(WISH_KEY)||"[]");return Array.isArray(v)?v:[]}catch{return[]}}
function saveWish(items){localStorage.setItem(WISH_KEY,JSON.stringify(items))}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
let wishes=readWish();

function filteredWishes(){
  const q=$w("#wishSearch").value.trim().toLowerCase();
  let list=wishes.filter(x=>!q||[x.artist,x.title,x.genre,x.year,x.note].filter(Boolean).join(" ").toLowerCase().includes(q));
  const sort=$w("#wishSort").value;
  list=[...list];
  if(sort==="artist")list.sort((a,b)=>(a.artist||"").localeCompare(b.artist||"","fr"));
  else if(sort==="title")list.sort((a,b)=>(a.title||"").localeCompare(b.title||"","fr"));
  else if(sort==="year-desc")list.sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
  else list.sort((a,b)=>new Date(b.added||0)-new Date(a.added||0));
  return list;
}

function renderWish(){
  const list=filteredWishes();
  $w("#wishCount").textContent=wishes.length;
  $w("#visibleWishCount").textContent=list.length;
  $w("#wishlistEmpty").hidden=list.length!==0;
  $w("#wishlistGrid").innerHTML=list.map(item=>`
    <article class="wish-card" data-id="${esc(item.id)}">
      <div class="wish-cover">
        ${item.cover?`<img src="${esc(item.cover)}" alt="Pochette de ${esc(item.title)}">`:`<div class="cover-placeholder">♡</div>`}
        <div class="wish-card-actions">
          <button class="wish-own" title="Ajouter à la collection">✓</button>
          <button class="wish-delete" title="Retirer de la liste">×</button>
        </div>
      </div>
      <strong>${esc(item.title)}</strong>
      <span>${esc(item.artist)}</span>
      <div class="wish-meta">${item.year?`<span>${esc(item.year)}</span>`:""}${item.genre?`<span>${esc(item.genre)}</span>`:""}</div>
      ${item.note?`<p>${esc(item.note)}</p>`:""}
    </article>`).join("");

  document.querySelectorAll(".wish-delete").forEach(btn=>btn.onclick=e=>{
    const id=e.currentTarget.closest(".wish-card").dataset.id;
    wishes=wishes.filter(x=>String(x.id)!==id);saveWish(wishes);renderWish();
  });

  document.querySelectorAll(".wish-own").forEach(btn=>btn.onclick=e=>{
    const id=e.currentTarget.closest(".wish-card").dataset.id;
    const item=wishes.find(x=>String(x.id)===id);if(!item)return;
    const collection=(()=>{try{const v=JSON.parse(localStorage.getItem("vv_items")||"[]");return Array.isArray(v)?v:[]}catch{return[]}})();
    collection.unshift({...item,id:Date.now(),added:new Date().toISOString(),plays:0});
    localStorage.setItem("vv_items",JSON.stringify(collection));
    wishes=wishes.filter(x=>String(x.id)!==id);saveWish(wishes);renderWish();
  });
}

const modal=$w("#wishModal");
function openModal(){modal.hidden=false;$w("#wishArtist").focus()}
function closeModal(){modal.hidden=true;$w("#wishForm").reset()}
$w("#openWishModal").onclick=openModal;
$w("#emptyAddWish").onclick=openModal;
$w("#closeWishModal").onclick=closeModal;
$w("#cancelWish").onclick=closeModal;
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});

$w("#wishForm").addEventListener("submit",e=>{
  e.preventDefault();
  wishes.unshift({
    id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),
    artist:$w("#wishArtist").value.trim(),
    title:$w("#wishTitle").value.trim(),
    year:$w("#wishYear").value?Number($w("#wishYear").value):null,
    genre:$w("#wishGenre").value.trim(),
    cover:$w("#wishCover").value.trim(),
    note:$w("#wishNote").value.trim(),
    added:new Date().toISOString()
  });
  saveWish(wishes);closeModal();renderWish();
});

$w("#wishSearch").addEventListener("input",renderWish);
$w("#wishSort").addEventListener("change",renderWish);
$w("#globalSearch").addEventListener("input",()=>{$w("#wishSearch").value=$w("#globalSearch").value;renderWish()});
document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$w("#globalSearch").focus()}
  if(e.key==="Escape"&&!modal.hidden)closeModal();
});

/* Compte Supabase */
const menu=$w("#accountMenu");
$w("#accountButton").onclick=()=>menu.hidden=!menu.hidden;
function account(session){
  const u=session?.user,n=u?.user_metadata?.display_name||u?.email?.split("@")[0];
  $w("#accountName").textContent=n||"Non connecté";$w("#accountEmail").textContent=u?.email||"Aucune session";
  $w("#accountStatus").textContent=u?"Connecté":"Hors ligne";$w("#avatarInitial").textContent=n?.[0]?.toUpperCase()||"?";
  $w(".status-dot").classList.toggle("online",!!u);
}
supabaseClient.auth.getSession().then(({data})=>account(data.session));
supabaseClient.auth.onAuthStateChange((_,s)=>account(s));
$w("#logoutButton").onclick=async()=>{const{error}=await supabaseClient.auth.signOut();if(!error)location.href="connexion.html"};

renderWish();
