import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:palette_generator/palette_generator.dart';
import '../models/vinyl.dart';
import '../services/vinyl_service.dart';
import '../services/discogs_service.dart';

class VinylDetailScreen extends StatefulWidget {
  final Vinyl vinyl;
  const VinylDetailScreen({super.key, required this.vinyl});

  @override
  State<VinylDetailScreen> createState() => _VinylDetailScreenState();
}

class _VinylDetailScreenState extends State<VinylDetailScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final VinylService _vinylService = VinylService();
  List<DiscogsRelease> _suggestions = [];
  bool _loadingSuggestions = false;
  Color _dominantColor = const Color(0xFF161616);

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
    _loadSuggestions();
    _extractColor();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _extractColor() async {
    try {
      final PaletteGenerator palette =
          await PaletteGenerator.fromImageProvider(
        NetworkImage(widget.vinyl.coverUrl),
        maximumColorCount: 5,
      );
      if (mounted) {
        setState(() {
          _dominantColor = palette.darkMutedColor?.color ??
              palette.dominantColor?.color ??
              const Color(0xFF161616);
        });
      }
    } catch (e) {
      // Garde la couleur par défaut
    }
  }

  Future<void> _loadSuggestions() async {
    setState(() => _loadingSuggestions = true);
    final suggestions = await DiscogsService().getSuggestions(
      style: widget.vinyl.style,
      genre: widget.vinyl.genre,
      excludeTitle: widget.vinyl.title,
    );
    if (mounted) {
      setState(() {
        _suggestions = suggestions;
        _loadingSuggestions = false;
      });
    }
  }

  Color _hexToColor(String hex) {
    return Color(int.parse(hex.replaceFirst('#', '0xFF')));
  }

  @override
  Widget build(BuildContext context) {
    final discColor = _hexToColor(widget.vinyl.editionColor);

    return Scaffold(
      backgroundColor: _dominantColor,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            backgroundColor: _dominantColor,
            leading: IconButton(
              icon: const Text('←',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold)),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: const Text('🗑️',
                    style: TextStyle(fontSize: 20)),
                onPressed: () => _confirmDelete(),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _buildHero(discColor),
            ),
          ),
          SliverToBoxAdapter(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 500),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    _dominantColor,
                    const Color(0xFF0f0f0f),
                  ],
                ),
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.vinyl.title,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 26,
                                    fontWeight: FontWeight.w900)),
                            Text(widget.vinyl.artist,
                                style: const TextStyle(
                                    color: Colors.redAccent,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w500)),
                          ],
                        ),
                      ),
                      if (widget.vinyl.artistLogoUrl.isNotEmpty)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: CachedNetworkImage(
                            imageUrl: widget.vinyl.artistLogoUrl,
                            width: 60,
                            height: 60,
                            fit: BoxFit.cover,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  _technicalRow('📅', "Date", "${widget.vinyl.year}"),
                  _technicalRow('🎵', "Genre", widget.vinyl.genre),
                  _technicalRow('🎸', "Style", widget.vinyl.style),
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: Divider(color: Colors.white10),
                  ),
                  const Text("TRACKLIST",
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2)),
                  const SizedBox(height: 16),
                  ...widget.vinyl.discs
                      .expand((d) => d.tracks)
                      .map((t) => _buildTrackRow(t)),
                  const SizedBox(height: 40),
                  const Text("DANS LE MÊME ESPRIT",
                      style: TextStyle(
                          color: Colors.white38,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5)),
                  const SizedBox(height: 16),
                  _loadingSuggestions
                      ? const Center(
                          child: CircularProgressIndicator(
                              color: Colors.redAccent))
                      : _buildSuggestionsList(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHero(Color discColor) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Positioned(
          right: 30,
          child: RotationTransition(
            turns: _controller,
            child: _buildVinylDisc(discColor),
          ),
        ),
        Positioned(
          left: 40,
          child: Hero(
            tag: widget.vinyl.id,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.5),
                      blurRadius: 20,
                      offset: const Offset(5, 5))
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: CachedNetworkImage(
                    imageUrl: widget.vinyl.coverUrl, fit: BoxFit.cover),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildVinylDisc(Color color) {
    return Container(
      width: 210,
      height: 210,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        border: Border.all(color: Colors.black, width: 2),
      ),
      child: CustomPaint(
          painter: DiscPainter(Colors.black.withValues(alpha: 0.3))),
    );
  }

  Widget _technicalRow(String emoji, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 8),
          Text("$label : ",
              style: const TextStyle(color: Colors.white38)),
          Text(value,
              style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _buildTrackRow(Track track) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Text(track.id,
              style: const TextStyle(
                  color: Colors.redAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 12)),
          const SizedBox(width: 15),
          Expanded(
              child: Text(track.title,
                  style: const TextStyle(
                      color: Colors.white, fontSize: 15))),
          if (track.spotify != null)
            const Text('🎵',
                style: TextStyle(fontSize: 16)),
          if (track.youtube != null)
            const Text('▶️',
                style: TextStyle(fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildSuggestionsList() {
    return SizedBox(
      height: 160,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _suggestions.length,
        itemBuilder: (context, index) {
          final s = _suggestions[index];
          return Container(
            width: 120,
            margin: const EdgeInsets.only(right: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                      imageUrl: s.coverUrl,
                      height: 120,
                      width: 120,
                      fit: BoxFit.cover),
                ),
                const SizedBox(height: 6),
                Text(s.title,
                    style: const TextStyle(
                        color: Colors.white, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          );
        },
      ),
    );
  }

  void _confirmDelete() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1a1a1a),
        title: const Text('Supprimer ?',
            style: TextStyle(color: Colors.white)),
        content: Text(
            'Supprimer "${widget.vinyl.title}" de ta collection ?',
            style: const TextStyle(color: Colors.white54)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler',
                style: TextStyle(color: Colors.white38)),
          ),
          TextButton(
            onPressed: () async {
              await _vinylService.deleteVinyl(widget.vinyl.id);
              if (mounted) {
                Navigator.pop(ctx);
                Navigator.pop(context);
              }
            },
            child: const Text('Supprimer',
                style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }
}

class DiscPainter extends CustomPainter {
  final Color color;
  DiscPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;
    for (int i = 4; i < 15; i++) {
      paint.color = color.withValues(alpha: 0.05 + (i * 0.01));
      canvas.drawCircle(center, size.width / 2 - (i * 5), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}