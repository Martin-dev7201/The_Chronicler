class Vinyl {
  final String id;
  final String title;
  final String artist;
  final String genre;
  final String style;
  final int year;
  final String editionLabel;
  final String editionColor;
  final String coverUrl;
  final String artistLogoUrl;
  final List<Disc> discs;
  final String source; 
  final bool isWishlist; 

  Vinyl({
    required this.id,
    required this.title,
    required this.artist,
    required this.genre,
    required this.style,
    required this.year,
    required this.editionLabel,
    required this.editionColor,
    required this.coverUrl,
    required this.artistLogoUrl,
    required this.discs,
    this.source = "Discogs",
    this.isWishlist = false,
  });

  factory Vinyl.fromFirestore(Map<String, dynamic> data, String id) {
    return Vinyl(
      id: id,
      title: data['title'] ?? '',
      artist: data['artist'] ?? '',
      genre: data['genre'] ?? '',
      style: data['style'] ?? '',
      year: data['year'] ?? 0,
      editionLabel: data['edition_label'] ?? '',
      editionColor: data['edition_color'] ?? '#1a1a1a',
      coverUrl: data['cover_url'] ?? '',
      artistLogoUrl: data['artist_logo_url'] ?? '',
      source: data['source'] ?? 'Discogs',
      isWishlist: data['is_wishlist'] ?? false,
      discs: (data['discs'] as List? ?? [])
          .map((d) => Disc.fromMap(d))
          .toList(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'artist': artist,
      'genre': genre,
      'style': style,
      'year': year,
      'edition_label': editionLabel,
      'edition_color': editionColor,
      'cover_url': coverUrl,
      'artist_logo_url': artistLogoUrl,
      'source': source,
      'is_wishlist': isWishlist,
      'discs': discs.map((d) => d.toMap()).toList(),
    };
  }
}

class Disc {
  final String name;
  final List<Track> tracks;

  Disc({required this.name, required this.tracks});

  factory Disc.fromMap(Map<String, dynamic> data) {
    return Disc(
      name: data['name'] ?? '',
      tracks: (data['tracks'] as List? ?? [])
          .map((t) => Track.fromMap(t))
          .toList(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'tracks': tracks.map((t) => t.toMap()).toList(),
    };
  }
}

class Track {
  final String id;
  final String title;
  final String? spotify;
  final String? deezer;
  final String? appleMusic;
  final String? youtube;

  Track({
    required this.id,
    required this.title,
    this.spotify,
    this.deezer,
    this.appleMusic,
    this.youtube,
  });

  factory Track.fromMap(Map<String, dynamic> data) {
    return Track(
      id: data['id'] ?? '',
      title: data['title'] ?? '',
      spotify: data['spotify'],
      deezer: data['deezer'],
      appleMusic: data['apple_music'],
      youtube: data['youtube'],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'spotify': spotify,
      'deezer': deezer,
      'apple_music': appleMusic,
      'youtube': youtube,
    };
  }
}