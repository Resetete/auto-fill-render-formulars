# auto-fill-render-formulars (KiLa)

Diese Mini-App:

- lädt bei `?token=...` automatisch Kind-Daten via Cloudflare Worker
- füllt das Formular vor
- rendert das **Original Vertrags-PDF** client-side (pdf-lib)
- Download → drucken → unterschreiben

## Repo
https://github.com/Resetete/auto-fill-render-formulars

## Dateien
- `index.html`
- `style.css`
- `app.js`
- `templates/vertrag_template.pdf`

## Konfiguration
In `app.js` steht oben:

`const WORKER_BASE_URL = "https://kila-vertrag-worker.vorstandsarbeit-hildegarten.workers.dev";`

## GitHub Pages
1. ZIP entpacken
2. Dateien in dein Repo kopieren (root)
3. GitHub → Settings → Pages
4. Source: Deploy from a branch
5. Branch: `main` / Folder: `/ (root)`
6. Speichern → GitHub Pages URL erscheint

## Test
Wenn GitHub Pages live ist:

`https://<user>.github.io/auto-fill-render-formulars/?token=<TOKEN>`

## Worker / CORS
Dein Worker muss CORS erlauben für deine GitHub Pages Origin (`ALLOWED_ORIGIN`).
