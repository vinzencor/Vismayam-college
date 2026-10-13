# Vismayam College — Website

Responsive React (Vite) site built from the Figma designs: **Home**, **Courses**, **Course detail** and **Contact / Enquiry**.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Pages

| Route              | Page                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `/`                | Landing page (hero, outcomes, how it works, courses, story, form)    |
| `/courses`         | Catalogue with search, filters, categories, sort and pagination      |
| `/courses/:slug`   | Course detail (curriculum accordion, outcomes, instructor, related)  |
| `/contact`         | Enquiry form — `?course=<slug>` pre-selects a course                 |
| `/vismayam/admin`  | Admin panel (sign-in required) — see below                           |

Course filters live in the URL (e.g. `/courses?category=design&level=beginner`), so filtered views can be shared.

## Where to change things

- **Courses, categories, testimonials, homepage images & stats** → the admin panel at `/vismayam/admin` (defaults live in `src/data/courses.js` and `src/data/home.js`)
- **Name, phone, email, hours, socials, nav links** → `src/config/site.js`
- **Logo** → `src/assets/logo-wordmark.png` (header on tablet/desktop + footer) and `src/assets/logo-mark.png` (header on phones ≤ 600px). Favicons: `public/favicon.ico`, `public/favicon.png`, `public/apple-touch-icon.png`
- **Photos** → upload them in the admin. Placeholder defaults are in `src/data/images.js`
- **Colours, fonts, spacing** → design tokens at the top of `src/styles/global.css`

## Enquiry forms

Both forms (home page + `/contact`) collect: **Student name, Mobile number, Course interested in, Education / Qualification, Preferred mode of contact (WhatsApp / Call)**. Qualification options live in `src/data/enquiry.js`.

On submit the visitor sees *"Thank you, your enquiry has been submitted successfully."* with a summary of what they sent.

Behind the scenes the `submit-enquiry` Edge Function (`supabase/functions/submit-enquiry/index.ts`):

1. validates the data again on the server (and drops bot submissions caught by a hidden honeypot field),
2. saves it to the `enquiries` table,
3. emails the admissions team (via [Resend](https://resend.com)) with every field, the page it came from, the time in IST and a one-tap WhatsApp / call link.

If the email fails, the enquiry is still saved and the row gets `email_sent = false` plus an `email_error` — check the table if a notification seems missing.

Until Supabase is connected, the forms only simulate submission (nothing is stored or emailed).

## Connecting Supabase + admissions email

1. **Database** — in the Supabase SQL editor, run `supabase/schema.sql` (creates the tables, RLS policies and the `media` storage bucket for uploads). Safe to re-run.
2. **Env** — copy `.env.example` to `.env` and fill in:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # only for the seed script, never shipped to the browser
   ```
3. **Content** — `npm run seed` loads the starter catalogue, testimonial and homepage content. It never overwrites rows that already exist (`npm run seed -- --force` resets them).
4. **Admin login** — `npm run create-admin -- you@example.com 'a-strong-password'` (run again to reset a password).
5. **Email sender** — create a Resend account, add the domain `vismayamcollege.com` and add the DNS records it shows (SPF/DKIM) at your domain registrar. Then create an API key.
6. **Deploy the function** (needs the [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase secrets set RESEND_API_KEY=re_xxx ADMISSIONS_EMAIL=admissions@vismayamcollege.com
   # optional: EMAIL_FROM="Vismayam College <enquiries@vismayamcollege.com>"
   # several recipients: ADMISSIONS_EMAIL=a@vismayamcollege.com,b@vismayamcollege.com
   supabase functions deploy submit-enquiry --no-verify-jwt
   ```
7. Restart `npm run dev`. Content loads from Supabase and enquiries are stored + emailed.

All public data access goes through `src/services/` (`courses.js`, `content.js`, `enquiries.js`); the admin's goes through `src/admin/api.js`.

## Admin panel (`/vismayam/admin`)

Sign in with an account created by `npm run create-admin`. From there you can:

- **Courses** — add, edit, publish/unpublish (drafts are hidden from visitors) and delete courses, including everything on the detail page: images, pricing, schedule, curriculum modules and topics, outcomes, instructor and an optional syllabus PDF.
- **Categories** — add, rename, reorder and feature categories (featured ones appear as "Browse by goal" cards).
- **Testimonials** — the student stories on the homepage, with photos, ordering and show/hide.
- **Homepage images** — hero image, learner photos, live-class card, banner text and the stats rows.
- **Enquiries** — every form submission; mark them contacted, delete, or export to CSV.

Uploads go to the public `media` storage bucket (max 10 MB; JPG, PNG, WebP, GIF, AVIF, PDF). Only users listed in the `admins` table can write anything — that's enforced by Row Level Security in the database, not just the UI. The admin is excluded from search engines (`robots.txt` + `noindex`) and is code-split so visitors never download it.

Tip: in Supabase → Authentication → Providers → Email, turn off **Allow new users to sign up** — admins are created with the script, so public sign-ups aren't needed.

## Domain & deploying

Production domain: **https://vismayamcollege.com** (set in `src/config/site.js`, `index.html`, `public/robots.txt` and `scripts/sitemap.mjs`). Each page sets its own title, description and canonical URL; `npm run build` regenerates `public/sitemap.xml` (from Supabase when its env vars are present).

It's a single-page app: the host must serve `index.html` for every route. `vercel.json` (Vercel) and `public/_redirects` (Netlify) already do this. Add the `VITE_SUPABASE_*` env vars in the host's dashboard, then point `vismayamcollege.com` (and `www`) at the host. If you serve the site from another origin, add it to the function's `ALLOWED_ORIGINS` secret.

## Structure

```
src/
  components/   Header, Footer, CourseCard, EnquiryForm, Icon, Img, Reveal…
  pages/        Home, Courses, CourseDetail, Contact, NotFound (+ page CSS)
  config/       site-wide brand + contact settings
  data/         mock courses, categories, image URLs
  services/     data layer (Supabase or mock fallback)
  admin/        /vismayam/admin — shell, pages, form kit, admin data layer
  lib/          Supabase client, formatters
  hooks/        useAsync, useDocumentTitle
  styles/       global.css (tokens, buttons, typography, utilities)
supabase/       schema.sql, functions/submit-enquiry (validate → store → email)
scripts/        seed.mjs, create-admin.mjs, sitemap.mjs
```
