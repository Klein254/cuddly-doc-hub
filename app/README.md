# Vector Doc Hub

Quotations, invoices, delivery notes and statements of accounts for Vector Technical. It runs as an installable app on Windows, Mac and Android, and works offline.

- **Live sync.** Every change is saved on the device straight away and uploaded within a second. Other devices see it immediately. Offline edits upload automatically when the connection returns.
- **PDFs everywhere.** PDFs are generated on the device with real, selectable text. On Windows/Mac (Chrome or Edge) *Save PDF* opens a "Save as" dialog; on Android and other browsers it goes to Downloads, and *Share* sends it to WhatsApp, Gmail, Drive and similar apps.

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

## Deploy and install

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
