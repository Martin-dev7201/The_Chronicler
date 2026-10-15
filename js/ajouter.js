/* THE_CHRONICLER — ajout d'un vinyle V3 */
const $add=s=>document.querySelector(s);
const searchForm=$add('#releaseSearchForm'), barcodeInput=$add('#addBarcode'), artistInput=$add('#addArtist'), titleInput=$add('#addTitle'), searchButton=$add('#searchButton'), clearSearchButton=$add('#clearSearchButton'), resultsSection=$add('#resultsSection'), releaseResults=$add('#releaseResults'), resultCount=$add('#resultCount'), initialState=$add('#initialState'), addMessage=$add('#addMessage');
const accountButton=$add('#accountButton'), accountMenu=$add('#accountMenu'), accountName=$add('#accountName'), accountEmail=$add('#accountEmail'), accountStatus=$add('#accountStatus'), avatarInitial=$add('#avatarInitial'), statusDot=$add('.status-dot');

function safeText(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function showAddMessage(message,type='error'){addMessage.textContent=message;addMessage.className=`add-message ${type}`;addMessage.hidden=false;}
function hideAddMessage(){addMessage.hidden=true;addMessage.textContent='';addMessage.className='add-message';}
function setSearchLoading(loading){searchButton.disabled=loading;clearSearchButton.disabled=loading;barcodeInput.disabled=loading;artistInput.disabled=loading;titleInput.disabled=loading;searchButton.textContent=loading?'Recherche…':'Rechercher sur Discogs';}
function readCollection(){try{const v=JSON.parse(localStorage.getItem('vv_items')||'[]');return Array.isArray(v)?v:[]}catch(error){console.error('Lecture collection :',error);return[];}}
function saveCollection(collection){localStorage.setItem('vv_items',JSON.stringify(collection));}
function createLocalId(){return window.crypto&&typeof crypto.randomUUID==='function'?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);}

function showAccount(session){const user=session?.user;if(!user)return;const email=user.email||'Compte';const name=user.user_metadata?.display_name||email.split('@')[0];accountName.textContent=name;accountEmail.textContent=email;accountStatus.textContent='Connecté';avatarInitial.textContent=(name?.[0]||'?').toUpperCase();statusDot.classList.add('online');}
async function requireSession(){const {data,error}=await supabaseClient.auth.getSession();if(error||!data.session){if(error)console.error('Erreur session :',error);location.replace('connexion.html');return null;}showAccount(data.session);return data.session;}
accountButton.addEventListener('click',()=>accountMenu.hidden=!accountMenu.hidden);
document.addEventListener('click',e=>{if(!accountButton.contains(e.target)&&!accountMenu.contains(e.target))accountMenu.hidden=true;});
$add('#logoutButton').addEventListener('click',async()=>{const {error}=await supabaseClient.auth.signOut();if(error){console.error('Déconnexion :',error);return;}location.replace('connexion.html');});

function getSearchResultArtist(result){const t=String(result?.title||'');return t.includes(' - ')?t.split(' - ')[0].trim():'';}
function getSearchResultTitle(result){const t=String(result?.title||'');return t.includes(' - ')?t.split(' - ').slice(1).join(' - ').trim():(t||'Sans titre');}
function renderResults(results){
  resultCount.textContent=`${results.length} résultat${results.length>1?'s':''}`;resultsSection.hidden=false;initialState.hidden=true;
  if(!results.length){releaseResults.innerHTML='<div class="add-no-result"><strong>Aucun résultat.</strong><span>Essaie avec un autre artiste, titre ou code-barres.</span></div>';return;}
  releaseResults.innerHTML=results.map(result=>{
    const image=result.cover_image||result.thumb||'', artist=getSearchResultArtist(result), title=getSearchResultTitle(result), format=Array.isArray(result.format)?result.format.join(', '):(result.format||''), labels=Array.isArray(result.label)?result.label.join(', '):(result.label||'');
    return `<button type="button" class="release-result" data-release-id="${safeText(result.id)}"><div class="release-result-cover">${image?`<img src="${safeText(image)}" alt="" loading="lazy">`:'<div class="release-placeholder">◎</div>'}</div><div class="release-result-main"><span class="release-result-artist">${safeText(artist)}</span><strong>${safeText(title)}</strong><small>${safeText(labels)}</small></div><div class="release-result-meta"><span>${safeText(result.year||'—')}</span><span>${safeText(result.country||'—')}</span><span>${safeText(format||'Vinyl')}</span></div><span class="release-result-arrow">→</span></button>`;
  }).join('');
  document.querySelectorAll('.release-result').forEach(button=>button.addEventListener('click',()=>addDiscogsRelease(button.dataset.releaseId)));
}

async function performSearch(){hideAddMessage();const barcode=barcodeInput.value.trim(),artist=artistInput.value.trim(),title=titleInput.value.trim();if(!barcode&&!artist&&!title){showAddMessage('Entre un code-barres, un artiste ou un titre.');return;}setSearchLoading(true);try{renderResults(await searchDiscogs({barcode,artist,title}));}catch(error){console.error('Recherche Discogs :',error);showAddMessage('Impossible de rechercher sur Discogs pour le moment.');}finally{setSearchLoading(false);}}
searchForm.addEventListener('submit',e=>{e.preventDefault();performSearch();});
clearSearchButton.addEventListener('click',()=>{barcodeInput.value='';artistInput.value='';titleInput.value='';releaseResults.innerHTML='';resultsSection.hidden=true;initialState.hidden=false;hideAddMessage();artistInput.focus();});

async function addDiscogsRelease(releaseId){
  if(!releaseId)return;hideAddMessage();document.querySelectorAll('.release-result').forEach(b=>b.disabled=true);showAddMessage('Récupération des informations de cette édition…','info');
  try{
    const release=await getDiscogsRelease(releaseId);if(!release)throw new Error('Édition Discogs introuvable.');
    const normalized=normalizeRelease(release);if(!normalized)throw new Error('Impossible de lire cette édition.');
    const collection=readCollection();
    const alreadyExists=collection.some(item=>String(item.discogsId??item.discogs_id??'')===String(normalized.discogsId));
    if(alreadyExists&&!window.confirm('Cette édition est déjà présente dans ta collection. Veux-tu quand même l’ajouter une seconde fois ?')){hideAddMessage();document.querySelectorAll('.release-result').forEach(b=>b.disabled=false);return;}
    const vinyl={id:createLocalId(),discogsId:normalized.discogsId,masterId:normalized.masterId,artist:normalized.artist,title:normalized.title,year:normalized.year,genre:normalized.genre,style:normalized.style,country:normalized.country,label:normalized.label,catalogNumber:normalized.catalogNumber,format:normalized.format,vinylColor:normalized.vinylColor,barcode:normalized.barcode,cover:normalized.cover,discImage:normalized.discImage,images:normalized.images,uri:normalized.uri,added:new Date().toISOString(),plays:0,notes:''};
    collection.unshift(vinyl);saveCollection(collection);showAddMessage(`${vinyl.artist||'Vinyle'} — ${vinyl.title||'Sans titre'} a été ajouté à ta collection.`,'success');setTimeout(()=>location.href='accueil.html',650);
  }catch(error){console.error('Ajout du vinyle :',error);showAddMessage(error?.message||'Impossible d’ajouter cette édition.');document.querySelectorAll('.release-result').forEach(b=>b.disabled=false);}
}

(async function startAddPage(){const session=await requireSession();if(session)artistInput.focus();})();
