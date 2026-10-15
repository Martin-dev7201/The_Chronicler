/* =========================================================
   THE_CHRONICLER
   AUTHENTIFICATION SUPABASE
   ========================================================= */


// ==========================================
// ÉLÉMENTS HTML
// ==========================================

const authForm =
  document.querySelector('#authForm');


const loginTab =
  document.querySelector('#loginTab');


const signupTab =
  document.querySelector('#signupTab');


const authTitle =
  document.querySelector('#authTitle');


const authSubtitle =
  document.querySelector('#authSubtitle');


const authEmail =
  document.querySelector('#authEmail');


const authPassword =
  document.querySelector('#authPassword');


const authPasswordConfirm =
  document.querySelector('#authPasswordConfirm');


const displayName =
  document.querySelector('#displayName');


const displayNameField =
  document.querySelector('#displayNameField');


const confirmPasswordField =
  document.querySelector('#confirmPasswordField');


const passwordHint =
  document.querySelector('#passwordHint');


const authSubmit =
  document.querySelector('#authSubmit');


const authMessage =
  document.querySelector('#authMessage');


const authSwitch =
  document.querySelector('#authSwitch');


const authSwitchText =
  document.querySelector('#authSwitchText');


// ==========================================
// MODE ACTUEL
// ==========================================

let authMode = 'login';


// ==========================================
// AFFICHAGE D'UN MESSAGE
// ==========================================

function showMessage(
  text,
  type = 'error'
) {

  authMessage.textContent =
    text;


  authMessage.className =
    `auth-message ${type}`;


  authMessage.hidden =
    false;

}


// ==========================================
// CACHER LE MESSAGE
// ==========================================

function hideMessage() {

  authMessage.hidden =
    true;


  authMessage.textContent =
    '';


  authMessage.className =
    'auth-message';

}


// ==========================================
// TRADUCTION DE QUELQUES ERREURS SUPABASE
// ==========================================

function translateAuthError(error) {


  const message =
    String(
      error?.message || ''
    );


  if(
    message.includes(
      'Invalid login credentials'
    )
  ) {

    return (
      'Adresse e-mail ou mot de passe incorrect.'
    );

  }


  if(
    message.includes(
      'Email not confirmed'
    )
  ) {

    return (
      'Ton adresse e-mail doit encore être confirmée.'
    );

  }


  if(
    message.includes(
      'User already registered'
    )
  ) {

    return (
      'Un compte existe déjà avec cette adresse e-mail.'
    );

  }


  if(
    message
      .toLowerCase()
      .includes('password')
  ) {

    return (
      'Le mot de passe ne respecte pas les conditions demandées.'
    );

  }


  if(
    message
      .toLowerCase()
      .includes('email')
  ) {

    return (
      'Vérifie que ton adresse e-mail est correcte.'
    );

  }


  return (
    message
    ||
    'Une erreur est survenue.'
  );

}


// ==========================================
// BOUTON EN CHARGEMENT
// ==========================================

function setLoading(loading) {


  authSubmit.disabled =
    loading;


  loginTab.disabled =
    loading;


  signupTab.disabled =
    loading;


  authSwitch.disabled =
    loading;


  if(loading) {

    authSubmit.textContent =
      authMode === 'login'
        ? 'Connexion…'
        : 'Création du compte…';

  }

  else {

    authSubmit.textContent =
      authMode === 'login'
        ? 'Se connecter'
        : 'Créer mon compte';

  }

}


// ==========================================
// PASSER EN MODE CONNEXION
// ==========================================

function showLogin() {


  authMode =
    'login';


  hideMessage();


  // Onglets.

  loginTab
    .classList
    .add('active');


  signupTab
    .classList
    .remove('active');


  // Textes.

  authTitle.textContent =
    'Bon retour.';


  authSubtitle.textContent =
    'Connecte-toi pour accéder à ta collection.';


  authSubmit.textContent =
    'Se connecter';


  authSwitchText.textContent =
    'Pas encore de compte ?';


  authSwitch.textContent =
    'Créer un compte';


  // Champs inscription.

  displayNameField.hidden =
    true;


  confirmPasswordField.hidden =
    true;


  passwordHint.hidden =
    true;


  displayName.required =
    false;


  authPasswordConfirm.required =
    false;


  // Autocomplete.

  authPassword.autocomplete =
    'current-password';


  // On efface la confirmation.

  authPasswordConfirm.value =
    '';

}


// ==========================================
// PASSER EN MODE INSCRIPTION
// ==========================================

function showSignup() {


  authMode =
    'signup';


  hideMessage();


  // Onglets.

  signupTab
    .classList
    .add('active');


  loginTab
    .classList
    .remove('active');


  // Textes.

  authTitle.textContent =
    'Crée ta collection.';


  authSubtitle.textContent =
    'Crée ton compte pour commencer ton archive musicale.';


  authSubmit.textContent =
    'Créer mon compte';


  authSwitchText.textContent =
    'Tu as déjà un compte ?';


  authSwitch.textContent =
    'Se connecter';


  // Champs supplémentaires.

  displayNameField.hidden =
    false;


  confirmPasswordField.hidden =
    false;


  passwordHint.hidden =
    false;


  displayName.required =
    true;


  authPasswordConfirm.required =
    true;


  // Autocomplete inscription.

  authPassword.autocomplete =
    'new-password';

}


// ==========================================
// ONGLETS
// ==========================================

loginTab.addEventListener(
  'click',
  showLogin
);


signupTab.addEventListener(
  'click',
  showSignup
);


// ==========================================
// LIEN SOUS LE FORMULAIRE
// ==========================================

authSwitch.addEventListener(

  'click',

  () => {


    if(
      authMode === 'login'
    ) {

      showSignup();

    }

    else {

      showLogin();

    }

  }

);


// ==========================================
// CRÉATION DE COMPTE
// ==========================================

async function createAccount() {


  const name =
    displayName
      .value
      .trim();


  const email =
    authEmail
      .value
      .trim();


  const password =
    authPassword
      .value;


  const passwordConfirmation =
    authPasswordConfirm
      .value;


  // ----------------------------------------
  // VÉRIFICATIONS
  // ----------------------------------------

  if(!name) {

    showMessage(
      'Choisis un nom d’utilisateur.'
    );

    return;

  }


  if(
    password.length < 6
  ) {

    showMessage(
      'Le mot de passe doit contenir au moins 6 caractères.'
    );

    return;

  }


  if(
    password !==
    passwordConfirmation
  ) {

    showMessage(
      'Les deux mots de passe ne correspondent pas.'
    );

    return;

  }


  setLoading(true);


  try {


    // ======================================
    // INSCRIPTION SUPABASE
    // ======================================

    const {
      data,
      error
    } =

      await supabaseClient
        .auth
        .signUp({

          email,

          password,

          options: {

            data: {

              display_name:
                name

            }

          }

        });


    if(error) {

      throw error;

    }


    // ======================================
    // SI SUPABASE CONNECTE DIRECTEMENT
    // ======================================

    if(data.session) {


      showMessage(
        'Compte créé. Connexion réussie.',
        'success'
      );


      setTimeout(

        () => {

          location.href =
            'dashboard.html';

        },

        500

      );


      return;

    }


    // ======================================
    // SI CONFIRMATION EMAIL NÉCESSAIRE
    // ======================================

    showMessage(

      'Compte créé ! Vérifie maintenant ta boîte e-mail pour confirmer ton adresse, puis connecte-toi.',

      'success'

    );


    // On repasse ensuite en connexion.

    authPassword.value =
      '';


    authPasswordConfirm.value =
      '';


  }

  catch(error) {


    console.error(
      'Erreur création compte :',
      error
    );


    showMessage(
      translateAuthError(error)
    );

  }

  finally {

    setLoading(false);

  }

}


// ==========================================
// CONNEXION
// ==========================================

async function login() {


  const email =
    authEmail
      .value
      .trim();


  const password =
    authPassword
      .value;


  setLoading(true);


  try {


    const {
      data,
      error
    } =

      await supabaseClient
        .auth
        .signInWithPassword({

          email,

          password

        });


    if(error) {

      throw error;

    }


    if(
      !data.session
    ) {

      throw new Error(
        'Impossible de créer la session.'
      );

    }


    showMessage(
      'Connexion réussie.',
      'success'
    );


    // ======================================
    // REDIRECTION
    // ======================================

    setTimeout(

      () => {

        location.href =
          'dashboard.html';

      },

      350

    );

  }

  catch(error) {


    console.error(
      'Erreur connexion :',
      error
    );


    showMessage(
      translateAuthError(error)
    );

  }

  finally {

    setLoading(false);

  }

}


// ==========================================
// ENVOI DU FORMULAIRE
// ==========================================

authForm.addEventListener(

  'submit',

  async event => {


    event.preventDefault();


    hideMessage();


    if(
      authMode === 'signup'
    ) {

      await createAccount();

    }

    else {

      await login();

    }

  }

);


// ==========================================
// UTILISATEUR DÉJÀ CONNECTÉ
// ==========================================

async function checkExistingSession() {


  const {
    data,
    error
  } =

    await supabaseClient
      .auth
      .getSession();


  if(error) {

    console.error(
      'Lecture session :',
      error
    );

    return;

  }


  if(data.session) {


    location.href =
      'dashboard.html';

  }

}


// ==========================================
// LANCEMENT
// ==========================================

showLogin();


checkExistingSession();
