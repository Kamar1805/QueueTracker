// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // important

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.warn('Auth persistence error:', e);
      }
      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (snap.exists()) {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email, ...snap.data() });
            } else {
              setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
            }
          } catch {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
          }
        } else {
          setUser(null);
        }
        setLoading(false); // only redirect decisions after this flips
      });
    })();
    return () => unsub();
  }, []);

  const signup = async (email, password, name, role) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', res.user.uid), { name, role, email });
    setUser({ uid: res.user.uid, name, role, email });
  };

  const login = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, 'users', res.user.uid));
    if (snap.exists()) setUser({ uid: res.user.uid, email: res.user.email, ...snap.data() });
    else setUser({ uid: res.user.uid, email: res.user.email });
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);