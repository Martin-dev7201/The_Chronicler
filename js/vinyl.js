/* =========================================================
   THE_CHRONICLER
   FICHE VINYLE V3
   ========================================================= */

const $v = selector => document.querySelector(selector);

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
    const value = JSON.parse(
      localStorage.getItem('vv_items') || '[]'
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


const items = readItems();


/* =========================================================
   IDENTIFIER LE VINYLE DEMANDÉ
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
   OUTILS D'AFFICHAGE
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
        .map(item => item.trim())
        .filter(Boolean);
}


/* =========================================================
   AFFICHAGE DE LA FICHE
   ========================================================= */

function render() {
  if (!item) {
    $v('#vinylPage').hidden = true;
    $v('#vinylNotFound').hidden = false;

    console.error(
      'Vinyle introuvable',
      {
        requestedId,
        requestedIndex,
        collectionLength: items.length
      }
    );

    return;
  }

  $v('#vinylNotFound').hidden = true;
  $v('#vinylPage').hidden = false;

  document.title =
    `${value(item.title, 'Vinyle')} — THE_CHRONICLER`;

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
    Number(item.plays) || 0;

  $v('#vinylDiscogsId').textContent =
    value(
      item.discogs_id,
      item.discogsId
    );

  if (item.added) {
    const date =
      new Date(item.added);

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

  const tags = [
    ...genres(item.genre),
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

  if (
    Array.isArray(item.tracklist)
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
                  String(index + 1)
                    .padStart(2, '0')
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

  const query =
    encodeURIComponent(
      `${item.artist || ''} ${item.title || ''}`.trim()
    );

  $v('#streamingLinks').innerHTML = `
    <a
      href="https://www.youtube.com/results?search_query=${query}"
      target="_blank"
      rel="noopener"
    >
      YouTube
      <span>↗</span>
    </a>

    <a
      href="https://open.spotify.com/search/${query}"
      target="_blank"
      rel="noopener"
    >
      Spotify
      <span>↗</span>
    </a>

    <a
      href="https://music.apple.com/fr/search?term=${query}"
      target="_blank"
      rel="noopener"
    >
      Apple Music
      <span>↗</span>
    </a>

    <a
      href="https://www.deezer.com/search/${query}"
      target="_blank"
      rel="noopener"
    >
      Deezer
      <span>↗</span>
    </a>
  `;

  const currentGenres =
    genres(item.genre)
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
      .map(result => {
        let score = 0;

        if (
          result.vinyl.artist
          &&
          item.artist
          &&
          result.vinyl.artist.toLowerCase()
          ===
          item.artist.toLowerCase()
        ) {
          score += 3;
        }

        score +=
          genres(result.vinyl.genre)
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
      })
      .filter(
        result =>
          result.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 5);

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
                getVinylId(vinyl);

              if (id !== null) {
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
      (Number(item.plays) || 0)
      + 1;

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
    name || 'Non connecté';

  $v('#accountEmail').textContent =
    user?.email || 'Aucune session';

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
      await supabaseClient.auth.signOut();

    if (error) {
      console.error(error);
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
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault();

      $v('#globalSearch').focus();
    }
  }
);


/* =========================================================
   LANCEMENT
   ========================================================= */

render();
