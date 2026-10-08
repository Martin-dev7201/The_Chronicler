/* auth.js — Supabase Auth pour THE_CHRONICLER */
const authScreen=document.querySelector('#authScreen');
const appShell=document.querySelector('#appShell');
const authForm=document.querySelector('#authForm');
const authEmail=document.querySelector('#authEmail');
const authPassword=document.querySelector('#authPassword');
const authTitle=document.querySelector('#authTitle');
const authSubtitle=document.querySelector('#authSubtitle');
const authMessage=document.querySelector('#authMessage');
const authSubmit=document.querySelector('#authSubmit');
const authSwitch=document.querySelector('#authSwitch');
const logoutBtn=document.querySelector('#logoutBtn');
let authMode='signin';

function setAuthMessage(message='',type=''){
  authMessage.textContent=message;
  authMessage.dataset.type=type;
}
function setAuthMode(mode){
  authMode=mode;
  const signup=mode==='signup';
  authTitle.textContent=signup?'Créer un compte':'Connexion';
  authSubtitle.textContent=signup?'Crée ton accès à THE_CHRONICLER.':'Retrouve ta discothèque personnelle.';
  authSubmit.textContent=signup?'Créer mon compte':'Se connecter';
  authSwitch.innerHTML=signup?'Déjà un compte ? <strong>Se connecter</strong>':'Pas encore de compte ? <strong>Créer un compte</strong>';
  authPassword.autocomplete=signup?'new-password':'current-password';
  setAuthMessage();
}
function showSession(session){
  const connected=Boolean(session?.user);
  authScreen.hidden=connected;
  appShell.hidden=!connected;
  if(connected){authForm.reset();setAuthMessage();}
}
authSwitch.addEventListener('click',()=>setAuthMode(authMode==='signin'?'signup':'signin'));

authForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const email=authEmail.value.trim();
  const password=authPassword.value;
  if(!email||!password){return setAuthMessage('Renseigne ton adresse e-mail et ton mot de passe.','error');}
  if(password.length<6){return setAuthMessage('Le mot de passe doit contenir au moins 6 caractères.','error');}
  authSubmit.disabled=true;
  authSubmit.textContent=authMode==='signup'?'Création…':'Connexion…';
  setAuthMessage();
  try{
    if(authMode==='signup'){
      const {data,error}=await supabaseClient.auth.signUp({email,password});
      if(error) throw error;
      if(data.session){
        showSession(data.session);
      }else{
        setAuthMode('signin');
        authEmail.value=email;
        setAuthMessage('Compte créé. Vérifie ton e-mail pour confirmer ton compte, puis connecte-toi.','success');
      }
    }else{
      const {data,error}=await supabaseClient.auth.signInWithPassword({email,password});
      if(error) throw error;
      showSession(data.session);
    }
  }catch(error){
    console.error('Supabase Auth :',error);
    const message=error?.message==='Invalid login credentials'
      ?'E-mail ou mot de passe incorrect.'
      :error?.message==='Email not confirmed'
        ?'Confirme d’abord ton adresse e-mail.'
        :(error?.message||'Une erreur est survenue. Réessaie.');
    setAuthMessage(message,'error');
  }finally{
    authSubmit.disabled=false;
    authSubmit.textContent=authMode==='signup'?'Créer mon compte':'Se connecter';
  }
});

logoutBtn.addEventListener('click',async()=>{
  logoutBtn.disabled=true;
  const {error}=await supabaseClient.auth.signOut();
  logoutBtn.disabled=false;
  if(error){console.error('Déconnexion Supabase :',error);return;}
  setAuthMode('signin');
});

supabaseClient.auth.onAuthStateChange((_event,session)=>showSession(session));
setAuthMode('signin');
