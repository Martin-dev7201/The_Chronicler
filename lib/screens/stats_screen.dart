import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/vinyl.dart';
import '../services/vinyl_service.dart';

class StatsScreen extends StatelessWidget {
  final VinylService _service = VinylService();

  StatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0f0f0f),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('BACKSTAGE ANALYTICS', 
          style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 2, color: Colors.redAccent)),
      ),
      body: StreamBuilder<List<Vinyl>>(
        stream: _service.getVinyls(),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator(color: Colors.redAccent));
          
          final vinyls = snapshot.data!;
          if (vinyls.isEmpty) return _buildEmptyState();

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildQuickHeader(vinyls.length),
                const SizedBox(height: 30),
                const Text("RÉPARTITION DES GENRES", style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                _buildGenreChart(vinyls),
                const SizedBox(height: 40),
                const Text("TIMELINE DES DÉCENNIES", style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),
                _buildDecadeChart(vinyls),
              ],
            ),
          );
        },
      ),
    );
  }

  // --- WIDGETS DE STATS ---

  Widget _buildQuickHeader(int total) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.redAccent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.redAccent.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text("TOTAL DISQUES", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          Text("$total", style: const TextStyle(color: Colors.redAccent, fontSize: 32, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _buildGenreChart(List<Vinyl> vinyls) {
    // Calcul de la fréquence des genres
    Map<String, int> genreCounts = {};
    for (var v in vinyls) {
      genreCounts[v.genre] = (genreCounts[v.genre] ?? 0) + 1;
    }

    List<PieChartSectionData> sections = [];
    int i = 0;
    final colors = [Colors.redAccent, Colors.blueAccent, Colors.amberAccent, Colors.purpleAccent, Colors.greenAccent];

    genreCounts.forEach((genre, count) {
      sections.add(PieChartSectionData(
        value: count.toDouble(),
        title: genre,
        color: colors[i % colors.length],
        radius: 50,
        titleStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
      ));
      i++;
    });

    return SizedBox(
      height: 200,
      child: PieChart(PieChartData(sections: sections, centerSpaceRadius: 40)),
    );
  }

  Widget _buildDecadeChart(List<Vinyl> vinyls) {
    Map<int, int> decadeCounts = {};
    for (var v in vinyls) {
      int decade = (v.year / 10).floor() * 10;
      decadeCounts[decade] = (decadeCounts[decade] ?? 0) + 1;
    }

    // Trier les décennies par ordre chronologique
    var sortedDecades = decadeCounts.keys.toList()..sort();

    return SizedBox(
      height: 200,
      child: BarChart(
        BarChartData(
          gridData: const FlGridData(show: false),
          titlesData: FlTitlesData(
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (value, meta) => Text("${value.toInt()}s", style: const TextStyle(color: Colors.white38, fontSize: 10)),
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          barGroups: sortedDecades.map((d) => BarChartGroupData(
            x: d,
            barRods: [BarChartRodData(toY: decadeCounts[d]!.toDouble(), color: Colors.redAccent, width: 20, borderRadius: BorderRadius.circular(4))],
          )).toList(),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(child: Text("Pas assez de données pour les stats...", style: TextStyle(color: Colors.white24)));
  }
}