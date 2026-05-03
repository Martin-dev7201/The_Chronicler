import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/vinyl.dart';

class VinylService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  
  // Noms des collections dans Firestore
  final String _collection = 'vinyls';
  final String _wishlistCollection = 'wishlist';

  // ─── MÉTHODES POUR LA COLLECTION POSSÉDÉE ──────────────────────────────

  Stream<List<Vinyl>> getVinyls() {
    return _db
        .collection(_collection)
        .orderBy('title')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Vinyl.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  Future<Vinyl?> getVinyl(String id) async {
    final doc = await _db.collection(_collection).doc(id).get();
    if (!doc.exists) return null;
    return Vinyl.fromFirestore(doc.data()!, doc.id);
  }

  Future<String> addVinyl(Vinyl vinyl) async {
    final doc = await _db
        .collection(_collection)
        .add(vinyl.toFirestore());
    return doc.id;
  }

  Future<void> updateVinyl(Vinyl vinyl) async {
    await _db
        .collection(_collection)
        .doc(vinyl.id)
        .update(vinyl.toFirestore());
  }

  Future<void> deleteVinyl(String id) async {
    await _db.collection(_collection).doc(id).delete();
  }

  // ─── MÉTHODES POUR LA LISTE DE SOUHAITS (WISHLIST) ───────────────────

  /// Récupère en temps réel les vinyles que tu souhaites avoir
  Stream<List<Vinyl>> getWishlist() {
    return _db
        .collection(_wishlistCollection)
        .orderBy('title')
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Vinyl.fromFirestore(doc.data(), doc.id))
            .toList());
  }

  /// Ajoute un vinyle à la liste de souhaits
  Future<String> addToWishlist(Vinyl vinyl) async {
    final doc = await _db
        .collection(_wishlistCollection)
        .add(vinyl.toFirestore());
    return doc.id;
  }

  /// Supprime un vinyle de la liste de souhaits (quand tu l'as enfin acheté !)
  Future<void> removeFromWishlist(String id) async {
    await _db.collection(_wishlistCollection).doc(id).delete();
  }

  /// MÉTHODE "BACKSTAGE" : Transférer de la Wishlist à la Collection
  /// C'est le moment où le Graal rejoint ton bac !
  Future<void> moveToCollection(Vinyl vinyl) async {
    // 1. On le retire de la wishlist
    await removeFromWishlist(vinyl.id);
    
    // 2. On l'ajoute à la collection avec isWishlist à false
    final newVinylData = vinyl.toFirestore();
    newVinylData['is_wishlist'] = false;
    
    await _db.collection(_collection).add(newVinylData);
  }
}