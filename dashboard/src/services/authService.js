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
    await setDoc(
      doc(db, 'users', credential.user.uid),
      {
        email: credential.user.email ?? email,
        lastLoginAt: serverTimestamp(),
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