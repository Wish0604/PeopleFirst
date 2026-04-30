import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../firebase';
import { loadLocalShelters, normalizeShelterRecords } from '../utils/shelters';

export function useSheltersSnapshot() {
  const [shelters, setShelters] = useState([]);

  useEffect(() => {
    let mounted = true;

    const applyLocalFallback = async () => {
      try {
        const localShelters = await loadLocalShelters();
        if (mounted) {
          setShelters(localShelters);
        }
      } catch (error) {
        if (mounted) {
          setShelters([]);
        }
      }
    };

    const unsubscribe = onSnapshot(
      collection(db, 'shelters'),
      (snapshot) => {
        const normalized = normalizeShelterRecords(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        if (mounted && normalized.length > 0) {
          setShelters(normalized);
          return;
        }

        void applyLocalFallback();
      },
      () => {
        void applyLocalFallback();
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return shelters;
}