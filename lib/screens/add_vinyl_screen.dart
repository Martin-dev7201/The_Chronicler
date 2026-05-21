import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter/foundation.dart' show kIsWeb; 
import 'dart:io' show Platform;
import '../models/vinyl.dart';
import '../services/discogs_service.dart';
import '../services/vinyl_service.dart';
import 'package:cached_network_image/cached_network_image.dart';

class AddVinylScreen extends StatefulWidget {
  const AddVinylScreen({super.key});

  @override
  State<AddVinylScreen> createState() => _AddVinylScreenState();
}

class _AddVinylScreenState extends State<AddVinylScreen> {
  final _discogs = DiscogsService();
  final _vinylService = VinylService();
  final TextEditingController _searchController = TextEditingController();
  
  bool _isScanning = false; 
  bool _isLoading = false;
  bool _isSaving = false;
  
  DiscogsSearchResult? _foundRelease;
  List<DiscogsSearchResult> _searchResults = [];

  @override
  void initState() {
    super.initState();
    if (kIsWeb || Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
      _isScanning = false;
    } else {
      _isScanning = true;
    }
  }

  void _performSearch() async {
    if (_searchController.text.isEmpty) return;
    setState(() {
      _isLoading = true;
      _isScanning = false;
      _foundRelease = null;
    });

    final results = await _discogs.searchByName(_searchController.text);
    
    setState(() {
      _searchResults = results;
      _isLoading = false;
    });
  }

  Future<void> _saveToCollection() async {
    if (_foundRelease == null) return;
    setState(() => _isSaving = true);

    final newVinyl = Vinyl(
      id: '', 
      title: _foundRelease!.title,
      artist: _foundRelease!.artist,
      genre: _foundRelease!.genre,
      style: _foundRelease!.style,
      year: _foundRelease!.year,
      editionLabel: 'Standard Edition',
      editionColor: '#1a1a1a', // Couleur de base, la palette gère le reste au détail !
      coverUrl: _foundRelease!.coverUrl,
      artistLogoUrl: '', 
      discs: [
        Disc(
          name: 'Disc 1',
          tracks: _foundRelease!.tracklist.map((t) => Track(id: t.position, title: t.title)).toList(),
        ),
      ],
    );

    await _vinylService.addVinyl(newVinyl);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${newVinyl.title} ajouté ! 🤘'), backgroundColor: Colors.redAccent),
      );
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f0f0f),
      appBar: AppBar(
        title: const Text('AJOUTER UN VINYLE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              onSubmitted: (_) => _performSearch(),
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: "Artiste, album, code-barres...",
                hintStyle: const TextStyle(color: Colors.white24),
                prefixIcon: const Icon(Icons.search, color: Colors.redAccent),
                filled: true,
                fillColor: const Color(0xFF1a1a1a),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.send, color: Colors.redAccent),
                  onPressed: _performSearch,
                ),
              ),
            ),
          ),
          Expanded(child: _buildMainContent()),
        ],
      ),
    );
  }

  Widget _buildMainContent() {
    if (_isLoading) return const Center(child: MinimalistDrummerLoader());

    if (_foundRelease != null) return _buildPreview();
    if (_searchResults.isNotEmpty) return _buildSearchResults();

    if (_isScanning) {
      return MobileScanner(
        onDetect: (capture) async {
          final List<Barcode> barcodes = capture.barcodes;
          if (barcodes.isNotEmpty && _isScanning) {
            setState(() => _isScanning = false);
            final res = await _discogs.searchByBarcode(barcodes.first.rawValue!);
            if (res != null) setState(() => _foundRelease = res);
          }
        },
      );
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_rounded, size: 80, color: Colors.white.withOpacity(0.1)),
          const SizedBox(height: 10),
          const Text("Tape le nom d'un album ou d'un artiste", style: TextStyle(color: Colors.white24)),
        ],
      ),
    );
  }

  Widget _buildSearchResults() {
    return ListView.builder(
      itemCount: _searchResults.length,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemBuilder: (context, index) {
        final res = _searchResults[index];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(vertical: 8),
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: CachedNetworkImage(
              imageUrl: res.coverUrl, width: 50, height: 50, fit: BoxFit.cover, 
              errorWidget: (_, __, ___) => const Icon(Icons.album, color: Colors.white24)
            ),
          ),
          title: Text(res.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          subtitle: Text(res.artist, style: const TextStyle(color: Colors.white54)),
          onTap: () async {
            setState(() {
              _foundRelease = res;
              _searchResults = [];
              _isLoading = false;
            });

            final fullRelease = await _discogs.fetchReleaseById(res.discogsId, {});
            if (fullRelease != null && mounted) {
              setState(() {
                _foundRelease = fullRelease;
              });
            }
          },
        );
      },
    );
  }

  Widget _buildPreview() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: CachedNetworkImage(imageUrl: _foundRelease!.coverUrl, height: 220, width: 220, fit: BoxFit.cover),
          ),
          const SizedBox(height: 20),
          Text(_foundRelease!.title, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
          Text(_foundRelease!.artist, style: const TextStyle(color: Colors.redAccent, fontSize: 18)),
          const Divider(color: Colors.white10, height: 40),
          SizedBox(
            width: double.infinity, height: 55,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _saveToCollection,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isSaving 
                ? const CircularProgressIndicator(color: Colors.white)
                : const Text("AJOUTER À MA COLLECTION", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
          TextButton(
            onPressed: () => setState(() => _foundRelease = null),
            child: const Text("ANNULER", style: TextStyle(color: Colors.white38)),
          ),
        ],
      ),
    );
  }
}

class MinimalistDrummerLoader extends StatefulWidget {
  const MinimalistDrummerLoader({super.key});
  @override
  State<MinimalistDrummerLoader> createState() => _MinimalistDrummerLoaderState();
}

class _MinimalistDrummerLoaderState extends State<MinimalistDrummerLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 400))..repeat(reverse: true);
    _animation = CurvedAnimation(parent: _controller, curve: Curves.elasticIn);
  }

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [ _buildStick(true), const SizedBox(width: 30), _buildStick(false) ],
        ),
        const SizedBox(height: 10),
        Container(
          width: 70, height: 70,
          decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.redAccent, width: 3)),
          child: const Center(child: Icon(Icons.bolt, color: Colors.redAccent, size: 30)),
        ),
        const SizedBox(height: 20),
        const Text("MIXAGE EN COURS...", style: TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2)),
      ],
    );
  }

  Widget _buildStick(bool isLeft) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.rotate(
          angle: isLeft ? -_animation.value * 0.5 : _animation.value * 0.5,
          origin: const Offset(0, 20),
          child: Container(width: 4, height: 30, decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2))),
        );
      },
    );
  }
}