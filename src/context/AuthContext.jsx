// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import { auth, db } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: firebaseUser.uid, ...userDoc.data() });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const signup = async (email, password, name, role) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, 'users', res.user.uid);
    await setDoc(userRef, { name, role, email });
    setUser({ uid: res.user.uid, name, role, email });
  };

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', res.user.uid));
    if (userDoc.exists()) {
      setUser({ uid: res.user.uid, ...userDoc.data() });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
