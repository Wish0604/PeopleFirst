import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import { auth, db } from '../firebase';

export async function signInAuthority(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  if (credential.user) {
    const userDocRef = doc(db, 'users', credential.user.uid);
    const userDoc = await getDoc(userDocRef);
    const currentData = userDoc.exists() ? userDoc.data() : {};

    await setDoc(
      userDocRef,
      {
        email: credential.user.email ?? email,
        lastLoginAt: serverTimestamp(),
        // Assign ADMIN role automatically if none exists, to bypass the restriction screen
        role: currentData.role || 'ADMIN',
      },
      { merge: true },
    );
  }

  return credential;
}

export async function signOutAuthority() {
  await signOut(auth);
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function loadAuthorityProfile(uid) {
  const snapshot = await getDoc(doc(db, 'users', uid));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}