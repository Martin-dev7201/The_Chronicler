/* accueil.js — V3 desktop / Collection
   Lit encore vv_items dans localStorage pour préserver la version actuelle.
   La migration Supabase viendra ensuite. */

const v3Grid = document.querySelector('#collectionGrid');
const v3Empty = document.querySelector('#emptyState');
const v3Count = document.querySelector('#vinylCount');
const v3Search = document.querySelector('#collectionSearch');
const v3GlobalSearch = document.querySelector('#globalSearch');
const v3Sort = document.querySelector('#sortSelect');

function readCurrentCollection(){
  try{
    const parsed = JSON.parse(localStorage.getItem('vv_items') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  }catch(error){
    console.error('Lecture collection :', error);
    return [];
  }
}

function safeText(value){
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  })[char]);
}

function normalized(item){
  return [
    item.artist, item.title, item.genre, item.year,
    item.label, item.catalogNumber, item.country
  ].filter(Boolean).join(' ').toLowerCase();
}

function sortedItems(items){
  const copy = [...items];
  switch(v3Sort.value){
    case 'artist':
      return copy.sort((a,b)=>(a.artist||'').localeCompare(b.artist||'','fr'));
    case 'title':
      return copy.sort((a,b)=>(a.title||'').localeCompare(b.title||'','fr'));
    case 'year-desc':
      return copy.sort((a,b)=>(Number(b.year)||0)-(Number(a.year)||0));
    case 'year-asc':
      return copy.sort((a,b)=>(Number(a.year)||9999)-(Number(b.year)||9999));
    default:
      return copy.sort((a,b)=>{
        const da = new Date(a.added || 0).getTime();
        const db = new Date(b.added || 0).getTime();
        return db-da;
      });
  }
}

function cardHTML(item,index){
  const cover = item.cover
    ? `<img src="${safeText(item.cover)}" alt="Pochette de ${safeText(item.title || 'vinyle')}" loading="lazy">`
    : `<div class="cover-placeholder">◎</div>`;

  const meta = [item.year, item.genre].filter(Boolean)
    .map(value=>`<span>${safeText(value)}</span>`).join('');

  return `
    <article class="vinyl-card" data-index="${index}" tabindex="0">
      <div class="cover-wrap">${cover}</div>
      <strong class="card-title">${safeText(item.title || 'Sans titre')}</strong>
      <div class="card-artist">${safeText(item.artist || 'Artiste inconnu')}</div>
      <div class="card-meta">${meta}</div>
    </article>`;
}

function renderCollection(){
  const collection = readCurrentCollection();
  const query = v3Search.value.trim().toLowerCase();
  const filtered = collection.filter(item => !query || normalized(item).includes(query));
  const displayed = sortedItems(filtered);

  v3Count.textContent = collection.length;
  v3Grid.innerHTML = displayed.map(cardHTML).join('');
  v3Empty.hidden = displayed.length !== 0;

  document.querySelectorAll('.vinyl-card').forEach(card=>{
    const open = () => {
      const item = displayed[Number(card.dataset.index)];
      if(!item) return;
      const id = item.id ?? item.discogsId ?? card.dataset.index;
      location.href = `vinyl.html?id=${encodeURIComponent(id)}`;
    };
    card.addEventListener('click', open);
    card.addEventListener('keydown', e => {
      if(e.key === 'Enter' || e.key === ' ') open();
    });
  });
}

v3Search.addEventListener('input', renderCollection);
v3Sort.addEventListener('change', renderCollection);
document.querySelector('#clearFilters').addEventListener('click',()=>{
  v3Search.value='';
  v3Sort.value='recent';
  renderCollection();
});

v3GlobalSearch.addEventListener('input',()=>{
  v3Search.value=v3GlobalSearch.value;
  renderCollection();
});
document.addEventListener('keydown',event=>{
  if((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='k'){
    event.preventDefault();
    v3GlobalSearch.focus();
  }
});

/* ----- état de connexion Supabase ----- */
const accountButton = document.querySelector('#accountButton');
const accountMenu = document.querySelector('#accountMenu');
const accountName = document.querySelector('#accountName');
const accountEmail = document.querySelector('#accountEmail');
const accountStatus = document.querySelector('#accountStatus');
const avatarInitial = document.querySelector('#avatarInitial');
const statusDot = document.querySelector('.status-dot');

function showAccount(session){
  const user = session?.user;
  if(!user){
    accountName.textContent='Non connecté';
    accountEmail.textContent='Aucune session';
    accountStatus.textContent='Hors ligne';
    avatarInitial.textContent='?';
    statusDot.classList.remove('online');
    return;
  }
  const email = user.email || 'Compte';
  const name = user.user_metadata?.display_name || email.split('@')[0];
  accountName.textContent=name;
  accountEmail.textContent=email;
  accountStatus.textContent='Connecté';
  avatarInitial.textContent=(name[0] || '?').toUpperCase();
  statusDot.classList.add('online');
}

accountButton.addEventListener('click',()=>{accountMenu.hidden=!accountMenu.hidden});
document.addEventListener('click',event=>{
  if(!accountButton.contains(event.target) && !accountMenu.contains(event.target)){
    accountMenu.hidden=true;
  }
});

document.querySelector('#logoutButton').addEventListener('click',async()=>{
  const {error}=await supabaseClient.auth.signOut();
  if(error){console.error(error);return}
  location.href='index.html';
});

supabaseClient.auth.getSession().then(({data})=>{
  showAccount(data.session);
  if(!data.session){
    /* Pendant la construction V3 on laisse la page visible,
       mais l'état "Non connecté" est clairement affiché. */
  }
});
supabaseClient.auth.onAuthStateChange((_event,session)=>showAccount(session));

renderCollection();
