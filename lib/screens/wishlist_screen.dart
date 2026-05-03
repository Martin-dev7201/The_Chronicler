import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart'; // N'oublie pas d'ajouter share_plus dans ton pubspec.yaml
import '../models/vinyl.dart';
import '../services/vinyl_service.dart';
import 'vinyl_detail_screen.dart';

class WishlistScreen extends StatelessWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final VinylService _service = VinylService();

    return Scaffold(
      backgroundColor: const Color(0xFF0f0f0f),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0f0f0f),
        elevation: 0,
        title: const Text(
          '🎸 MES SOUHAITS',
          style: TextStyle(
            color: Colors.redAccent,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.2,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Colors.redAccent),
            onPressed: () async {
              // Logique de partage simple
              final list = await _service.getWishlist().first;
              if (list.isNotEmpty) {
                final text = "Voici ma liste de souhaits Vinyl Hube 🎁 :\n" + 
                  list.map((v) => "- ${v.title} de ${v.artist}").join("\n");
                Share.share(text);
              }
            },
          ),
        ],
      ),
      body: StreamBuilder<List<Vinyl>>(
        stream: _service.getWishlist(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.redAccent));
          }
          final wishlist = snapshot.data ?? [];

          if (wishlist.isEmpty) {
            return const Center(
              child: Text("Ta liste est vide, fais un vœu ! 🌠", 
                style: TextStyle(color: Colors.white24))
            );
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: wishlist.length,
                  itemBuilder: (context, index) {
                    final vinyl = wishlist[index];
                    return _buildWishlistTile(context, vinyl, _service);
                  },
                ),
              ),
              // Bouton Partager en bas (comme sur ton dessin)
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final list = await _service.getWishlist().first;
                      final text = "Ma Wishlist Vinyle 🎸 :\n" + 
                        list.map((v) => "• ${v.title} (${v.artist})").join("\n");
                      Share.share(text);
                    },
                    icon: const Icon(Icons.send_rounded, color: Colors.white),
                    label: const Text("PARTAGER MES SOUHAITS", 
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildWishlistTile(BuildContext context, Vinyl vinyl, VinylService service) {
    return Dismissible(
      key: Key(vinyl.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        color: Colors.red.withOpacity(0.2),
        child: const Icon(Icons.delete, color: Colors.redAccent),
      ),
      onDismissed: (_) => service.removeFromWishlist(vinyl.id),
      child: GestureDetector(
        onTap: () => Navigator.push(
          context, 
          MaterialPageRoute(builder: (_) => VinylDetailScreen(vinyl: vinyl))
        ),
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.03),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: vinyl.coverUrl, 
                  width: 60, height: 60, fit: BoxFit.cover
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(vinyl.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    Text(vinyl.artist, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                    const Text("Source: Discogs", style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const Icon(Icons.favorite, color: Colors.redAccent, size: 20),
            ],
          ),
        ),
      ),
    );
  }
}