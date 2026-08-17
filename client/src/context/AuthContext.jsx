import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, set, get, child } from "firebase/database";
import { auth, db } from "../firebase";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null); // { role, name, matricNumber/staffId, department, level }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const snap = await get(child(ref(db), `users/${user.uid}`));
        setProfile(snap.exists() ? snap.val() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // role: 'student' | 'lecturer' | 'hod'
  async function register({ email, password, role, name, identifier, department, level }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userRecord = {
      role,
      name,
      department,
      createdAt: Date.now(),
    };
    if (role === "student") {
      userRecord.matricNumber = identifier;
      userRecord.level = level;
    } else {
      userRecord.staffId = identifier;
    }
    await set(ref(db, `users/${cred.user.uid}`), userRecord);
    setProfile(userRecord);
    return cred.user;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    return signOut(auth);
  }

  const value = {
    currentUser,
    profile,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
