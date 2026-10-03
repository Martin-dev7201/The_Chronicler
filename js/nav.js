/* ===== nav.js : collection (liste/grille), ajout, stats, envies, partage ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[c]));

const hue = s => {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};


/* =========================================================
   PERSISTANCE LOCALE
   Étape suivante : remplacement par Supabase
   ========================================================= */

const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || d;
  } catch {
    return d;
  }
};

const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};


/* =========================================================
   DONNÉES
   ========================================================= */

let items = load('vv_items', [
  {
    id:'s1',
    artist:'Theydream',
    title:'Rocket Man',
    genre:'Électronique'
  },
  {
    id:'s2',
    artist:'Boris Brejcha & Anna Clue',
    title:'Acid Attack',
    genre:'Électronique'
  },
  {
    id:'s3',
    artist:'Boris Brejcha',
    title:'DJ Mixes Single Tracks',
    genre:'Électronique'
  },
  {
    id:'s4',
    artist:'Deniz Bul',
    title:'Free Your Mind',
    genre:'House'
  }
]);

const wishes = load('vv_wish', [
  {
    name:'Daft Punk – Discovery',
    url:'https://www.fnac.com'
  },
  {
    name:'Miles Davis – Kind of Blue',
    url:'https://www.cultura.com'
  }
]);

let layout = load('vv_layout', 'list');


/* =========================================================
   CONSTANTES
   ========================================================= */

const TITLES = {
  collection:'Récemment ajoutés',
  stats:'Statistiques',
  wish:'Liste d\u2019envies'
};

const STORES = {
  'fnac.com':'Fnac',
  'cultura.com':'Cultura',
  'amazon.fr':'Amazon',
  'amazon.com':'Amazon',
  'discogs.com':'Discogs',
  'gibertjoseph.com':'Gibert',
  'rakuten.com':'Rakuten'
};

const COVER_HOST = 'https://coverartarchive.org/';


/* =========================================================
   OUTILS
   ========================================================= */

function toast(t) {
  const e = $('#toast');

  e.textContent = t;
  e.hidden = false;

  clearTimeout(toast.t);

  toast.t = setTimeout(() => {
    e.hidden = true;
  }, 2400);
}


function parseLink(raw) {
  try {
    const u = new URL(
      /^https?:\/\//i.test(raw)
        ? raw
        : 'https://' + raw
    );

    if (!/^https?:$/.test(u.protocol)) return null;

    const host = u.hostname.replace(/^www\./, '');

    const key = Object.keys(STORES).find(
      d => host === d || host.endsWith('.' + d)
    );

    return {
      href:u.href,
      store:key ? STORES[key] : host
    };

  } catch {
    return null;
  }
}


function genreStats(w = () => 1) {
  const m = new Map();

  items.forEach(x => {
    if (x.genre) {
      m.set(
        x.genre,
        (m.get(x.genre) || 0) + w(x)
      );
    }
  });

  return [...m]
    .filter(e => e[1] > 0)
    .sort((a, b) => b[1] - a[1]);
}


/* =========================================================
   COLLECTION
   ========================================================= */

function sleeveStyle(x, size = 250) {
  const c = hue(x.artist + x.title);

  let s =
    `--a:hsl(${c},55%,45%);` +
    `--b:hsl(${(c + 60) % 360},45%,18%)`;

  if (
    x.cover &&
    x.cover.startsWith(COVER_HOST)
  ) {
    s +=
      `;--img:url(&quot;` +
      `${esc(x.cover.replace('/front-250', '/front-' + size))}` +
      `&quot;)`;
  }

  return s;
}


function renderList() {
  $('#list').className =
    'list' + (layout === 'grid' ? ' grid' : '');

  $('#count').textContent =
    items.length +
    ' disque' +
    (items.length > 1 ? 's' : '');

  document
    .querySelectorAll('[data-layout]')
    .forEach(b => {
      b.classList.toggle(
        'on',
        b.dataset.layout === layout
      );
    });

  $('#list').innerHTML = items.length
    ? items.map((x, i) => `
      <li class="row" data-id="${esc(x.id)}">

        <span class="num">
          ${String(i + 1).padStart(2, '0')}
        </span>

        <div class="cover">
          <i class="disc"></i>
          <i
            class="sleeve"
            style="${sleeveStyle(x)}">
          </i>
        </div>

        <div class="info">
          <strong>${esc(x.artist)}</strong>
          <span>${esc(x.title)}</span>
        </div>

        <button
          class="more"
          data-id="${esc(x.id)}"
          aria-label="Supprimer">
          •••
        </button>

      </li>
    `).join('')
    : '<li class="empty">Aucun vinyle. Appuie sur + pour en ajouter.</li>';

  $('#gl').innerHTML = [
    ...new Set(
      items
        .map(x => x.genre)
        .filter(Boolean)
    )
  ]
    .map(g => `<option value="${esc(g)}">`)
    .join('');
}


document
  .querySelectorAll('[data-layout]')
  .forEach(b => {

    b.onclick = () => {
      layout = b.dataset.layout;
      save('vv_layout', layout);
      renderList();
    };

  });


$('#list').onclick = e => {

  const b = e.target.closest('.more');

  if (b) {

    if (confirm('Supprimer ce vinyle ?')) {

      items = items.filter(
        x => x.id !== b.dataset.id
      );

      save('vv_items', items);
      renderAll();
    }

    return;
  }

  const r = e.target.closest('.row[data-id]');

  if (r) {
    openDisc(r.dataset.id);
  }
};


/* =========================================================
   AJOUT D'UN VINYLE
   Actuellement : MusicBrainz + Cover Art Archive
   Étape suivante : Discogs en source principale
   ========================================================= */

const sheet = $('#sheet');


$('.fab').onclick = () => {
  sheet.hidden = false;
  $('#f_bc').focus();
};


$('#cancel').onclick = () => {
  sheet.hidden = true;
};


sheet.onclick = e => {
  if (e.target === sheet) {
    sheet.hidden = true;
  }
};

/* =========================================================
   SÉLECTION D'UNE ÉDITION DISCOGS
   ========================================================= */

const editionSheet =
  $('#editionSheet');

const editionResults =
  $('#editionResults');

const editionCancel =
  $('#editionCancel');

let pendingSearch = null;


/* ---------------------------------------------------------
   Fermer le sélecteur
   --------------------------------------------------------- */

function closeEditionSheet() {

  editionSheet.hidden = true;

  editionResults.innerHTML = '';

  pendingSearch = null;
}


/* ---------------------------------------------------------
   Affichage des résultats
   --------------------------------------------------------- */

function renderEditionResults(results) {

  if (!results.length) {

    editionResults.innerHTML = `
      <div class="empty">
        Aucune édition Discogs trouvée.
      </div>
    `;

    return;
  }

  editionResults.innerHTML =
    results.map((x, index) => {

      const format =
        Array.isArray(x.format)
          ? x.format.join(', ')
          : (x.format || '');

      return `
        <button
          type="button"
          class="edition-card"
          data-release-id="${esc(x.id)}">

          <div class="edition-cover">

            ${
              x.coverImage
                ? `
                  <img
                    src="${esc(x.coverImage)}"
                    alt=""
                    loading="lazy">
                `
                : `
                  <div class="edition-cover-fallback">
                    <span>VINYL</span>
                  </div>
                `
            }

          </div>

          <div class="edition-info">

            <strong>
              ${esc(x.title || 'Titre inconnu')}
            </strong>

            <span>
              ${esc(x.year || 'Année inconnue')}
              ${x.country ? ' · ' + esc(x.country) : ''}
            </span>

            <span>
              ${esc(format || 'Format inconnu')}
            </span>

            ${
              x.label
                ? `
                  <span>
                    ${esc(x.label)}
                    ${x.catno ? ' · ' + esc(x.catno) : ''}
                  </span>
                `
                : ''
            }

            ${
              x.barcode
                ? `
                  <span>
                    EAN : ${esc(
                      Array.isArray(x.barcode)
                        ? x.barcode.join(', ')
                        : x.barcode
                    )}
                  </span>
                `
                : ''
            }

          </div>

          <span class="edition-arrow">
            ›
          </span>

        </button>
      `;

    }).join('');
}


/* ---------------------------------------------------------
   Cliquer sur une édition
   --------------------------------------------------------- */

editionResults.onclick = async e => {

  const card =
    e.target.closest(
      '[data-release-id]'
    );

  if (!card) return;

  const releaseId =
    card.dataset.releaseId;

  try {

    editionResults.innerHTML = `
      <div class="empty">
        Chargement de l'édition…
      </div>
    `;

    const release =
      await getDiscogsRelease(
        releaseId
      );

    const info =
      normalizeRelease(
        release
      );

    if (!info) {

      toast(
        'Impossible de récupérer cette édition'
      );

      return;
    }

    addSelectedRelease(
      info,
      pendingSearch
    );

    closeEditionSheet();

  } catch (error) {

    console.error(error);

    toast(
      'Erreur lors du chargement de l’édition'
    );
  }
};


/* ---------------------------------------------------------
   Annulation
   --------------------------------------------------------- */

editionCancel.onclick =
  closeEditionSheet;


/* ---------------------------------------------------------
   Ajout de l'édition choisie
   --------------------------------------------------------- */

function addSelectedRelease(
  info,
  formData
) {

  const artist =
    info.artist ||
    formData.artist;

  const title =
    info.title ||
    formData.title;

  if (!artist || !title) {

    toast(
      'Artiste et titre introuvables'
    );

    return;
  }

  items.unshift({

    id:
      'v' +
      Date.now().toString(36),

    artist,

    title,

    genre:
      info.style ||
      info.genre ||
      formData.genre ||
      '',

    barcode:
      info.barcode ||
      formData.barcode ||
      '',

    year:
      info.year ||
      null,

    cover:
      info.cover ||
      null,

    discImage:
      info.discImage ||
      null,

    discogsId:
      info.discogsId ||
      null,

    masterId:
      info.masterId ||
      null,

    country:
      info.country ||
      null,

    label:
      info.label ||
      null,

    catalogNumber:
      info.catalogNumber ||
      null,

    format:
      info.format ||
      null,

    vinylColor:
      info.vinylColor ||
      null,

    added:
      Date.now(),

    plays:
      0,

    notes:
      ''
  });

  save(
    'vv_items',
    items
  );

  $('#addf').reset();

  sheet.hidden = true;

  renderAll();

  toast(
    'Édition ajoutée à ta collection'
  );
}

$('#addf').onsubmit = async e => {

  e.preventDefault();

  const ok = $('#ok');

  ok.disabled = true;

  ok.textContent =
    'Recherche Discogs…';

  try {

    const barcode =
      $('#f_bc')
        .value
        .replace(/\D/g, '');

    const artist =
      $('#f_ar')
        .value
        .trim();

    const title =
      $('#f_ti')
        .value
        .trim();

    const genre =
      $('#f_ge')
        .value
        .trim();


    if (!barcode && (!artist || !title)) {

      toast(
        'Indique un code-barres ou artiste + titre'
      );

      return;
    }


    const results =
      await findReleases({

        barcode,

        artist,

        title

      });


    if (!results.length) {

      toast(
        'Aucune édition Discogs trouvée'
      );

      return;
    }


    /*
      On mémorise les informations
      du formulaire pendant que
      l'utilisateur choisit son édition.
    */

    pendingSearch = {

      barcode,

      artist,

      title,

      genre

    };


    renderEditionResults(
      results
    );


    editionSheet.hidden = false;


  } catch (error) {

    console.error(
      'Recherche Discogs :',
      error
    );

    toast(
      'Erreur pendant la recherche Discogs'
    );

  } finally {

    ok.disabled = false;

    ok.textContent =
      'Ajouter';
  }
};


/* =========================================================
   STATISTIQUES
   ========================================================= */

function renderStats() {

  const plays = items.reduce(
    (s, x) => s + (x.plays || 0),
    0
  );

  const heard = plays > 0;

  const g = genreStats(
    heard
      ? x => x.plays || 0
      : undefined
  );

  if (!g.length) {

    $('#v-stats').innerHTML =
      '<div class="empty">' +
      'Renseigne un style sur tes vinyles pour voir les stats.' +
      '</div>';

    return;
  }

  const max = g[0][1];

  $('#v-stats').innerHTML = `

    <div class="stat-hero">

      <small>
        ${heard
          ? 'Style le plus écouté'
          : 'Style le plus présent'}
      </small>

      <strong>
        ${esc(g[0][0])}
      </strong>

    </div>

    <div class="figs">

      <div>
        <strong>${items.length}</strong>
        <span>disques</span>
      </div>

      <div>
        <strong>${g.length}</strong>
        <span>styles</span>
      </div>

      ${
        heard
          ? `
            <div>
              <strong>${plays}</strong>
              <span>écoutes</span>
            </div>
          `
          : ''
      }

    </div>

    ${
      g.map(([n, c]) => `

        <div class="bar">

          <span>${esc(n)}</span>

          <span class="track">
            <i style="--w:${c / max * 100}%"></i>
          </span>

          <em>${c}</em>

        </div>

      `).join('')
    }
  `;
}


/* =========================================================
   LISTE D'ENVIES
   ========================================================= */

function renderWish() {

  $('#wl').innerHTML = wishes.length

    ? wishes.map((w, i) => {

      const l = parseLink(w.url);
      const c = hue(w.name);

      return `

        <li class="row wrow">

          <div class="cover">

            <i
              class="sleeve"
              style="
                --a:hsl(${c},55%,45%);
                --b:hsl(${(c + 60) % 360},45%,18%)
              ">
            </i>

          </div>

          <div class="info">

            <strong>
              ${esc(w.name)}
            </strong>

            <span>
              ${esc(l ? l.store : '')}
            </span>

          </div>

          <a
            href="${esc(l ? l.href : '#')}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ouvrir le lien">
            ↗
          </a>

          <button
            class="del"
            data-i="${i}"
            aria-label="Retirer">
            ✕
          </button>

        </li>
      `;

    }).join('')

    : '<li class="empty">' +
      'Aucun disque souhaité. Colle un lien Fnac, Cultura…' +
      '</li>';
}


$('#v-wish').innerHTML = `

  <form
    class="add"
    id="wf">

    <input
      id="wn"
      placeholder="Artiste – titre"
      autocomplete="off"
      required>

    <input
      id="wu"
      type="text"
      inputmode="url"
      placeholder="Lien Fnac, Cultura, Amazon…"
      autocapitalize="off"
      required>

    <button class="pill">
      Ajouter
    </button>

  </form>

  <ol
    class="list"
    id="wl">
  </ol>
`;


$('#wf').onsubmit = e => {

  e.preventDefault();

  const l = parseLink(
    $('#wu').value.trim()
  );

  if (!l) {
    return toast('Lien invalide');
  }

  wishes.unshift({

    name:$('#wn').value.trim(),

    url:l.href
  });

  save('vv_wish', wishes);

  e.target.reset();

  renderWish();
};


$('#wl').onclick = e => {

  const b = e.target.closest('.del');

  if (b) {

    wishes.splice(
      +b.dataset.i,
      1
    );

    save('vv_wish', wishes);

    renderWish();
  }
};


/* =========================================================
   NAVIGATION
   ========================================================= */

function show(v) {

  document
    .querySelectorAll('.view')
    .forEach(s => {

      s.classList.toggle(
        'on',
        s.id === 'v-' + v
      );

    });

  document
    .querySelectorAll('.tab[data-view]')
    .forEach(b => {

      b.classList.toggle(
        'on',
        b.dataset.view === v
      );

    });

  $('#title').textContent = TITLES[v];

  $('.panel').scrollTop = 0;
}


document
  .querySelectorAll('.tab[data-view]')
  .forEach(b => {

    b.onclick = () => {
      show(b.dataset.view);
    };

  });


/* =========================================================
   PARTAGE
   ========================================================= */

$('#share').onclick = async () => {

  const g = genreStats();

  const text =
    `Ma collection de vinyles : ${items.length} disques.` +
    (
      g.length
        ? ` Style le plus présent : ${g[0][0]}.`
        : ''
    );

  try {

    if (navigator.share) {

      await navigator.share({
        title:'Vinyl Vault',
        text
      });

      return;
    }

    await navigator.clipboard.writeText(text);

    toast('Copié dans le presse-papiers');

  } catch (e) {

    if (e.name !== 'AbortError') {
      toast('Partage indisponible ici');
    }
  }
};


/* =========================================================
   PAGE D'UN DISQUE
   ========================================================= */

let curId = null;
let spinT;


const cur = () =>
  items.find(
    x => x.id === curId
  );


function openDisc(id) {

  const x = items.find(
    i => i.id === id
  );

  if (!x) return;

  curId = id;


  /*
    POCHETTE

    Si une vraie image existe, on l'utilise.
    Sinon on garde une pochette graphique de secours.
  */

  const coverHtml = x.cover

    ? `
      <img
        src="${esc(x.cover)}"
        alt="Pochette de ${esc(x.artist)} – ${esc(x.title)}"
        loading="eager">
    `

    : `
      <div
        class="sleeve fallback-cover"
        style="${sleeveStyle(x, 500)}">
      </div>
    `;


  /*
    VINYLE

    Discogs pourra remplir x.discImage.

    Si aucune photo du disque n'est disponible,
    le CSS affichera un vinyle graphique de secours.
  */

  const discHtml = x.discImage

    ? `
      <img
        src="${esc(x.discImage)}"
        alt="Vinyle de cette édition"
        loading="eager">
    `

    : `
      <div class="disc-fallback"></div>
    `;


  $('#d_hero').innerHTML = `

    <div class="real-sleeve">
      ${coverHtml}
    </div>

    <div
      class="real-disc"
      id="d_disc">
      ${discHtml}
    </div>
  `;


  $('#d_art').textContent =
    x.artist || '';

  $('#d_tit').textContent =
    x.title || '';

  $('#d_plays').textContent =
    x.plays || 0;

  $('#d_year').value =
    x.year || '';

  $('#d_genre').value =
    x.genre || '';

  $('#d_bc').value =
    x.barcode || '';

  $('#d_notes').value =
    x.notes || '';

  $('#d_added').textContent =
    x.added
      ? new Date(x.added)
          .toLocaleDateString('fr-FR')
      : '—';

  $('#detail').hidden = false;

  $('#detail .panel').scrollTop = 0;
}


function closeDisc() {

  clearTimeout(spinT);

  curId = null;

  $('#detail').hidden = true;

  renderAll();
}


$('#d_back').onclick = closeDisc;


$('#d_del').onclick = () => {

  if (
    confirm('Supprimer ce vinyle ?')
  ) {

    items = items.filter(
      x => x.id !== curId
    );

    save('vv_items', items);

    closeDisc();
  }
};


/* =========================================================
   COMPTEUR D'ÉCOUTES
   ========================================================= */

$('#d_play').onclick = () => {

  const x = cur();

  if (!x) return;

  x.plays =
    (x.plays || 0) + 1;

  save('vv_items', items);

  $('#d_plays').textContent =
    x.plays;


  /*
    Animation du vinyle.

    Le CSS correspondant sera :
    .real-disc.spin { ... }
  */

  const d = $('#d_disc');

  if (d) {

    d.classList.add('spin');

    clearTimeout(spinT);

    spinT = setTimeout(
      () => d.classList.remove('spin'),
      6000
    );
  }
};


/* =========================================================
   MODIFICATION D'UNE FICHE
   ========================================================= */

const FIELDS = {

  d_year:(x, v) => {

    const y =
      parseInt(v, 10);

    x.year =
      y > 1900 && y < 2100
        ? y
        : null;
  },

  d_genre:(x, v) => {
    x.genre = v.trim();
  },

  d_bc:(x, v) => {
    x.barcode =
      v.replace(/\D/g, '');
  },

  d_notes:(x, v) => {
    x.notes =
      v.slice(0, 2000);
  }
};


Object
  .keys(FIELDS)
  .forEach(id => {

    $('#' + id).onchange = e => {

      const x = cur();

      if (!x) return;

      FIELDS[id](
        x,
        e.target.value
      );

      save('vv_items', items);

      if (id === 'd_year') {
        e.target.value =
          x.year || '';
      }
    };

  });


/* =========================================================
   RENDU GLOBAL
   ========================================================= */

function renderAll() {

  renderList();

  renderStats();

  renderWish();
}


renderAll();
