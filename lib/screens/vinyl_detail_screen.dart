import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:palette_generator/palette_generator.dart';
import '../models/vinyl.dart';
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
  
  // Correction du type : aligné sur DiscogsRelease pour éliminer le rouge !
  List<DiscogsRelease> _suggestions = [];
  bool _loadingSuggestions = false;

  // Couleurs dynamiques par défaut avant l'analyse
  Color _bgColor = const Color(0xFF0f0f0f);
  Color _accentColor = Colors.redAccent;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    )..repeat();
    _updatePalette();
    _loadSuggestions();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  // Extrait la couleur dominante et vibrante de la pochette
  Future<void> _updatePalette() async {
    try {
      final generator = await PaletteGenerator.fromImageProvider(
        CachedNetworkImageProvider(widget.vinyl.coverUrl),
      );
      if (mounted) {
        setState(() {
          _bgColor = generator.dominantColor?.color.withOpacity(0.8) ?? const Color(0xFF0f0f0f);
          _accentColor = generator.vibrantColor?.color ?? Colors.redAccent;
        });
      }
    } catch (e) {
      // Sécurité si l'image ne charge pas
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 600),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [_bgColor, Colors.black],
          ),
        ),
        child: CustomScrollView(
          slivers: [
            // ── 1. HEADER : DISQUE AUTOMATIQUE + POCHETTE ────────────────
            SliverAppBar(
              expandedHeight: 300,
              backgroundColor: Colors.transparent,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.white70),
                  onPressed: () => _confirmDelete(),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: _buildHero(_accentColor),
              ),
            ),

            // ── 2. BLOC INFOS (DÉGRADÉ ET LOGO À DROITE) ─────────────────
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.black.withOpacity(0.3), Colors.black.withOpacity(0.8)],
                  ),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                ),
                child: Column(
                  cross         : CrossAxisAlignment.start,
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
                                  style: TextStyle(
                                      color: _accentColor, 
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
                              width: 60, height: 60, fit: BoxFit.cover,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    _technicalRow(Icons.calendar_today, "Date", "${widget.vinyl.year}"),
                    _technicalRow(Icons.music_note, "Genre", widget.vinyl.genre),
                    _technicalRow(Icons.style, "Style", widget.vinyl.style),
                    
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Divider(color: Colors.white10),
                    ),

                    // ── 3. TRACKLIST ───────────────────────────────────────
                    const Text("TRACKLIST", 
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, letterSpacing: 2)),
                    const SizedBox(height: 16),
                    ...widget.vinyl.discs.expand((d) => d.tracks).map((t) => _buildTrackRow(t)),

                    const SizedBox(height: 40),

                    // ── 4. RECOMMANDATIONS VYNIL (SCROLL HORIZONTAL CORRECT) ──
                    const Text("DANS LE MÊME ESPRIT", 
                      style: TextStyle(color: Colors.white38, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                    const SizedBox(height: 16),
                    _loadingSuggestions 
                      ? Center(child: CircularProgressIndicator(color: _accentColor))
                      : _buildSuggestionsList(),
                  ],
                ),
              ),
            ),
          ],
        ),
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
            child: Container(
              width: 210, height: 210,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: discColor.withOpacity(0.9), // Teinte automatique du disque !
                border: Border.all(color: Colors.black, width: 2),
              ),
              child: CustomPaint(painter: DiscPainter(Colors.black.withOpacity(0.3))),
            ),
          ),
        ),
        Positioned(
          left: 40,
          child: Hero(
            tag: widget.vinyl.id,
            child: Container(
              width: 200, height: 200,
              decoration: BoxDecoration(
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 20, offset: const Offset(5, 5))],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: CachedNetworkImage(imageUrl: widget.vinyl.coverUrl, fit: BoxFit.cover),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _technicalRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.white38),
          const SizedBox(width: 8),
          Text("$label : ", style: const TextStyle(color: Colors.white38)),
          Text(value, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _buildTrackRow(Track track) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        children: [
          Text(track.id, style: TextStyle(color: _accentColor, fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(width: 15),
          Expanded(child: Text(track.title, style: const TextStyle(color: Colors.white, fontSize: 15))),
          if (track.spotify != null) _platformIcon('assets/spotify.png', Colors.green),
          if (track.youtube != null) _platformIcon('assets/youtube.png', Colors.red),
        ],
      ),
    );
  }

  Widget _platformIcon(String asset, Color color) {
    return Container(
      margin: const EdgeInsets.only(left: 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(shape: BoxShape.circle, color: color.withOpacity(0.1)),
      child: Icon(Icons.play_circle_fill, size: 18, color: color),
    );
  }

  Widget _buildSuggestionsList() {
    return SizedBox(
      height: 160,
      child: ListView.builder(
        scrollDirection: Axis.horizontal, // Corrigé !
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
                  child: CachedNetworkImage(imageUrl: s.coverUrl, height: 120, width: 120, fit: BoxFit.cover),
                ),
                const SizedBox(height: 6),
                Text(s.title, style: const TextStyle(color: Colors.white, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          );
        },
      ),
    );
  }

  void _confirmDelete() {
    // Logique de suppression
  }
}

class DiscPainter extends CustomPainter {
  final Color color;
  DiscPainter(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final paint = Paint()..style = PaintingStyle.stroke..strokeWidth = 1.0;

    for (int i = 4; i < 15; i++) {
      paint.color = color.withOpacity(0.05 + (i * 0.01));
      canvas.drawCircle(center, size.width / 2 - (i * 5), paint);
    }
  }

  @override bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}