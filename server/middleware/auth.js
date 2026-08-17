import { auth, db } from "../config/firebaseAdmin.js";

// Verifies the Firebase ID token sent by the React client in the
// Authorization header ("Bearer <idToken>"), then loads that user's role
// from the database so routes can enforce RBAC server-side, in addition to
// the Realtime Database security rules.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    const snap = await db.ref(`users/${decoded.uid}`).get();
    if (!snap.exists()) {
      return res.status(403).json({ error: "No profile found for this account." });
    }
    req.user = { uid: decoded.uid, ...snap.val() };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You do not have access to this resource." });
    }
    next();
  };
}
