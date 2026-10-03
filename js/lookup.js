/* ===== lookup.js : MusicBrainz (métadonnées) + Cover Art Archive (pochettes). Sans clé API. ===== */
const MB = 'https://musicbrainz.org/ws/2/release/';
let lastCall = 0;

/* MusicBrainz impose ~1 requête/s : on espace les appels */
async function mbSearch(query) {
  const wait = 1100 - (Date.now() - lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
  const r = await fetch(`${MB}?query=${encodeURIComponent(query)}&fmt=json&limit=5`, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('MusicBrainz ' + r.status);
  return (await r.json()).releases || [];
}

const imgOk = url => new Promise(res => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = url; });

/* Pochette de la sortie exacte, sinon du release-group (toutes éditions confondues) */
async function coverFor(rel) {
  const urls = [`https://coverartarchive.org/release/${rel.id}/front-250`];
  const rg = rel['release-group'] && rel['release-group'].id;
  if (rg) urls.push(`https://coverartarchive.org/release-group/${rg}/front-250`);
  for (const u of urls) if (await imgOk(u)) return u;
  return null;
}

const toInfo = (r, cover) => ({
  artist: (r['artist-credit'] || []).map(a => a.name).join(', '),
  title: r.title || '',
  year: (r.date || '').slice(0, 4) || null,
  cover
});

/* Retourne {artist,title,year,cover} ou null (introuvable, hors-ligne, bloqué par CSP…) */
async function findRelease({ barcode, artist, title }) {
  const clean = s => s.replace(/["\\]/g, '');
  const queries = [];
  if (barcode) queries.push(`barcode:${barcode}`);
  if (artist && title) queries.push(`release:"${clean(title)}" AND artist:"${clean(artist)}"`);
  for (const q of queries) {
    try {
      const rels = await mbSearch(q);
      if (!rels.length) continue;
      for (const r of rels.slice(0, 3)) {         // 1er résultat qui a une pochette
        const cover = await coverFor(r);
        if (cover) return toInfo(r, cover);
      }
      return toInfo(rels[0], null);               // sinon métadonnées sans pochette
    } catch (e) { /* réseau indisponible : on tente la requête suivante */ }
  }
  return null;
}
