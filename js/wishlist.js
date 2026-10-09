// ==========================================
// THE_CHRONICLER
// WISHLIST V3
// ==========================================


// Petit raccourci pour querySelector.

const $w = selector =>
  document.querySelector(selector);


// Nom utilisé dans localStorage.

const WISH_KEY = "vv_wishlist";


// ==========================================
// LECTURE DE LA WISHLIST
// ==========================================

function readWish() {

  try {

    const value = JSON.parse(
      localStorage.getItem(WISH_KEY) || "[]"
    );


    if (Array.isArray(value)) {

      return value;

    }


    return [];

  }

  catch (error) {

    console.error(
      "Impossible de lire la wishlist :",
      error
    );

    return [];

  }

}


// ==========================================
// SAUVEGARDE
// ==========================================

function saveWish(items) {

  localStorage.setItem(
    WISH_KEY,
    JSON.stringify(items)
  );

}


// ==========================================
// PROTECTION DU HTML
// ==========================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,

      character => ({

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&#039;"

      })[character]

    );

}


// ==========================================
// CHARGEMENT
// ==========================================

let wishes = readWish();


// ==========================================
// FILTRAGE + TRI
// ==========================================

function getFilteredWishes() {

  const query =
    $w("#wishSearch")
      .value
      .trim()
      .toLowerCase();


  let list = wishes.filter(item => {

    if (!query) {

      return true;

    }


    const searchableText = [

      item.artist,

      item.title,

      item.genre,

      item.year,

      item.note

    ]

      .filter(Boolean)

      .join(" ")

      .toLowerCase();


    return searchableText.includes(query);

  });


  const sort =
    $w("#wishSort").value;


  // On crée une copie.

  list = [...list];


  // Artiste

  if (sort === "artist") {

    list.sort(
      (a, b) =>

        (a.artist || "")
          .localeCompare(
            b.artist || "",
            "fr"
          )
    );

  }


  // Titre

  else if (sort === "title") {

    list.sort(
      (a, b) =>

        (a.title || "")
          .localeCompare(
            b.title || "",
            "fr"
          )
    );

  }


  // Année

  else if (sort === "year-desc") {

    list.sort(
      (a, b) =>

        (Number(b.year) || 0)

        -

        (Number(a.year) || 0)
    );

  }


  // Ajout récent

  else {

    list.sort(
      (a, b) =>

        new Date(b.added || 0)

        -

        new Date(a.added || 0)
    );

  }


  return list;

}


// ==========================================
// AFFICHAGE DE LA WISHLIST
// ==========================================

function renderWish() {

  const list =
    getFilteredWishes();


  // Nombre total

  $w("#wishCount").textContent =
    wishes.length;


  // Nombre actuellement visible

  $w("#visibleWishCount").textContent =
    list.length;


  // Message liste vide

  $w("#wishlistEmpty").hidden =
    list.length !== 0;


  // ========================================
  // CRÉATION DES CARTES
  // ========================================

  $w("#wishlistGrid").innerHTML =

    list.map(item => {


      // Pochette

      let coverHTML;


      if (item.cover) {

        coverHTML = `

          <img
            src="${escapeHTML(item.cover)}"
            alt="Pochette de ${escapeHTML(item.title)}"
            loading="lazy"
          >

        `;

      }

      else {

        coverHTML = `

          <div class="cover-placeholder">
            ♡
          </div>

        `;

      }


      // Année

      const yearHTML = item.year

        ? `

          <span>
            ${escapeHTML(item.year)}
          </span>

        `

        : "";


      // Genre

      const genreHTML = item.genre

        ? `

          <span>
            ${escapeHTML(item.genre)}
          </span>

        `

        : "";


      // Note

      const noteHTML = item.note

        ? `

          <p>
            ${escapeHTML(item.note)}
          </p>

        `

        : "";


      // Carte complète

      return `

        <article
          class="wish-card"
          data-id="${escapeHTML(item.id)}"
        >


          <div class="wish-cover">


            ${coverHTML}


            <!-- Actions -->

            <div class="wish-card-actions">


              <!--
                Le disque a été acheté.
                On le transfère dans Collection.
              -->

              <button
                class="wish-own"
                type="button"
                title="Ajouter à la collection"
              >
                ✓
              </button>


              <!-- Supprimer -->

              <button
                class="wish-delete"
                type="button"
                title="Retirer de la liste"
              >
                ×
              </button>


            </div>

          </div>


          <!-- Album -->

          <strong>

            ${escapeHTML(
              item.title || "Sans titre"
            )}

          </strong>


          <!-- Artiste -->

          <span>

            ${escapeHTML(
              item.artist || "Artiste inconnu"
            )}

          </span>


          <!-- Informations -->

          <div class="wish-meta">

            ${yearHTML}

            ${genreHTML}

          </div>


          ${noteHTML}


        </article>

      `;

    })

    .join("");


  // ========================================
  // BOUTON SUPPRIMER
  // ========================================

  document
    .querySelectorAll(".wish-delete")
    .forEach(button => {


      button.addEventListener(
        "click",

        event => {


          const card =
            event.currentTarget
              .closest(".wish-card");


          const id =
            card.dataset.id;


          wishes =
            wishes.filter(
              item =>
                String(item.id) !== id
            );


          saveWish(wishes);


          renderWish();

        }

      );

    });


  // ========================================
  // BOUTON "JE L'AI ACHETÉ"
  // ========================================

  document
    .querySelectorAll(".wish-own")
    .forEach(button => {


      button.addEventListener(
        "click",

        event => {


          const card =
            event.currentTarget
              .closest(".wish-card");


          const id =
            card.dataset.id;


          // On cherche le vinyle.

          const item =
            wishes.find(
              wish =>
                String(wish.id) === id
            );


          if (!item) {

            return;

          }


          // ==================================
          // RÉCUPÉRATION DE LA COLLECTION
          // ==================================

          let collection = [];


          try {

            const value =
              JSON.parse(
                localStorage.getItem(
                  "vv_items"
                ) || "[]"
              );


            if (Array.isArray(value)) {

              collection = value;

            }

          }

          catch (error) {

            console.error(
              "Impossible de lire la collection :",
              error
            );

          }


          // ==================================
          // AJOUT DANS LA COLLECTION
          // ==================================

          const collectionItem = {

            ...item,


            // Nouvel identifiant.

            id: Date.now(),


            // Nouvelle date d'ajout.

            added:
              new Date()
                .toISOString(),


            // Nombre d'écoutes initial.

            plays: 0

          };


          collection.unshift(
            collectionItem
          );


          localStorage.setItem(

            "vv_items",

            JSON.stringify(
              collection
            )

          );


          // ==================================
          // SUPPRESSION DE LA WISHLIST
          // ==================================

          wishes =
            wishes.filter(
              wish =>
                String(wish.id) !== id
            );


          saveWish(wishes);


          // Rafraîchissement.

          renderWish();

        }

      );

    });

}


// ==========================================
// MODALE D'AJOUT
// ==========================================

const modal =
  $w("#wishModal");


function openModal() {

  modal.hidden = false;


  $w("#wishArtist")
    .focus();

}


function closeModal() {

  modal.hidden = true;


  $w("#wishForm")
    .reset();

}


// Bouton +

$w("#openWishModal")
  .addEventListener(
    "click",
    openModal
  );


// Bouton depuis l'écran vide.

$w("#emptyAddWish")
  .addEventListener(
    "click",
    openModal
  );


// Croix

$w("#closeWishModal")
  .addEventListener(
    "click",
    closeModal
  );


// Annuler

$w("#cancelWish")
  .addEventListener(
    "click",
    closeModal
  );


// Clic en dehors de la fenêtre.

modal.addEventListener(
  "click",

  event => {

    if (event.target === modal) {

      closeModal();

    }

  }
);


// ==========================================
// AJOUT D'UN NOUVEAU VINYLE
// ==========================================

$w("#wishForm")
  .addEventListener(
    "submit",

    event => {


      // Empêche le rechargement HTML.

      event.preventDefault();


      // Création de l'objet.

      const newWish = {


        // Identifiant unique.

        id:

          crypto.randomUUID

            ? crypto.randomUUID()

            : String(Date.now()),


        // Artiste.

        artist:

          $w("#wishArtist")
            .value
            .trim(),


        // Album.

        title:

          $w("#wishTitle")
            .value
            .trim(),


        // Année.

        year:

          $w("#wishYear").value

            ? Number(
                $w("#wishYear").value
              )

            : null,


        // Genre.

        genre:

          $w("#wishGenre")
            .value
            .trim(),


        // Pochette.

        cover:

          $w("#wishCover")
            .value
            .trim(),


        // Note personnelle.

        note:

          $w("#wishNote")
            .value
            .trim(),


        // Date d'ajout.

        added:

          new Date()
            .toISOString()

      };


      // Ajout au début de la liste.

      wishes.unshift(
        newWish
      );


      // Sauvegarde.

      saveWish(wishes);


      // Fermeture du formulaire.

      closeModal();


      // Actualisation.

      renderWish();

    }

  );


// ==========================================
// RECHERCHE
// ==========================================

$w("#wishSearch")
  .addEventListener(
    "input",
    renderWish
  );


// ==========================================
// TRI
// ==========================================

$w("#wishSort")
  .addEventListener(
    "change",
    renderWish
  );


// ==========================================
// RECHERCHE GLOBALE
// ==========================================

$w("#globalSearch")
  .addEventListener(
    "input",

    () => {

      $w("#wishSearch").value =
        $w("#globalSearch").value;


      renderWish();

    }

  );


// ==========================================
// RACCOURCIS CLAVIER
// ==========================================

document.addEventListener(
  "keydown",

  event => {


    // CTRL + K ou CMD + K

    if (

      (
        event.ctrlKey ||
        event.metaKey
      )

      &&

      event.key
        .toLowerCase() === "k"

    ) {

      event.preventDefault();


      $w("#globalSearch")
        .focus();

    }


    // ESC ferme la fenêtre.

    if (

      event.key === "Escape"

      &&

      !modal.hidden

    ) {

      closeModal();

    }

  }
);


// ==========================================
// COMPTE SUPABASE
// ==========================================

const accountButton =
  $w("#accountButton");


const accountMenu =
  $w("#accountMenu");


function displayAccount(session) {


  const user =
    session?.user;


  // Pas connecté.

  if (!user) {

    $w("#accountName")
      .textContent =
      "Non connecté";


    $w("#accountEmail")
      .textContent =
      "Aucune session";


    $w("#accountStatus")
      .textContent =
      "Hors ligne";


    $w("#avatarInitial")
      .textContent =
      "?";


    $w(".status-dot")
      .classList
      .remove("online");


    return;

  }


  // Email

  const email =
    user.email || "Compte";


  // Nom

  const name =

    user.user_metadata
      ?.display_name

    ||

    email.split("@")[0];


  // Affichage

  $w("#accountName")
    .textContent =
    name;


  $w("#accountEmail")
    .textContent =
    email;


  $w("#accountStatus")
    .textContent =
    "Connecté";


  $w("#avatarInitial")
    .textContent =
    (
      name[0] || "?"
    ).toUpperCase();


  $w(".status-dot")
    .classList
    .add("online");

}


// ==========================================
// MENU DU COMPTE
// ==========================================

accountButton.addEventListener(
  "click",

  () => {

    accountMenu.hidden =
      !accountMenu.hidden;

  }

);


// ==========================================
// SESSION SUPABASE
// ==========================================

supabaseClient
  .auth
  .getSession()

  .then(
    ({ data }) => {

      displayAccount(
        data.session
      );

    }
  );


// Surveillance des changements.

supabaseClient
  .auth
  .onAuthStateChange(

    (
      event,
      session
    ) => {

      displayAccount(
        session
      );

    }

  );


// ==========================================
// DÉCONNEXION
// ==========================================

$w("#logoutButton")
  .addEventListener(
    "click",

    async () => {


      const { error } =

        await supabaseClient
          .auth
          .signOut();


      if (error) {

        console.error(
          "Erreur de déconnexion :",
          error
        );

        return;

      }


      location.href =
        "index.html";

    }

  );


// ==========================================
// PREMIER AFFICHAGE
// ==========================================

renderWish();