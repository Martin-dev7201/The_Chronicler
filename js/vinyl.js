/* THE_CHRONICLER — fiche vinyle V3 */
const $v=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
function readItems(){try{const v=JSON.parse(localStorage.getItem('vv_items')||'[]');return Array.isArray(v)?v:[]}catch(e){console.error('Collection :',e);return[]}}
const items=readItems();
const params=new URLSearchParams(location.search),requestedId=params.get('id'),requestedIndex=params.get('index');
function getVinylId(item){return item?.id??item?.discogs_id??item?.discogsId??null}
function findRequestedVinyl(){
  if(requestedIndex!==null&&requestedIndex!==''){const index=Number(requestedIndex);if(Number.isInteger(index)&&index>=0&&index<items.length)return{item:items[index],index};}
  if(requestedId!==null&&requestedId!==''){const index=items.findIndex(v=>String(getVinylId(v))===String(requestedId));if(index!==-1)return{item:items[index],index};}
  if(requestedId!==null&&requestedId!==''){const index=Number(requestedId);if(Number.isInteger(index)&&index>=0&&index<items.length)return{item:items[index],index};}
  return{item:null,index:-1};
}
const resolved=findRequestedVinyl(),item=resolved.item,itemIndex=resolved.index;
function value(...values){return values.find(v=>v!==undefined&&v!==null&&String(v).trim()!=='')??'—'}
function genres(input){return Array.isArray(input)?input:String(input||'').split(/[,;/]/).map(x=>x.trim()).filter(Boolean)}
function saveItems(){localStorage.setItem('vv_items',JSON.stringify(items))}

function render(){
  if(!item){$v('#vinylPage').hidden=true;$v('#vinylNotFound').hidden=false;console.error('Vinyle introuvable',{requestedId,requestedIndex,collectionLength:items.length});return;}
  $v('#vinylNotFound').hidden=true;$v('#vinylPage').hidden=false;
  document.title=`${value(item.title,'Vinyle')} — THE_CHRONICLER`;
  $v('#vinylTitle').textContent=value(item.title);$v('#vinylArtist').textContent=value(item.artist);$v('#vinylFormat').textContent=String(value(item.format,'VINYLE')).toUpperCase();
  $v('#vinylYear').textContent=value(item.year);$v('#vinylCountry').textContent=value(item.country);$v('#vinylLabel').textContent=value(item.label);$v('#vinylCatalog').textContent=value(item.catalog_number,item.catalogNumber);$v('#vinylEditionFormat').textContent=value(item.format);$v('#vinylColor').textContent=value(item.vinyl_color,item.vinylColor,'Noir');$v('#vinylPlays').textContent=Number(item.plays)||0;$v('#vinylDiscogsId').textContent=value(item.discogs_id,item.discogsId);
  if(item.added){const d=new Date(item.added);$v('#vinylAdded').textContent=Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'long',year:'numeric'}).format(d)}else{$v('#vinylAdded').textContent='—'}
  const cover=item.cover||item.disc_image||item.discImage;$v('#vinylCover').innerHTML=cover?`<img src="${esc(cover)}" alt="Pochette de ${esc(item.title||'vinyle')}">`:'<div class="cover-placeholder">◎</div>';
  const tags=[...genres(item.genre),...genres(item.styles||item.style)];$v('#vinylTags').innerHTML=[...new Set(tags)].slice(0,8).map(tag=>`<span>${esc(tag)}</span>`).join('');
  if(item.notes){$v('#vinylNotes').textContent=item.notes;$v('#vinylNotes').hidden=false}else{$v('#vinylNotes').hidden=true}
  const logo=item.artist_logo||item.artistLogo;if(logo){$v('#artistLogo').src=logo;$v('#artistLogo').hidden=false}else{$v('#artistLogo').hidden=true}
  if(Array.isArray(item.tracklist)&&item.tracklist.length){$v('#tracklist').innerHTML=item.tracklist.map((track,index)=>`<div class="track-row"><span>${esc(track.position||String(index+1).padStart(2,'0'))}</span><strong>${esc(track.title||'Sans titre')}</strong><small>${esc(track.duration||'')}</small></div>`).join('')}else{$v('#tracklist').innerHTML='<div class="mini-empty">La tracklist n\'est pas encore enregistrée pour cette édition.</div>'}
  const q=encodeURIComponent(`${item.artist||''} ${item.title||''}`.trim());$v('#streamingLinks').innerHTML=`<a href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">YouTube<span>↗</span></a><a href="https://open.spotify.com/search/${q}" target="_blank" rel="noopener">Spotify<span>↗</span></a><a href="https://music.apple.com/fr/search?term=${q}" target="_blank" rel="noopener">Apple Music<span>↗</span></a><a href="https://www.deezer.com/search/${q}" target="_blank" rel="noopener">Deezer<span>↗</span></a>`;
  const currentGenres=genres(item.genre).map(g=>g.toLowerCase());const suggestions=items.map((vinyl,index)=>({vinyl,index})).filter(r=>r.index!==itemIndex).map(r=>{let score=0;if(r.vinyl.artist&&item.artist&&r.vinyl.artist.toLowerCase()===item.artist.toLowerCase())score+=3;score+=genres(r.vinyl.genre).filter(g=>currentGenres.includes(g.toLowerCase())).length;return{...r,score}}).filter(r=>r.score>0).sort((a,b)=>b.score-a.score).slice(0,5);
  $v('#suggestionsGrid').innerHTML=suggestions.length?suggestions.map(({vinyl,index})=>{const p=new URLSearchParams();p.set('index',String(index));const id=getVinylId(vinyl);if(id!==null)p.set('id',String(id));const c=vinyl.cover||vinyl.disc_image||vinyl.discImage;return `<a class="suggestion-card" href="vinyl.html?${p.toString()}"><div>${c?`<img src="${esc(c)}" alt="">`:'<div class="cover-placeholder">◎</div>'}</div><strong>${esc(vinyl.title||'Sans titre')}</strong><span>${esc(vinyl.artist||'')}</span></a>`}).join(''):'<div class="mini-empty">Pas encore assez de vinyles similaires dans ta collection.</div>';
}

$v('#addPlay').addEventListener('click',()=>{if(!item)return;item.plays=(Number(item.plays)||0)+1;saveItems();$v('#vinylPlays').textContent=item.plays;});
const accountMenu=$v('#accountMenu');$v('#accountButton').addEventListener('click',()=>accountMenu.hidden=!accountMenu.hidden);
function displayAccount(session){const user=session?.user,name=user?.user_metadata?.display_name||user?.email?.split('@')[0];$v('#accountName').textContent=name||'Non connecté';$v('#accountEmail').textContent=user?.email||'Aucune session';$v('#accountStatus').textContent=user?'Connecté':'Hors ligne';$v('#avatarInitial').textContent=name?.[0]?.toUpperCase()||'?';$v('.status-dot').classList.toggle('online',Boolean(user));}
supabaseClient.auth.getSession().then(({data})=>displayAccount(data.session));supabaseClient.auth.onAuthStateChange((_event,session)=>displayAccount(session));$v('#logoutButton').addEventListener('click',async()=>{const{error}=await supabaseClient.auth.signOut();if(error){console.error(error);return;}location.href='connexion.html';});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$v('#globalSearch').focus();}});
render();
