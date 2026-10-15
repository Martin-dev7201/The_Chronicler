/* =========================================================
   THE_CHRONICLER
   AJOUT D'UN VINYLE V3
   ========================================================= */


/* =========================================================
   RACCOURCI DOM
   ========================================================= */

const $add = selector => document.querySelector(selector);


/* =========================================================
   ÉLÉMENTS DE LA PAGE
   ========================================================= */

const searchForm = $add('#releaseSearchForm');

const barcodeInput = $add('#addBarcode');
const artistInput = $add('#addArtist');
const titleInput = $add('#addTitle');

const searchButton = $add('#searchButton');
const clearSearchButton = $add('#clearSearchButton');

const resultsSection = $add('#resultsSection');
const releaseResults = $add('#releaseResults');
const resultCount = $add('#resultCount');

const initialState = $add('#initialState');

const addMessage = $add('#addMessage');


/* =========================================================
   ÉLÉMENTS DU COMPTE
   ========================================================= */

const accountButton = $add('#accountButton');
const accountMenu = $add('#accountMenu');

const accountName = $add('#accountName');
const accountEmail = $add('#accountEmail');
const accountStatus = $add('#accountStatus');

const avatarInitial = $add('#avatarInitial');

const statusDot = $add('.status-dot');


/* =========================================================
   OUTILS
   ========================================================= */

function safeText(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[character]
  );
}


function createLocalId() {
  if (
    window.crypto &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}


/* =========================================================
   MESSAGES
   ========================================================= */

function showAddMessage(
  message,
  type = 'error'
) {
  addMessage.textContent = message;

  addMessage.className =
    `add-message ${type}`;

  addMessage.hidden = false;
}


function hideAddMessage() {
  addMessage.hidden = true;

  addMessage.textContent = '';

  addMessage.className =
    'add-message';
}


/* =========================================================
   ÉTAT DE CHARGEMENT
   ========================================================= */

function setSearchLoading(loading) {
  searchButton.disabled = loading;
  clearSearchButton.disabled = loading;

  barcodeInput.disabled = loading;
  artistInput.disabled = loading;
  titleInput.disabled = loading;

  searchButton.textContent =
    loading
      ? 'Recherche…'
      : 'Rechercher sur Discogs';
}


/* =========================================================
   COLLECTION LOCALE
   ========================================================= */

function readCollection() {
  try {
    const value = JSON.parse(
      localStorage.getItem('vv_items') || '[]'
    );

    return Array.isArray(value)
      ? value
      : [];
  }

  catch (error) {
    console.error(
      'Lecture collection :',
      error
    );

    return [];
  }
}


function saveCollection(collection) {
  localStorage.setItem(
    'vv_items',
    JSON.stringify(collection)
  );
}


/* =========================================================
   COMPTE UTILISATEUR
   ========================================================= */

function showAccount(session) {
  const user = session?.user;

  if (!user) {
    return;
  }

  const email =
    user.email || 'Compte';

  const name =
    user.user_metadata?.display_name
    ||
    email.split('@')[0];

  accountName.textContent = name;
  accountEmail.textContent = email;
  accountStatus.textContent = 'Connecté';

  avatarInitial.textContent =
    (name?.[0] || '?').toUpperCase();

  statusDot.classList.add('online');
}


/* =========================================================
   PROTECTION DE LA PAGE
   ========================================================= */

async function requireSession() {
  const {
    data,
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error(
      'Erreur session :',
      error
    );

    location.replace(
      'connexion.html'
    );

    return null;
  }

  if (!data.session) {
    location.replace(
      'connexion.html'
    );

    return null;
  }

  showAccount(
    data.session
  );

  return data.session;
}


/* =========================================================
   MENU COMPTE
   ========================================================= */

accountButton.addEventListener(
  'click',
  () => {
    accountMenu.hidden =
      !accountMenu.hidden;
  }
);


document.addEventListener(
  'click',
  event => {
    const clickOutsideButton =
      !accountButton.contains(
        event.target
      );

    const clickOutsideMenu =
      !accountMenu.contains(
        event.target
      );

    if (
      clickOutsideButton &&
      clickOutsideMenu
    ) {
      accountMenu.hidden = true;
    }
  }
);


/* =========================================================
   DÉCONNEXION
   ========================================================= */

$add('#logoutButton').addEventListener(
  'click',
  async () => {
    const {
      error
    } = await supabaseClient.auth.signOut();

    if (error) {
      console.error(
        'Déconnexion :',
        error
      );

      return;
    }

    location.replace(
      'connexion.html'
    );
  }
);


/* =========================================================
   INFORMATIONS DES RÉSULTATS DISCOGS
   ========================================================= */

function getSearchResultArtist(result) {
  const title =
    String(
      result?.title || ''
    );

  if (
    title.includes(' - ')
  ) {
    return title
      .split(' - ')[0]
      .trim();
  }

  return '';
}


function getSearchResultTitle(result) {
  const title =
    String(
      result?.title || ''
    );

  if (
    title.includes(' - ')
  ) {
    return title
      .split(' - ')
      .slice(1)
      .join(' - ')
      .trim();
  }

  return title || 'Sans titre';
}


/* =========================================================
   AFFICHAGE DES RÉSULTATS
   ========================================================= */

function renderResults(results) {
  resultCount.textContent =
    `${results.length} résultat${
      results.length > 1
        ? 's'
        : ''
    }`;

  resultsSection.hidden = false;
  initialState.hidden = true;

  if (!results.length) {
    releaseResults.innerHTML = `
      <div class="add-no-result">
        <strong>
          Aucun résultat.
        </strong>

        <span>
          Essaie avec un autre artiste,
          titre ou code-barres.
        </span>
      </div>
    `;

    return;
  }

  releaseResults.innerHTML =
    results
      .map(result => {
        const image =
          result.cover_image
          ||
          result.thumb
          ||
          '';

        const artist =
          getSearchResultArtist(
            result
          );

        const title =
          getSearchResultTitle(
            result
          );

        const format =
          Array.isArray(result.format)
            ? result.format.join(', ')
            : result.format || '';

        const labels =
          Array.isArray(result.label)
            ? result.label.join(', ')
            : result.label || '';

        return `
          <button
            type="button"
            class="release-result"
            data-release-id="${safeText(result.id)}"
          >

            <div class="release-result-cover">
              ${
                image
                  ? `
                    <img
                      src="${safeText(image)}"
                      alt=""
                      loading="lazy"
                    >
                  `
                  : `
                    <div class="release-placeholder">
                      ◎
                    </div>
                  `
              }
            </div>

            <div class="release-result-main">

              <span class="release-result-artist">
                ${safeText(artist)}
              </span>

              <strong>
                ${safeText(title)}
              </strong>

              <small>
                ${safeText(labels)}
              </small>

            </div>

            <div class="release-result-meta">

              <span>
                ${safeText(
                  result.year || '—'
                )}
              </span>

              <span>
                ${safeText(
                  result.country || '—'
                )}
              </span>

              <span>
                ${safeText(
                  format || 'Vinyl'
                )}
              </span>

            </div>

            <span class="release-result-arrow">
              →
            </span>

          </button>
        `;
      })
      .join('');

  document
    .querySelectorAll(
      '.release-result'
    )
    .forEach(button => {
      button.addEventListener(
        'click',
        () => {
          addDiscogsRelease(
            button.dataset.releaseId
          );
        }
      );
    });
}


/* =========================================================
   RECHERCHE DISCOGS
   ========================================================= */

async function performSearch() {
  hideAddMessage();

  const barcode =
    barcodeInput.value.trim();

  const artist =
    artistInput.value.trim();

  const title =
    titleInput.value.trim();

  if (
    !barcode &&
    !artist &&
    !title
  ) {
    showAddMessage(
      'Entre un code-barres, un artiste ou un titre.'
    );

    return;
  }

  setSearchLoading(true);

  try {
    const results =
      await searchDiscogs({
        barcode,
        artist,
        title
      });

    renderResults(
      results
    );
  }

  catch (error) {
    console.error(
      'Recherche Discogs :',
      error
    );

    showAddMessage(
      'Impossible de rechercher sur Discogs pour le moment.'
    );
  }

  finally {
    setSearchLoading(false);
  }
}


/* =========================================================
   ENVOI DU FORMULAIRE
   ========================================================= */

searchForm.addEventListener(
  'submit',
  event => {
    event.preventDefault();

    performSearch();
  }
);


/* =========================================================
   EFFACER LA RECHERCHE
   ========================================================= */

clearSearchButton.addEventListener(
  'click',
  () => {
    barcodeInput.value = '';
    artistInput.value = '';
    titleInput.value = '';

    releaseResults.innerHTML = '';

    resultsSection.hidden = true;

    initialState.hidden = false;

    hideAddMessage();

    artistInput.focus();
  }
);


/* =========================================================
   AJOUTER UNE ÉDITION DISCOGS
   ========================================================= */

async function addDiscogsRelease(
  releaseId
) {
  if (!releaseId) {
    return;
  }

  hideAddMessage();

  document
    .querySelectorAll(
      '.release-result'
    )
    .forEach(button => {
      button.disabled = true;
    });

  showAddMessage(
    'Récupération des informations de cette édition…',
    'info'
  );

  try {
    /* =====================================
       RÉCUPÉRER LE DÉTAIL DISCOGS
       ===================================== */

    const release =
      await getDiscogsRelease(
        releaseId
      );

    if (!release) {
      throw new Error(
        'Édition Discogs introuvable.'
      );
    }

    /* =====================================
       NORMALISER LES DONNÉES
       ===================================== */

    const normalized =
      normalizeRelease(
        release
      );

    if (!normalized) {
      throw new Error(
        'Impossible de lire cette édition.'
      );
    }

    /* =====================================
       COLLECTION ACTUELLE
       ===================================== */

    const collection =
      readCollection();

    /* =====================================
       VÉRIFICATION DOUBLON
       ===================================== */

    const alreadyExists =
      collection.some(item =>
        String(
          item.discogsId
          ??
          item.discogs_id
          ??
          ''
        )
        ===
        String(
          normalized.discogsId
        )
      );

    if (alreadyExists) {
      const confirmDuplicate =
        window.confirm(
          'Cette édition est déjà présente dans ta collection. Veux-tu quand même l’ajouter une seconde fois ?'
        );

      if (!confirmDuplicate) {
        hideAddMessage();

        document
          .querySelectorAll(
            '.release-result'
          )
          .forEach(button => {
            button.disabled = false;
          });

        return;
      }
    }

    /* =====================================
       CRÉATION DE L'OBJET VINYLE
       ===================================== */

    const vinyl = {
      id:
        createLocalId(),

      discogsId:
        normalized.discogsId,

      masterId:
        normalized.masterId,

      artist:
        normalized.artist,

      title:
        normalized.title,

      year:
        normalized.year,

      genre:
        normalized.genre,

      style:
        normalized.style,

      country:
        normalized.country,

      label:
        normalized.label,

      catalogNumber:
        normalized.catalogNumber,

      format:
        normalized.format,

      vinylColor:
        normalized.vinylColor,

      barcode:
        normalized.barcode,

      cover:
        normalized.cover,

      discImage:
        normalized.discImage,

      images:
        normalized.images,

      tracklist:
        normalized.tracklist,

      uri:
        normalized.uri,

      added:
        new Date().toISOString(),

      plays:
        0,

      notes:
        ''
    };

    /* =====================================
       AJOUT À LA COLLECTION
       ===================================== */

    collection.unshift(
      vinyl
    );

    saveCollection(
      collection
    );

    /* =====================================
       MESSAGE DE SUCCÈS
       ===================================== */

    showAddMessage(
      `${vinyl.artist || 'Vinyle'} — ${vinyl.title || 'Sans titre'} a été ajouté à ta collection.`,
      'success'
    );

    /* =====================================
       RETOUR À LA COLLECTION
       ===================================== */

    setTimeout(
      () => {
        location.href =
          'accueil.html';
      },
      650
    );
  }

  catch (error) {
    console.error(
      'Ajout du vinyle :',
      error
    );

    showAddMessage(
      error?.message
      ||
      'Impossible d’ajouter cette édition.'
    );

    document
      .querySelectorAll(
        '.release-result'
      )
      .forEach(button => {
        button.disabled = false;
      });
  }
}


/* =========================================================
   LANCEMENT DE LA PAGE
   ========================================================= */

(async function startAddPage() {
  const session =
    await requireSession();

  if (session) {
    artistInput.focus();
  }
})();
