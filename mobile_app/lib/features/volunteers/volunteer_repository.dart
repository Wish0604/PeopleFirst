import 'package:cloud_firestore/cloud_firestore.dart';

class VolunteerRepository {
  VolunteerRepository._();

  static final VolunteerRepository instance = VolunteerRepository._();

  CollectionReference<Map<String, dynamic>> get _collection =>
      FirebaseFirestore.instance.collection('volunteers');

  DocumentReference<Map<String, dynamic>> documentFor(String volunteerId) =>
      _collection.doc(volunteerId);

  Stream<DocumentSnapshot<Map<String, dynamic>>> watchVolunteer(
      String volunteerId) {
    return documentFor(volunteerId).snapshots();
  }

  Future<DocumentSnapshot<Map<String, dynamic>>> fetchVolunteer(
      String volunteerId) {
    return documentFor(volunteerId).get();
  }

  Future<void> saveVolunteerProfile({
    required String volunteerId,
    required Map<String, dynamic> profile,
  }) {
    return documentFor(volunteerId).set(profile, SetOptions(merge: true));
  }

  Future<void> updateAvailability({
    required String volunteerId,
    required bool available,
  }) {
    return documentFor(volunteerId).set(
      {
        'available': available,
        'updatedAt': FieldValue.serverTimestamp(),
      },
      SetOptions(merge: true),
    );
  }
}
