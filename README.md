# KiLa Hildegarten — Formulare (Hub)

Diese Mini-App ist für GitHub Pages gedacht und enthält:

- **Übersicht** (`index.html`)
- **Betreuungsvertrag Generator** (`vertrag.html`) — füllt ein **AcroForm-PDF** per Feldnamen
- **Token Generator** (`token.html`)
- **Template-Feldprüfung**: zeigt Warnung, wenn im PDF Template erwartete Felder fehlen

## Konfiguration
In `js/config.js`:

- `WORKER_BASE_URL`: Cloudflare Worker Bridge (Token → Webling → JSON)
- `TEMPLATE_URL`: Pfad zum Vertragstemplate (AcroForm)

Aktuell:
- `WORKER_BASE_URL = https://kila-vertrag-worker.vorstandsarbeit-hildegarten.workers.dev`
- `TEMPLATE_URL = ./templates/vertrag_acroform_template.pdf`

## Wichtig: Feldnamen im PDF
Der Vertrag-Generator erwartet diese Felder im PDF:

Textfelder:
- `start_date`
- `child_full_name`
- `child_birthdate`
- `child_full_address`
- `voucher_date`
- `voucher_number`
- `voucher_type`
- `voucher_min_h`
- `voucher_max_h`
- `parent_1_full_name`
- `parent_2_full_name`

Checkboxen:
- `consense_mail_communication`
- `consense_signal_yes`
- `consense_signal_no`
- `consense_medical_check_yes`
- `consense_medical_check_no`
- `consense_data_usage_lists_yes`
- `consense_data_usage_lists_no`
- `consense_fotos_yes`
- `consense_fotos_no`
- `consense_foto_book_yes`
- `consense_foto_book_no`

> Hinweis: In deinem Test-PDF existiert zusätzlich `child_fullname` (Duplikat). Die App füllt **nur** `child_full_name`.

## GitHub Pages Deployment
1. ZIP entpacken
2. Inhalt ins Repo kopieren (root)
3. GitHub → Settings → Pages → Deploy from branch → `main` / root
4. URL testen:
   - Übersicht: `.../index.html`
   - Vertrag: `.../vertrag.html?token=...`
   - Token Tool: `.../token.html`

## Style
Die Optik ist „hell + grün“ angelehnt an die KiLa-Webseite (Natur-/Garten-Vibe). Siehe https://www.kila-hildegarten.de citeturn0view0
