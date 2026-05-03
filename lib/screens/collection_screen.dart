import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // <--- NÉCESSAIRE POUR LA VIBRATION
import 'package:cached_network_image/cached_network_image.dart';
import '../models/vinyl.dart';
import '../services/vinyl_service.dart';
import 'vinyl_detail_screen.dart';
import 'add_vinyl_screen.dart';

// On ajoute le mode CRATE
enum ViewMode { list, grid, crate }
enum SortMode { alphabetical, byYear }

class CollectionScreen extends StatefulWidget {
  const CollectionScreen({super.key});

  @override
  State<CollectionScreen> createState() => _CollectionScreenState();
}

class _CollectionScreenState extends State<CollectionScreen> {
  final VinylService _service = VinylService();
  ViewMode _viewMode = ViewMode.list; 
  SortMode _currentSort = SortMode.alphabetical;
  
  late PageController _crateController;
  double _currentPage = 0.0;
  int _lastVibratedIndex = 0; // Pour éviter que ça vibre en boucle sur le même disque

  @override
  void initState() {
    super.initState();
    _crateController = PageController(viewportFraction: 0.7);
    _crateController.addListener(() {
      double page = _crateController.page ?? 0.0;
      int roundedPage = page.round();

      // LOGIQUE DE VIBRATION : 
      // Si le disque au centre change, on envoie un petit impact
      if (roundedPage != _lastVibratedIndex) {
        HapticFeedback.lightImpact(); // Vibration légère type "flic"
        _lastVibratedIndex = roundedPage;
      }

      setState(() {
        _currentPage = page;
      });
    });
  }

  @override
  void dispose() {
    _crateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f0f0f),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0f0f0f),
        elevation: 0,
        title: const Text('MA DISCOTHÈQUE', 
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
        actions: [
          IconButton(
            icon: Icon(_currentSort == SortMode.alphabetical ? Icons.sort_by_alpha : Icons.history_toggle_off, color: Colors.white70),
            onPressed: () {
              setState(() {
                _currentSort = _currentSort == SortMode.alphabetical ? SortMode.byYear : SortMode.alphabetical;
              });
            },
          ),
          IconButton(
            icon: Icon(_getViewIcon(), color: Colors.redAccent),
            onPressed: () {
              setState(() {
                if (_viewMode == ViewMode.list) _viewMode = ViewMode.grid;
                else if (_viewMode == ViewMode.grid) _viewMode = ViewMode.crate;
                else _viewMode = ViewMode.list;
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: Colors.white),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddVinylScreen())),
          ),
        ],
      ),
      body: StreamBuilder<List<Vinyl>>(
        stream: _service.getVinyls(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Colors.redAccent));
          }
          final vinyls = snapshot.data ?? [];
          if (vinyls.isEmpty) return _buildEmptyState();

          if (_currentSort == SortMode.alphabetical) {
            vinyls.sort((a, b) => a.title.toLowerCase().compareTo(b.title.toLowerCase()));
          } else {
            vinyls.sort((a, b) => b.year.compareTo(a.year));
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8.0),
                child: Text("${vinyls.length} VINYLES DANS LE BAC", 
                  style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2)),
              ),
              Expanded(
                child: _buildCurrentView(vinyls),
              ),
            ],
          );
        },
      ),
    );
  }

  IconData _getViewIcon() {
    switch (_viewMode) {
      case ViewMode.list: return Icons.view_list_rounded;
      case ViewMode.grid: return Icons.grid_view_rounded;
      case ViewMode.crate: return Icons.layers; 
    }
  }

  Widget _buildCurrentView(List<Vinyl> vinyls) {
    switch (_viewMode) {
      case ViewMode.list: return _buildDetailedList(vinyls);
      case ViewMode.grid: return _buildCompactGrid(vinyls);
      case ViewMode.crate: return _buildCrateView(vinyls);
    }
  }

  Widget _buildCrateView(List<Vinyl> vinyls) {
    return PageView.builder(
      controller: _crateController,
      itemCount: vinyls.length,
      clipBehavior: Clip.none,
      itemBuilder: (context, index) {
        final vinyl = vinyls[index];
        double delta = index - _currentPage;

        return GestureDetector(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VinylDetailScreen(vinyl: vinyl))),
          child: Transform(
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.001)
              ..translate(0.0, delta.abs() * 30, 0.0) 
              ..rotateX(delta < 0 ? delta * 0.4 : 0)  
              ..rotateY(delta * 0.2), 
            alignment: Alignment.center,
            child: _buildCrateItem(vinyl, delta.abs() < 0.5),
          ),
        );
      },
    );
  }

  Widget _buildCrateItem(Vinyl vinyl, bool isCentered) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 40),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isCentered ? 0.8 : 0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: CachedNetworkImage(imageUrl: vinyl.coverUrl, fit: BoxFit.cover),
            ),
          ),
          if (isCentered) ...[
            const SizedBox(height: 20),
            Text(vinyl.title, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
            Text(vinyl.artist, style: const TextStyle(color: Colors.redAccent, fontSize: 14)),
          ]
        ],
      ),
    );
  }

  Widget _buildDetailedList(List<Vinyl> vinyls) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: vinyls.length,
      itemBuilder: (context, index) {
        final vinyl = vinyls[index];
        bool showHeader = false;
        if (_currentSort == SortMode.byYear) {
          if (index == 0 || vinyls[index - 1].year != vinyl.year) showHeader = true;
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (showHeader) _buildYearHeader(vinyl.year.toString()),
            _buildListTile(vinyl),
          ],
        );
      },
    );
  }

  Widget _buildCompactGrid(List<Vinyl> vinyls) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.8
      ),
      itemCount: vinyls.length,
      itemBuilder: (context, index) => GestureDetector(
        onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VinylDetailScreen(vinyl: vinyls[index]))),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(imageUrl: vinyls[index].coverUrl, fit: BoxFit.cover),
        ),
      ),
    );
  }

  Widget _buildYearHeader(String year) {
    return Padding(
      padding: const EdgeInsets.only(top: 20, bottom: 10, left: 4),
      child: Row(
        children: [
          const Icon(Icons.calendar_today, size: 14, color: Colors.redAccent),
          const SizedBox(width: 8),
          Text(year, style: const TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold, fontSize: 18)),
          const SizedBox(width: 10),
          const Expanded(child: Divider(color: Colors.white10)),
        ],
      ),
    );
  }

  Widget _buildListTile(Vinyl vinyl) {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => VinylDetailScreen(vinyl: vinyl))),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: Colors.white.withOpacity(0.03), borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Hero(
              tag: vinyl.id,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(imageUrl: vinyl.coverUrl, width: 60, height: 60, fit: BoxFit.cover),
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(vinyl.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  Text(vinyl.artist, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                ],
              ),
            ),
            Container(width: 12, height: 12, decoration: BoxDecoration(color: _parseColor(vinyl.editionColor), shape: BoxShape.circle)),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(child: Text("Bac vide...", style: TextStyle(color: Colors.white24)));
  }

  Color _parseColor(String hexColor) {
    hexColor = hexColor.replaceAll('#', '');
    if (hexColor.length == 6) hexColor = 'FF$hexColor';
    return Color(int.parse(hexColor, radix: 16));
  }
}