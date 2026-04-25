import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../firebase';

function sortByCreatedAtDesc(items) {
  return [...items].sort((a, b) => {
    const aMillis = a.createdAt?.toMillis?.() || 0;
    const bMillis = b.createdAt?.toMillis?.() || 0;
    return bMillis - aMillis;
  });
}

export function useCollectionSnapshot(collectionName) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const mapped = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setItems(sortByCreatedAtDesc(mapped));
    });

    return unsubscribe;
  }, [collectionName]);

  return items;
}
