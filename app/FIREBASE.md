# Sync Doc Hub through Firebase

Doc Hub already has Firebase sync built in. Once you add your project's keys, every copy of the app (Windows, Mac, Android and the website) signs in to the same Firebase project and shares the same documents live. You don't write any code: you set up the project in the Firebase console, paste five values into `.env`, and rebuild.

Allow about 15 minutes. The free **Spark** plan is enough for a small team.

## How it works

```
 Phone app ─┐                         ┌─ Office PC
            │   Firebase Auth         │
 Website ───┼──► (who is signed in)   ├─ Laptop
            │   Cloud Firestore       │
            └──► documents/ numbers/ settings/ team_members/
```

- **Local first.** Every edit is saved on the device straight away, so the app works offline. Changes upload about half a second after you stop typing, or as soon as the connection comes back.
- **Live.** Each device keeps a live connection to Firestore. When someone edits a document, the others see it within a second or two without refreshing.
- **No lost work.** If two devices edit the same document, the most recent edit wins, and an upload never replaces a newer copy that's already in the cloud.
- **No duplicate numbers.** Each document number (for example `VTMS/INV/2026/0007`) is claimed in Firestore. If two devices create invoice 0007 while offline, the second one is moved to the next free number when it uploads.
- **Signatures sync too.** A signature drawn on a phone at the site appears on the office computer's copy of the PDF.
- **Only your team gets in.** Staff sign in with an email and password that you create. Firestore only lets in emails you've listed in `team_members`.

## 1. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Create a project** (or open the project you already have).
2. Name it, for example `vector-doc-hub`. Google Analytics isn't needed, so you can turn it off.

## 2. Turn on email and password sign-in

1. In the left menu, open **Build → Authentication** and click **Get started**.
2. On the **Sign-in method** tab, choose **Email/Password**, switch on the first toggle (not the passwordless "email link" option) and **Save**.
3. On the **Users** tab, click **Add user** for each person who will use Doc Hub, with their email and a password.

The app has no sign-up screen, so nobody can create an account from inside it.

## 3. Create the database and lock it down

1. Open **Build → Firestore Database** and click **Create database**.
2. Choose a location close to you (for Kenya, `africa-south1` (Johannesburg) or `europe-west1` both work well). You can't change it later.
3. Start in **production mode**.
4. Open the **Rules** tab, delete what's there, paste the whole contents of [`firestore.rules`](firestore.rules) and click **Publish**.

These rules mean only signed-in people whose email is on your team list can read or write anything.

## 4. Add your team list

Still in Firestore, on the **Data** tab:

1. Click **Start collection**. Collection ID: `team_members`.
2. Document ID: the person's email **in lower case**, for example `vectortech254@gmail.com`.
3. Add one field so the document can be saved, for example `name` (string) = `Office`.
4. Click **Save**. Repeat **Add document** for each person.

To remove someone's access later, delete their `team_members` document (and their user under Authentication).

## 5. Connect the app

1. Click the gear icon next to **Project overview** → **Project settings**.
2. Under **Your apps**, click the web icon **`</>`**. Nickname: `Doc Hub`. You don't need Firebase Hosting. Click **Register app**.
3. Firebase shows a `firebaseConfig` block. Copy `app/.env.example` to `app/.env` and fill in the matching values:

   ```bash
   VITE_FIREBASE_API_KEY=AIza...            # apiKey
   VITE_FIREBASE_AUTH_DOMAIN=vector-doc-hub.firebaseapp.com   # authDomain
   VITE_FIREBASE_PROJECT_ID=vector-doc-hub  # projectId
   VITE_FIREBASE_APP_ID=1:1234567890:web:abc123              # appId
   VITE_FIREBASE_STORAGE_BUCKET=vector-doc-hub.firebasestorage.app   # optional
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890              # optional
   ```

4. Try it on your computer:

   ```bash
   cd app
   npm install
   npm run dev
   ```

   Open http://localhost:5173. You should see the sign-in screen. Sign in with one of the users from step 2. Settings → Sync should say **Firebase** and **Up to date**.

Anything you made on that device in local-only mode uploads the first time you sign in.

These web keys are **not** secret: every website using Firebase ships them to the browser. What protects your data is sign-in plus the rules from step 3. Still, keep `.env` out of git (it already is).

## 6. Build the apps with Firebase

The installers are built by GitHub Actions, so give GitHub the same values:

1. On GitHub, open the repository → **Settings → Secrets and variables → Actions → New repository secret**.
2. Add four secrets with exactly these names and the values from your `.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
3. Go to **Actions → Build apps → Run workflow** (or push any change to `app/`).
4. When the run finishes, download the new Windows, macOS and Android installers from the run's **Artifacts**, install them on each device, and sign in.

For the **website** version, set the same `VITE_FIREBASE_*` variables in your host's settings (Vercel, Netlify, Cloudflare Pages, or Firebase Hosting) before it builds.

## Free plan limits

The Spark plan allows 50,000 document reads, 20,000 writes and 1 GiB of storage per day/month as listed in the console. For scale:

- Opening the app reads each document once (500 documents opened on 10 devices ≈ 5,000 reads).
- Editing writes the document roughly once per pause in typing, so a busy day of 50 documents is a few thousand writes.

If you ever outgrow it, switch to the pay-as-you-go **Blaze** plan in the console. Nothing changes in the app.

## Troubleshooting

| What you see | What to do |
| --- | --- |
| No sign-in screen, Settings says "Saved on this device only" | The app was built without the keys. Check `app/.env` (or the GitHub secrets), then restart `npm run dev` or rebuild. |
| "Wrong email or password." | Check the user exists under Authentication → Users. Reset the password there if needed. |
| "This account is not on the team list…" | Add the email (lower case) as a document in `team_members`, then press **Sync now** in Settings. |
| Sync issue: "Missing or insufficient permissions" | The rules weren't published. Paste `firestore.rules` into Firestore → Rules again and **Publish**. |
| Changes don't appear on another device | Make sure both are signed in to the same project (Settings → Sync shows the email) and online. |

## Where the code is

| File | What it does |
| --- | --- |
| `src/lib/cloud-firebase.ts` | Firebase sign-in, uploads, number claims and live updates |
| `src/lib/cloud.ts` | Picks Firebase or Supabase based on `.env` |
| `src/lib/store.ts` | Offline storage on the device and the upload queue |
| `firestore.rules` | Who may read and write |
