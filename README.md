# FUO Lecturer Evaluation & Anonymous Feedback System

A web-based system for the Federal University of Otuoke that lets students
anonymously evaluate lecturers per course, and gives lecturers and HODs
aggregated, anonymized reports.

**Stack:** React (Vite) + Tailwind CSS on the frontend, Firebase Authentication
+ Firebase Realtime Database for data, and a small Node.js/Express server for
server-side, role-checked reporting.

## Roles

- **Student** — registers with a matriculation number, sees the courses for
  their department/level, submits one anonymous evaluation per course.
- **Lecturer** — sees aggregated (never individual) ratings and anonymous
  comments for the courses assigned to them.
- **HOD** — sees department-wide aggregated reports, manages courses and
  lecturer assignments, and manages the bank of evaluation questions.

Anonymity is enforced two ways: the evaluation payload written to the
database never contains a student identifier, and a separate `evalRecords`
node (readable only by that student) just prevents someone from evaluating
the same course twice.

## Project structure

```
fuo-eval-system/
├── client/            React + Tailwind app (the main app students/staff use)
├── server/             Node.js + Express API (server-side aggregated reports)
└── firebase-database-rules.json   Realtime Database security rules
```

## 1. Set up Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   create a new project.
2. Under **Build → Authentication → Sign-in method**, enable **Email/Password**.
3. Under **Build → Realtime Database**, create a database (any region), and
   start in locked mode.
4. Go to **Realtime Database → Rules**, paste in the contents of
   `firebase-database-rules.json` from this project, and publish.
5. Go to **Project settings → General → Your apps**, add a **Web app**, and
   copy the config object it gives you.

## 2. Configure and run the client

```bash
cd client
npm install
```

Open `src/firebase.js` and replace the placeholder values with the config
you copied from the Firebase Console:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};
```

Then start the dev server:

```bash
npm run dev
```

Visit `http://localhost:5173`.

### First-time setup inside the app

1. Register a **HOD** account first (any department name you like, e.g.
   "Computer Science" — use this exact spelling everywhere).
2. Register a **Lecturer** account in the same department.
3. Sign in as the HOD, go to **Courses & lecturers**, and add a course,
   assigning it to the lecturer you just created.
4. Register a **Student** account with the same department and a matching
   level (e.g. 100 Level), then sign in — the course will now appear on the
   student dashboard, ready to evaluate.
5. Optionally, as the HOD, visit **Evaluation questions** to customize the
   statements students rate.

## 3. Configure and run the server (optional, for HOD reporting API)

The client already talks to Firebase directly for everything. The Node.js
server is an additional, optional layer that demonstrates server-side RBAC:
it verifies a Firebase ID token and only lets confirmed HOD accounts pull a
department report via a REST endpoint.

```bash
cd server
npm install
cp .env.example .env
```

Generate a service account key: **Firebase Console → Project settings →
Service accounts → Generate new private key**, save it as
`server/serviceAccountKey.json`, and set in `.env`:

```
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com
```

Run it:

```bash
npm run dev
```

Test it:

```bash
curl http://localhost:4000/api/health
```

`GET /api/reports/department` requires an `Authorization: Bearer <idToken>`
header from a signed-in HOD (you can get an ID token in the browser console
while signed in with `await auth.currentUser.getIdToken()`).

## Data model (Realtime Database)

```
users/{uid}                → { role, name, department, matricNumber|staffId, level, createdAt }
courses/{courseId}         → { code, title, department, level, lecturerId }
evaluationQuestions/{id}   → { text, order }
evaluations/{courseId}/{id}→ { ratings: { [questionId]: 1-5 }, comment, timestamp }  — no student id
evalRecords/{uid}/{courseId} → true   — prevents duplicate submissions, per-student only
```

## Notes for the project write-up

- **Authentication (objective i):** Firebase Authentication (email/password),
  with matriculation/staff-ID format validated at registration and stored
  separately from any evaluation content.
- **Course/lecturer management (objective ii):** React + Firebase Realtime
  Database, read asynchronously and mapped by department/level.
- **Anonymous feedback (objective iii):** React state (`useState`) driven
  form; submissions are stripped of any identifier before being written.
- **RBAC (objective iv):** enforced in the UI (`ProtectedRoute`), in the
  Realtime Database security rules, and again server-side in
  `server/middleware/auth.js` — aggregation logic lives in
  `client/src/utils/aggregate.js` and `server/routes/reports.js`.
- **Student dashboard (objective v):** Tailwind CSS, tracks per-course
  evaluation state via `evalRecords`.
- **Usability/functionality testing (objective vi):** test manually using
  the "first-time setup" flow above across all three roles, or extend with a
  tool like Vitest/React Testing Library.
