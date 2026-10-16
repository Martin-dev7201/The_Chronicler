/* =========================================================
   THE_CHRONICLER
   FICHE VINYLE V3
   ========================================================= */

const $v = selector =>
  document.querySelector(selector);


const esc = value =>
  String(value ?? '').replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[character]
  );


/* =========================================================
   COLLECTION
   ========================================================= */

function readItems() {
  try {
    const value =
      JSON.parse(
        localStorage.getItem('vv_items')
        ||
        '[]'
      );

    return Array.isArray(value)
      ? value
      : [];
  }

  catch (error) {
    console.error(
      'Collection :',
      error
    );

    return [];
  }
}


function saveItems() {
  localStorage.setItem(
    'vv_items',
    JSON.stringify(items)
  );
}


const items =
  readItems();


/* =========================================================
   IDENTIFIER LE VINYLE
   ========================================================= */

const params =
  new URLSearchParams(
    location.search
  );


const requestedId =
  params.get('id');


const requestedIndex =
  params.get('index');


function getVinylId(item) {
  return (
    item?.id
    ??
    item?.discogs_id
    ??
    item?.discogsId
    ??
    null
  );
}


function findRequestedVinyl() {

  if (
    requestedIndex !== null
    &&
    requestedIndex !== ''
  ) {

    const index =
      Number(requestedIndex);

    if (
      Number.isInteger(index)
      &&
      index >= 0
      &&
      index < items.length
    ) {

      return {
        item: items[index],
        index
      };

    }

  }


  if (
    requestedId !== null
    &&
    requestedId !== ''
  ) {

    const index =
      items.findIndex(
        vinyl =>
          String(
            getVinylId(vinyl)
          )
          ===
          String(requestedId)
      );

    if (index !== -1) {

      return {
        item: items[index],
        index
      };

    }

  }


  if (
    requestedId !== null
    &&
    requestedId !== ''
  ) {

    const index =
      Number(requestedId);

    if (
      Number.isInteger(index)
      &&
      index >= 0
      &&
      index < items.length
    ) {

      return {
        item: items[index],
        index
      };

    }

  }


  return {
    item: null,
    index: -1
  };

}


const resolved =
  findRequestedVinyl();


const item =
  resolved.item;


const itemIndex =
  resolved.index;


/* =========================================================
   OUTILS
   ========================================================= */

function value(...values) {

  return (
    values.find(
      current =>
        current !== undefined
        &&
        current !== null
        &&
        String(current).trim() !== ''
    )
    ??
    '—'
  );

}


function genres(input) {

  return Array.isArray(input)
    ? input
    : String(input || '')
        .split(/[,;/]/)
        .map(
          item =>
            item.trim()
        )
        .filter(Boolean);

}


/* =========================================================
   AFFICHAGE
   ========================================================= */

function render() {

  if (!item) {

    $v('#vinylPage').hidden =
      true;

    $v('#vinylNotFound').hidden =
      false;

    console.error(
      'Vinyle introuvable',
      {
        requestedId,
        requestedIndex,
        collectionLength:
          items.length
      }
    );

    return;

  }


  $v('#vinylNotFound').hidden =
    true;

  $v('#vinylPage').hidden =
    false;


  document.title =
    `${value(
      item.title,
      'Vinyle'
    )} — THE_CHRONICLER`;


  /* =======================================================
     INFORMATIONS PRINCIPALES
     ======================================================= */

  $v('#vinylTitle').textContent =
    value(item.title);


  $v('#vinylArtist').textContent =
    value(item.artist);


  $v('#vinylFormat').textContent =
    String(
      value(
        item.format,
        'VINYLE'
      )
    ).toUpperCase();


  $v('#vinylYear').textContent =
    value(item.year);


  $v('#vinylCountry').textContent =
    value(item.country);


  $v('#vinylLabel').textContent =
    value(item.label);


  $v('#vinylCatalog').textContent =
    value(
      item.catalog_number,
      item.catalogNumber
    );


  $v('#vinylEditionFormat').textContent =
    value(item.format);


  $v('#vinylColor').textContent =
    value(
      item.vinyl_color,
      item.vinylColor,
      'Noir'
    );


  $v('#vinylPlays').textContent =
    Number(item.plays)
    ||
    0;


  $v('#vinylDiscogsId').textContent =
    value(
      item.discogs_id,
      item.discogsId
    );


  /* =======================================================
     DATE D'AJOUT
     ======================================================= */

  if (item.added) {

    const date =
      new Date(
        item.added
      );


    $v('#vinylAdded').textContent =
      Number.isNaN(
        date.getTime()
      )
        ? '—'
        : new Intl.DateTimeFormat(
            'fr-FR',
            {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }
          ).format(date);

  }

  else {

    $v('#vinylAdded').textContent =
      '—';

  }


  /* =======================================================
     POCHETTE
     ======================================================= */

  const cover =
    item.cover
    ||
    item.disc_image
    ||
    item.discImage;


  $v('#vinylCover').innerHTML =
    cover
      ? `
          <img
            src="${esc(cover)}"
            alt="Pochette de ${esc(item.title || 'vinyle')}"
          >
        `
      : `
          <div class="cover-placeholder">
            ◎
          </div>
        `;


  /* =======================================================
     GENRES / STYLES
     ======================================================= */

  const tags = [
    ...genres(
      item.genre
    ),
    ...genres(
      item.styles
      ||
      item.style
    )
  ];


  $v('#vinylTags').innerHTML =
    [...new Set(tags)]
      .slice(0, 8)
      .map(
        tag =>
          `<span>${esc(tag)}</span>`
      )
      .join('');


  /* =======================================================
     NOTES
     ======================================================= */

  if (item.notes) {

    $v('#vinylNotes').textContent =
      item.notes;

    $v('#vinylNotes').hidden =
      false;

  }

  else {

    $v('#vinylNotes').hidden =
      true;

  }


  /* =======================================================
     LOGO ARTISTE / GROUPE
     ======================================================= */

  const logo =
    item.artist_logo
    ||
    item.artistLogo;


  if (logo) {

    $v('#artistLogo').src =
      logo;

    $v('#artistLogo').hidden =
      false;

  }

  else {

    $v('#artistLogo').hidden =
      true;

  }


  /* =======================================================
     TRACKLIST
     ======================================================= */

  if (
    Array.isArray(
      item.tracklist
    )
    &&
    item.tracklist.length
  ) {

    $v('#tracklist').innerHTML =
      item.tracklist
        .map(
          (track, index) => `
            <div class="track-row">

              <span>
                ${esc(
                  track.position
                  ||
                  String(
                    index + 1
                  ).padStart(
                    2,
                    '0'
                  )
                )}
              </span>

              <strong>
                ${esc(
                  track.title
                  ||
                  'Sans titre'
                )}
              </strong>

              <small>
                ${esc(
                  track.duration
                  ||
                  ''
                )}
              </small>

            </div>
          `
        )
        .join('');

  }

  else {

    $v('#tracklist').innerHTML =
      `
        <div class="mini-empty">
          La tracklist n'est pas encore enregistrée pour cette édition.
        </div>
      `;

  }


  /* =======================================================
     STREAMING
     ======================================================= */

  renderStreamingLinks();


  /* =======================================================
     SUGGESTIONS
     ======================================================= */

  renderSuggestions();

}


/* =========================================================
   STREAMING
   ========================================================= */

function renderStreamingLinks() {

  const searchText =
    `${item.artist || ''} ${item.title || ''}`
      .trim();


  const query =
    encodeURIComponent(
      searchText
    );


  const spotifyUrl =
    `https://open.spotify.com/search/${query}`;


  const youtubeUrl =
    `https://www.youtube.com/results?search_query=${query}`;


  const appleUrl =
    `https://music.apple.com/fr/search?term=${query}`;


  const deezerUrl =
    `https://www.deezer.com/search/${query}`;


  $v('#streamingLinks').innerHTML = `

    <a
      class="streaming-social spotify"
      href="${spotifyUrl}"
      target="_blank"
      rel="noopener"
      aria-label="Rechercher sur Spotify"
    >

      <span class="streaming-tooltip">
        Spotify
      </span>

      <span class="streaming-icon">

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.58 14.42a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.57-1.04 8.5-.59 11.66 1.34.36.21.47.68.25 1.03Zm1.47-3.26a.94.94 0 0 1-1.29.31c-3.22-1.98-8.13-2.55-11.94-1.4a.94.94 0 1 1-.54-1.8c4.35-1.31 9.76-.67 13.46 1.6.44.27.58.85.31 1.29Zm.13-3.39C14.32 7.48 7.96 7.27 4.27 8.38a1.13 1.13 0 0 1-.65-2.16c4.24-1.28 11.29-1.03 15.71 1.59a1.13 1.13 0 0 1-1.15 1.96Z"
          />
        </svg>

      </span>

    </a>


    <a
      class="streaming-social youtube"
      href="${youtubeUrl}"
      target="_blank"
      rel="noopener"
      aria-label="Rechercher sur YouTube"
    >

      <span class="streaming-tooltip">
        YouTube
      </span>

      <span class="streaming-icon">

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z"
          />
        </svg>

      </span>

    </a>


    <a
      class="streaming-social apple"
      href="${appleUrl}"
      target="_blank"
      rel="noopener"
      aria-label="Rechercher sur Apple Music"
    >

      <span class="streaming-tooltip">
        Apple Music
      </span>

      <span class="streaming-icon">

        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M18.5 3.4v11.4a3.5 3.5 0 1 1-2-3.15V6.9l-7 1.45v8.45a3.5 3.5 0 1 1-2-3.15V6.72L18.5 4.4v-1Z"
          />
        </svg>

      </span>

    </a>


    <a
      class="streaming-social deezer"
      href="${deezerUrl}"
      target="_blank"
      rel="noopener"
      aria-label="Rechercher sur Deezer"
    >

      <span class="streaming-tooltip">
        Deezer
      </span>

      <span class="streaming-icon deezer-bars">

        <i></i>
        <i></i>
        <i></i>
        <i></i>

      </span>

    </a>

  `;

}


/* =========================================================
   SUGGESTIONS
   ========================================================= */

function renderSuggestions() {

  const currentGenres =
    genres(
      item.genre
    )
      .map(
        genre =>
          genre.toLowerCase()
      );


  const suggestions =
    items
      .map(
        (vinyl, index) => ({
          vinyl,
          index
        })
      )
      .filter(
        result =>
          result.index !== itemIndex
      )
      .map(
        result => {

          let score =
            0;


          if (
            result.vinyl.artist
            &&
            item.artist
            &&
            result.vinyl.artist.toLowerCase()
            ===
            item.artist.toLowerCase()
          ) {

            score +=
              3;

          }


          score +=
            genres(
              result.vinyl.genre
            )
              .filter(
                genre =>
                  currentGenres.includes(
                    genre.toLowerCase()
                  )
              )
              .length;


          return {
            ...result,
            score
          };

        }
      )
      .filter(
        result =>
          result.score > 0
      )
      .sort(
        (a, b) =>
          b.score
          -
          a.score
      )
      .slice(
        0,
        5
      );


  $v('#suggestionsGrid').innerHTML =
    suggestions.length
      ? suggestions
          .map(
            ({
              vinyl,
              index
            }) => {

              const suggestionParams =
                new URLSearchParams();


              suggestionParams.set(
                'index',
                String(index)
              );


              const id =
                getVinylId(
                  vinyl
                );


              if (
                id !== null
              ) {

                suggestionParams.set(
                  'id',
                  String(id)
                );

              }


              const suggestionCover =
                vinyl.cover
                ||
                vinyl.disc_image
                ||
                vinyl.discImage;


              return `

                <a
                  class="suggestion-card"
                  href="vinyl.html?${suggestionParams.toString()}"
                >

                  <div>

                    ${
                      suggestionCover
                        ? `
                            <img
                              src="${esc(suggestionCover)}"
                              alt=""
                            >
                          `
                        : `
                            <div class="cover-placeholder">
                              ◎
                            </div>
                          `
                    }

                  </div>

                  <strong>
                    ${esc(
                      vinyl.title
                      ||
                      'Sans titre'
                    )}
                  </strong>

                  <span>
                    ${esc(
                      vinyl.artist
                      ||
                      ''
                    )}
                  </span>

                </a>

              `;

            }
          )
          .join('')

      : `
          <div class="mini-empty">
            Pas encore assez de vinyles similaires dans ta collection.
          </div>
        `;

}


/* =========================================================
   AJOUTER UNE ÉCOUTE
   ========================================================= */

$v('#addPlay').addEventListener(
  'click',
  () => {

    if (!item) {
      return;
    }


    item.plays =
      (
        Number(
          item.plays
        )
        ||
        0
      )
      +
      1;


    saveItems();


    $v('#vinylPlays').textContent =
      item.plays;

  }
);


/* =========================================================
   SUPPRIMER LE VINYLE
   ========================================================= */

$v('#deleteVinyl').addEventListener(
  'click',
  () => {

    if (
      !item
      ||
      itemIndex < 0
    ) {
      return;
    }


    const confirmed =
      window.confirm(
        `Supprimer définitivement « ${item.artist || 'Artiste inconnu'} — ${item.title || 'Sans titre'} » de ta collection ?`
      );


    if (!confirmed) {
      return;
    }


    items.splice(
      itemIndex,
      1
    );


    saveItems();


    location.href =
      'accueil.html';

  }
);


/* =========================================================
   MENU COMPTE
   ========================================================= */

const accountMenu =
  $v('#accountMenu');


$v('#accountButton').addEventListener(
  'click',
  () => {

    accountMenu.hidden =
      !accountMenu.hidden;

  }
);


function displayAccount(session) {

  const user =
    session?.user;


  const name =
    user?.user_metadata?.display_name
    ||
    user?.email?.split('@')[0];


  $v('#accountName').textContent =
    name
    ||
    'Non connecté';


  $v('#accountEmail').textContent =
    user?.email
    ||
    'Aucune session';


  $v('#accountStatus').textContent =
    user
      ? 'Connecté'
      : 'Hors ligne';


  $v('#avatarInitial').textContent =
    name?.[0]?.toUpperCase()
    ||
    '?';


  $v('.status-dot')
    .classList
    .toggle(
      'online',
      Boolean(user)
    );

}


supabaseClient.auth
  .getSession()
  .then(
    ({ data }) =>
      displayAccount(
        data.session
      )
  );


supabaseClient.auth
  .onAuthStateChange(
    (_event, session) =>
      displayAccount(
        session
      )
  );


$v('#logoutButton').addEventListener(
  'click',
  async () => {

    const {
      error
    } =
      await supabaseClient
        .auth
        .signOut();


    if (error) {

      console.error(
        error
      );

      return;

    }


    location.href =
      'connexion.html';

  }
);


/* =========================================================
   RACCOURCI RECHERCHE
   ========================================================= */

document.addEventListener(
  'keydown',
  event => {

    if (
      (
        event.ctrlKey
        ||
        event.metaKey
      )
      &&
      event.key.toLowerCase()
      ===
      'k'
    ) {

      event.preventDefault();


      $v('#globalSearch')
        .focus();

    }

  }
);


/* =========================================================
   LANCEMENT
   ========================================================= */

render();