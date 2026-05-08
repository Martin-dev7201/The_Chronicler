import 'dart:convert';
import 'package:http/http.dart' as http;

class DiscogsService {
  static const String _token = 'OmcDIIjUBiUBxbpPrKOjyBIcalfeNHzXsdxvRTHk';
  static const String _baseUrl = 'https://api.discogs.com';

  // ── Recherche par code-barres ─────────────────────────────────────────
  Future<DiscogsSearchResult?> searchByBarcode(String barcode) async {
    final uri = Uri.parse(
      '$_baseUrl/database/search?barcode=$barcode&per_page=1&page=1',
    );
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode != 200) return null;

    final data = json.decode(response.body);
    final results = data['results'] as List? ?? [];
    if (results.isEmpty) return null;

    final r = results.first;
    // Récupère les détails complets (tracklist, styles, etc.)
    return _fetchRelease(r['id'].toString(), r);
  }

  // ── Recherche par nom ─────────────────────────────────────────────────
  Future<List<DiscogsSearchResult>> searchByName(String query) async {
    final uri = Uri.parse(
      '$_baseUrl/database/search'
      '?q=${Uri.encodeComponent(query)}'
      '&format=Vinyl&per_page=8&page=1',
    );
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode != 200) return [];

    final data = json.decode(response.body);
    final results = data['results'] as List? ?? [];
    return results.map((r) => DiscogsSearchResult.fromSearch(r)).toList();
  }

  // Dans _fetchRelease, ajoute un timeout
Future<DiscogsSearchResult?> _fetchRelease(
    String id, Map<String, dynamic> searchResult) async {
  try {
    final uri = Uri.parse('$_baseUrl/releases/$id');
    final response = await http.get(uri, headers: _headers)
        .timeout(const Duration(seconds: 5)); // ← TIMEOUT 5 secondes
    if (response.statusCode != 200) {
      return DiscogsSearchResult.fromSearch(searchResult);
    }
    final data = json.decode(response.body);
    return DiscogsSearchResult.fromRelease(data, searchResult);
  } catch (e) {
    // Si timeout ou erreur, on retourne le résultat de base sans tracklist
    return DiscogsSearchResult.fromSearch(searchResult);
  }
}

  Future<DiscogsSearchResult?> fetchReleaseById(
      String id, Map<String, dynamic> searchResult) {
    return _fetchRelease(id, searchResult);
  }

  // ── Suggestions par style ─────────────────────────────────────────────
  Future<List<DiscogsRelease>> getSuggestions({
    required String style,
    required String genre,
    String? excludeTitle,
    int limit = 6,
  }) async {
    final query = style.isNotEmpty ? style : genre;
    final uri = Uri.parse(
      '$_baseUrl/database/search'
      '?style=${Uri.encodeComponent(query)}'
      '&format=Vinyl&per_page=$limit&page=1',
    );
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode != 200) return [];

    final data = json.decode(response.body);
    final results = data['results'] as List? ?? [];
    return results
        .where((r) => r['title'] != excludeTitle)
        .take(limit)
        .map((r) => DiscogsRelease.fromJson(r))
        .toList();
  }

  Map<String, String> get _headers => {
        'Authorization': 'Discogs token=$_token',
        'User-Agent': 'VinylHube/1.0',
      };
}

// ── Résultat de recherche Discogs ──────────────────────────────────────
class DiscogsSearchResult {
  final String discogsId;
  final String title;
  final String artist;
  final String coverUrl;
  final int year;
  final String genre;
  final String style;
  final List<DiscogsTrack> tracklist;

  DiscogsSearchResult({
    required this.discogsId,
    required this.title,
    required this.artist,
    required this.coverUrl,
    required this.year,
    required this.genre,
    required this.style,
    required this.tracklist,
  });

  // Depuis un résultat de recherche (sans tracklist)
  factory DiscogsSearchResult.fromSearch(Map<String, dynamic> r) {
    final parts = (r['title'] as String? ?? '').split(' - ');
    final artist = parts.length > 1 ? parts[0] : '';
    final title = parts.length > 1 ? parts[1] : (r['title'] ?? '');
    final genres = r['genre'] as List? ?? [];
    final styles = r['style'] as List? ?? [];

    return DiscogsSearchResult(
      discogsId: r['id']?.toString() ?? '',
      title: title,
      artist: artist,
      coverUrl: r['cover_image'] ?? '',
      year: int.tryParse(r['year']?.toString() ?? '') ?? 0,
      genre: genres.isNotEmpty ? genres.first : '',
      style: styles.isNotEmpty ? styles.first : '',
      tracklist: [],
    );
  }

  // Depuis une release complète (avec tracklist)
  factory DiscogsSearchResult.fromRelease(
      Map<String, dynamic> release, Map<String, dynamic> searchResult) {
    final base = DiscogsSearchResult.fromSearch(searchResult);
    final tracks = release['tracklist'] as List? ?? [];

    return DiscogsSearchResult(
      discogsId: base.discogsId,
      title: release['title'] ?? base.title,
      artist: (release['artists'] as List? ?? []).isNotEmpty
          ? release['artists'].first['name'] ?? base.artist
          : base.artist,
      coverUrl: release['images'] != null &&
              (release['images'] as List).isNotEmpty
          ? release['images'].first['uri'] ?? base.coverUrl
          : base.coverUrl,
      year: release['year'] ?? base.year,
      genre: (release['genres'] as List? ?? []).isNotEmpty
          ? release['genres'].first
          : base.genre,
      style: (release['styles'] as List? ?? []).isNotEmpty
          ? release['styles'].first
          : base.style,
      tracklist: tracks
          .where((t) => t['type_'] == 'track')
          .map((t) => DiscogsTrack.fromMap(t))
          .toList(),
    );
  }
}

class DiscogsTrack {
  final String position;
  final String title;

  DiscogsTrack({required this.position, required this.title});

  factory DiscogsTrack.fromMap(Map<String, dynamic> m) {
    return DiscogsTrack(
      position: m['position'] ?? '',
      title: m['title'] ?? '',
    );
  }
}

// ── Suggestion (inchangée) ─────────────────────────────────────────────
class DiscogsRelease {
  final String title;
  final String coverUrl;
  final String year;
  final List<String> styles;
  final String resourceUrl;

  DiscogsRelease({
    required this.title,
    required this.coverUrl,
    required this.year,
    required this.styles,
    required this.resourceUrl,
  });

  factory DiscogsRelease.fromJson(Map<String, dynamic> json) {
    return DiscogsRelease(
      title: json['title'] ?? '',
      coverUrl: json['cover_image'] ?? '',
      year: json['year']?.toString() ?? '',
      styles: List<String>.from(json['style'] ?? []),
      resourceUrl: json['resource_url'] ?? '',
    );
  }
}