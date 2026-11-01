# Vector Doc Hub

Quotations, invoices, delivery notes and statements of accounts for Vector Technical. It ships as a native app for Windows (.exe/.msi), macOS (.dmg) and Android (.apk), plus a website version, and works offline.

- **Live sync.** Every change is saved on the device straight away and uploaded within a second. Other devices see it immediately. Offline edits upload automatically when the connection returns.
- **PDFs everywhere.** PDFs are generated on the device with real, selectable text, so they look identical on every machine.
  - Windows / Mac app: *Save PDF* opens the system "Save as" dialog.
  - Android app: *Save PDF* writes to **Documents/Vector Doc Hub**; *Share* sends it to WhatsApp, Gmail, Drive and similar apps.
  - Website: "Save as" dialog in Chrome/Edge on a computer, otherwise Downloads.

## Run it

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

Without Supabase keys the app runs in **local-only mode**: everything is stored in that browser. Add the keys (below) to sync across devices. Anything created locally uploads the first time you sign in.

## Turn on sync (Supabase, free tier is enough)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. **Authentication → Users → Add user** for each staff member (email + password). Under **Authentication → Sign In / Providers**, turn off *Allow new users to sign up*.
4. Allow those emails to see documents (SQL Editor):
   ```sql
   insert into public.team_members (email) values ('vectortech254@gmail.com');
   ```
5. Copy `.env.example` to `.env` and fill in **Project URL** and **anon public key** from *Project Settings → API*.

Only signed-in users whose email is in `team_members` can read or write documents.

## Get the installers

GitHub builds them automatically ([`.github/workflows/apps.yml`](../.github/workflows/apps.yml)) whenever `app/` changes on `main`:

1. Open the repository on GitHub → **Actions** → the latest **Build apps** run.
2. Under **Artifacts**, download *Vector-Doc-Hub-Windows*, *-macOS* or *-Android*.

To publish a proper download page, tag a version: `git tag v1.0.0 && git push origin v1.0.0`. The files then appear under **Releases**.

For the apps to sync, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository secrets (**Settings → Secrets and variables → Actions**) before building.

The installers are not code-signed yet, so the first launch shows a warning:

- **Windows:** "Windows protected your PC" → *More info* → *Run anyway*.
- **Mac:** open the app once, then **System Settings → Privacy & Security** → *Open Anyway*.
- **Android:** allow *Install unknown apps* for the browser or file manager you open the APK from.

### Build them yourself

| Platform | Needs | Command (in `app/`) |
| --- | --- | --- |
| Android | Android Studio (JDK 21 + SDK) | `npm run build && npx cap sync android`, then `cd android && gradlew assembleDebug` → `android/app/build/outputs/apk/debug/app-debug.apk` |
| Windows | [Rust](https://rustup.rs) + Visual Studio C++ build tools | `npx tauri build` → `src-tauri/target/release/bundle/` |
| macOS | Rust + Xcode command line tools, on a Mac | `npx tauri build` → `src-tauri/target/release/bundle/dmg/` |

`npx tauri dev` runs the desktop app with live reload.

## Website version

```bash
npm run build      # output in app/dist
```

Host `dist/` on any static host (Vercel, Netlify, Cloudflare Pages). Set the two `VITE_SUPABASE_*` variables in the host's settings. Then open the site and:

- **Windows / Mac (Chrome or Edge):** click the install icon in the address bar.
- **Android (Chrome):** menu ⋮ → *Add to Home screen* → *Install*.
- **Mac Safari:** File → *Add to Dock*.

Settings → *Install app* shows the same steps inside the app.

## Where things live

| Path | What |
| --- | --- |
| `src/lib/store.ts` | Local storage (IndexedDB), upload queue, realtime sync, numbering |
| `src/pdf/DocumentPdf.tsx` | The document designs (cover page + body for all four types) |
| `src/pages/Editor.tsx` | The document editor with live PDF preview |
| `supabase/schema.sql` | Database tables, access rules, realtime |
| `src/lib/pdf.tsx` | Saving and sharing PDFs (desktop app, Android app and browser) |
| `src-tauri/` | Windows / Mac app shell (Tauri) |
| `android/` | Android app shell (Capacitor) |
