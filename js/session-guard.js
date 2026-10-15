/* Protection simple des pages privées de THE_CHRONICLER. */
(async function(){
  try{
    const {data,error}=await supabaseClient.auth.getSession();
    if(error || !data.session){
      location.replace('connexion.html');
    }
  }catch(error){
    console.error('Erreur de vérification de session :',error);
    location.replace('connexion.html');
  }
})();
