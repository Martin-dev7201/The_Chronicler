/* =========================================================
   lookup.js
   Discogs via Supabase Edge Function
   Le token Discogs reste côté serveur.
   ========================================================= */

const SUPABASE_URL =
  'https://sngybbgdemsmpbaklbly.supabase.co';

/*
  IMPORTANT :
  Mets ici la PUBLISHABLE KEY Supabase.
  JAMAIS la secret key / service_role key.
*/
const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_rEYCIDtNTtgapZlvz8ST3Q_wwyeYB_8';

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );


/* =========================================================
   OUTILS
   ========================================================= */

function cleanText(value) {
  return String(value || '').trim();
}


/* =========================================================
   APPEL EDGE FUNCTION
   ========================================================= */

async function discogsFunction(body) {

  const {
    data,
    error
  } = await supabaseClient.functions.invoke(
    'discogs-search',
    {
      body
    }
  );

  if (error) {
    console.error(
      'Erreur Edge Function Discogs :',
      error
    );

    throw error;
  }

  return data;
}


/* =========================================================
   RECHERCHE DISCogs
   ========================================================= */

async function searchDiscogs({
  barcode = '',
  artist = '',
  title = ''
} = {}) {

  const data = await discogsFunction({
    action: 'search',

    barcode: cleanText(barcode),

    artist: cleanText(artist),

    title: cleanText(title),

    page: 1,

    perPage: 20
  });

  return data?.results || [];
}


/* =========================================================
   DÉTAIL D'UNE ÉDITION
   ========================================================= */

async function getDiscogsRelease(releaseId) {

  if (!releaseId) {
    throw new Error(
      'Identifiant Discogs manquant'
    );
  }

  const data = await discogsFunction({
    action: 'release',

    releaseId
  });

  return data?.release || null;
}


/* =========================================================
   EXTRACTION ARTISTE
   ========================================================= */

function getReleaseArtist(release) {

  if (!release) return '';

  if (Array.isArray(release.artists)) {

    return release.artists
      .map(a => a.name)
      .filter(Boolean)
      .join(', ');
  }

  return '';
}


/* =========================================================
   EXTRACTION FORMAT
   ========================================================= */

function getReleaseFormat(release) {

  if (!Array.isArray(release?.formats)) {
    return '';
  }

  return release.formats
    .map(format => {

      const parts = [
        format.qty,
        format.name,
        ...(format.descriptions || []),
        format.text
      ];

      return parts
        .filter(Boolean)
        .join(' ');
    })
    .filter(Boolean)
    .join(' / ');
}


/* =========================================================
   EXTRACTION COULEUR DU VINYLE
   ========================================================= */

function getVinylColor(release) {

  if (!Array.isArray(release?.formats)) {
    return null;
  }

  const formats = release.formats;

  const colorWords = [
    'black',
    'clear',
    'red',
    'blue',
    'green',
    'yellow',
    'orange',
    'purple',
    'pink',
    'white',
    'gold',
    'silver',
    'brown',
    'grey',
    'gray',
    'transparent',
    'marbled',
    'splatter',
    'picture disc'
  ];

  for (const format of formats) {

    const text = [
      format.name,
      ...(format.descriptions || []),
      format.text
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const found = colorWords.find(
      color => text.includes(color)
    );

    if (found) {
      return found;
    }
  }

  return null;
}


/* =========================================================
   EXTRACTION IMAGE
   ========================================================= */

function getReleaseImages(release) {

  if (!Array.isArray(release?.images)) {
    return [];
  }

  return release.images
    .map(image => ({
      uri: image.uri,
      type: image.type || '',
      width: image.width || 0,
      height: image.height || 0
    }))
    .filter(image => image.uri);
}


/* =========================================================
   POCHETTE
   ========================================================= */

function getCoverImage(release) {

  const images =
    getReleaseImages(release);

  if (!images.length) {
    return null;
  }

  const primary =
    images.find(
      image => image.type === 'primary'
    );

  return (
    primary?.uri ||
    images[0]?.uri ||
    null
  );
}


/* =========================================================
   IMAGE DISQUE
   ========================================================= */

function getDiscImage(release) {

  const images =
    getReleaseImages(release);

  if (!images.length) {
    return null;
  }

  /*
    Discogs ne garantit pas qu'une image soit
    explicitement identifiée comme "disque".

    On cherche donc une image secondaire.
    Si aucune n'existe, on laisse null afin
    d'afficher le disque graphique de secours.
  */

  const secondary =
    images.find(
      image => image.type === 'secondary'
    );

  return secondary?.uri || null;
}


/* =========================================================
   NORMALISATION D'UNE ÉDITION
   ========================================================= */

function normalizeRelease(release) {

  if (!release) {
    return null;
  }

  const labels =
    Array.isArray(release.labels)
      ? release.labels
      : [];

  const genres =
    Array.isArray(release.genres)
      ? release.genres
      : [];

  const styles =
    Array.isArray(release.styles)
      ? release.styles
      : [];

  return {

    discogsId:
      release.id || null,

    masterId:
      release.master_id || null,

    artist:
      getReleaseArtist(release),

    title:
      release.title || '',

    year:
      release.year || null,

    country:
      release.country || null,

    barcode:
      Array.isArray(release.identifiers)
        ? (
            release.identifiers.find(
              x => x.type?.toLowerCase() === 'barcode'
            )?.value || ''
          )
        : '',

    label:
      labels[0]?.name || null,

    catalogNumber:
      labels[0]?.catno || null,

    format:
      getReleaseFormat(release),

    genre:
      genres[0] || null,

    style:
      styles[0] || null,

    vinylColor:
      getVinylColor(release),

    cover:
      getCoverImage(release),

    discImage:
      getDiscImage(release),

    images:
      getReleaseImages(release),

    uri:
      release.uri || null
  };
}


/* =========================================================
   FONCTION PRINCIPALE
   ========================================================= */

async function findReleases({
  barcode,
  artist,
  title
}) {

  const results =
    await searchDiscogs({
      barcode,
      artist,
      title
    });

  return results;
}


/* =========================================================
   FONCTION COMPATIBILITÉ
   ========================================================= */

async function findRelease({
  barcode,
  artist,
  title
}) {

  const results =
    await findReleases({
      barcode,
      artist,
      title
    });

  if (!results.length) {
    return null;
  }

  const first =
    results[0];

  if (!first.id) {
    return null;
  }

  const release =
    await getDiscogsRelease(
      first.id
    );

  return normalizeRelease(
    release
  );
}