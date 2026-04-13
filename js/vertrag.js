/* Vertrag Generator (AcroForm)
   - Loads template PDF with form fields
   - Prefills from ?token=... via Worker (optional)
   - Validates that expected fields exist (warns if missing)
   - Writes values into AcroForm fields and flattens PDF
*/
const { PDFDocument } = PDFLib;
const { todayDE, isoToDE, clean, fileSafe } = window.Utils;

// PDF fields
const els = {
  startDate: document.getElementById("startDate"),
  childFullName: document.getElementById("childFullName"),
  childBirthdate: document.getElementById("childBirthdate"),
  childFullAddress: document.getElementById("childFullAddress"),

  voucherDate: document.getElementById("voucherDate"),
  voucherNumber: document.getElementById("voucherNumber"),
  voucherType: document.getElementById("voucherType"),
  voucherMinH: document.getElementById("voucherMinH"),
  voucherMaxH: document.getElementById("voucherMaxH"),

  parent1: document.getElementById("parent1"),
  parent2: document.getElementById("parent2"),

  mailYes: document.getElementById("mailYes"),
  mailNo: document.getElementById("mailNo"),
  signalYes: document.getElementById("signalYes"),
  signalNo: document.getElementById("signalNo"),
  medicalYes: document.getElementById("medicalYes"),
  medicalNo: document.getElementById("medicalNo"),
  listsYes: document.getElementById("listsYes"),
  listsNo: document.getElementById("listsNo"),
  photosYes: document.getElementById("photosYes"),
  photosNo: document.getElementById("photosNo"),
  bookYes: document.getElementById("bookYes"),
  bookNo: document.getElementById("bookNo"),

  btnDownload: document.getElementById("btnDownload"),
  btnReset: document.getElementById("btnReset"),
  status: document.getElementById("status"),
  fieldDump: document.getElementById("fieldDump"),
  templateWarnings: document.getElementById("templateWarnings"),
};

if(!els.startDate.value) els.startDate.value = todayDE();

// Expected PDF fields (this is your contract between template and code)
const EXPECTED = {
  text: [
    "start_date",
    "child_full_name",
    "child_birthdate",
    "child_full_address",
    "voucher_date",
    "voucher_number",
    "voucher_type",
    "voucher_min_h",
    "voucher_max_h",
    "parent_1_full_name",
    "parent_2_full_name",
  ],
  check: [
    "consent_mail_communication_yes",
    "consent_mail_communication_no",
    "consent_signal_yes",
    "consent_signal_no",
    "consent_medical_check_yes",
    "consent_medical_check_no",
    "consent_data_usage_lists_yes",
    "consent_data_usage_lists_no",
    "consent_fotos_yes",
    "consent_fotos_no",
    "consent_foto_book_yes",
    "consent_foto_book_no",
  ]
};

function setStatus(msg){ els.status.textContent = msg; }

function gather(){
  const mail = els.mailYes.checked ? "yes" : (els.mailNo.checked ? "no" : "");
  const signal = els.signalYes.checked ? "yes" : (els.signalNo.checked ? "no" : "");
  const medical = els.medicalYes.checked ? "yes" : (els.medicalNo.checked ? "no" : "");
  const lists = els.listsYes.checked ? "yes" : (els.listsNo.checked ? "no" : "");
  const photos = els.photosYes.checked ? "yes" : (els.photosNo.checked ? "no" : "");
  const book = els.bookYes.checked ? "yes" : (els.bookNo.checked ? "no" : "");

  return {
    start_date: clean(els.startDate.value),
    child_full_name: clean(els.childFullName.value),
    child_birthdate: clean(els.childBirthdate.value),
    child_full_address: clean(els.childFullAddress.value),

    voucher_date: clean(els.voucherDate.value),
    voucher_number: clean(els.voucherNumber.value),
    voucher_type: clean(els.voucherType.value),
    voucher_min_h: clean(els.voucherMinH.value),
    voucher_max_h: clean(els.voucherMaxH.value),

    parent_1_full_name: clean(els.parent1.value),
    parent_2_full_name: clean(els.parent2.value),

    // radio buttons
    consent_mail_communication_yes: mail === "yes",
    consent_mail_communication_no: mail === "no",
    consent_signal_yes: signal === "yes",
    consent_signal_no: signal === "no",
    consent_medical_check_yes: medical === "yes",
    consent_medical_check_no: medical === "no",
    consent_data_usage_lists_yes: lists === "yes",
    consent_data_usage_lists_no: lists === "no",
    consent_fotos_yes: photos === "yes",
    consent_fotos_no: photos === "no",
    consent_foto_book_yes: book === "yes",
    consent_foto_book_no: book === "no",
  };
}

els.btnReset.addEventListener("click", () => {
  for (const id of ["startDate","childFullName","childBirthdate","childFullAddress","voucherDate","voucherNumber","voucherType","voucherMinH","voucherMaxH","parent1","parent2"]) {
    els[id].value = "";
  }
  els.startDate.value = todayDE();

  for (const r of ["mailYes","mailNo","signalYes","signalNo","medicalYes","medicalNo","listsYes","listsNo","photosYes","photosNo","bookYes","bookNo"]) {
    els[r].checked = false;
  }

  setStatus("Felder geleert.");
});

async function loadTemplateAndInspect(){
  const { TEMPLATE_URL } = window.APP_CONFIG;
  const templateBytes = await fetch(TEMPLATE_URL).then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  // dump field list
  const lines = fields.map(f => `${f.getName()}\t(${f.constructor.name})`).sort();
  els.fieldDump.textContent = lines.join("\n");

  // validate expected fields
  const actualNames = new Set(fields.map(f => f.getName()));
  const missing = [];
  for (const n of [...EXPECTED.text, ...EXPECTED.check]) {
    if (!actualNames.has(n)) missing.push(n);
  }

  // Helpful note about duplicate name field present in your PDF
  const extraDup = actualNames.has("child_fullname") ? ["child_fullname (duplicate of child_full_name)"] : [];

  if (missing.length || extraDup.length) {
    const msg = [
      "⚠️ Template-Check:",
      ...(missing.length ? ["Fehlende Felder im PDF-Template:", ...missing.map(x => `- ${x}`)] : ["Keine fehlenden Pflichtfelder gefunden ✅"]),
      ...(extraDup.length ? ["", "Hinweis:", ...extraDup.map(x => `- ${x}`)] : [])
    ].join("\n");
    els.templateWarnings.textContent = msg;
    els.templateWarnings.hidden = false;
  } else {
    els.templateWarnings.hidden = true;
    els.templateWarnings.textContent = "";
  }

  return pdfDoc;
}

function setTextFieldSafe(form, name, value){
  try {
    form.getTextField(name).setText(value ?? "");
    return true;
  } catch (e) {
    return false;
  }
}

function checkBoxSafe(form, name, checked){
  // These checkboxes use a parent-field + single-widget-child pattern.
  // pdf-lib's check()/uncheck() sets /V on the parent but doesn't always
  // update /AS on the child widget, so the visual state doesn't render.
  // We always set both /V (parent) and /AS (each widget) explicitly.
  const { PDFName } = PDFLib;
  const onState  = PDFName.of("Yes");
  const offState = PDFName.of("Off");
  const target   = checked ? onState : offState;

  try {
    // Step 1: set the field value via high-level API (updates /V on parent)
    const cb = form.getCheckBox(name);
    if (checked) cb.check(); else cb.uncheck();
  } catch(_) {}

  try {
    // Step 2: always force /AS on every widget child so it visually renders
    const fields = form.getFields().filter(f => f.getName() === name);
    for (const field of fields) {
      try { field.acroField.setValue(target); } catch(_) {}
      const widgets = field.acroField.getWidgets ? field.acroField.getWidgets() : [];
      for (const w of widgets) {
        try { w.setAppearanceState(target); } catch(_) {}
      }
    }
    return true;
  } catch(e) {
    return false;
  }
}

async function generatePdf(){
  const pdfDoc = await loadTemplateAndInspect();
  const form = pdfDoc.getForm();
  const data = gather();

  // Text fields — use setTextFieldSafe which uses getTextField() directly,
  // bypassing the constructor name check that was silently skipping fields
  // pdf-lib misidentifies as PDFRadioGroup instead of PDFTextField.
  // We iterate all fields with the same name (handles duplicates like child_full_name).
  for (const name of EXPECTED.text) {
    const matchingFields = form.getFields().filter(f => f.getName() === name);
    if (matchingFields.length > 0) {
      // Try the high-level API first; fall back to raw setValue on each widget
      const filled = setTextFieldSafe(form, name, data[name] ?? "");
      if (!filled) {
        // If getTextField() failed (field mistyped by pdf-lib), set value directly
        for (const field of matchingFields) {
          try {
            field.acroField.setValue(PDFLib.PDFString.of(data[name] ?? ""));
          } catch (e) {
            // ignore individual field errors
          }
        }
      }
    }
  }

  // Checkboxes
  for (const name of EXPECTED.check) {
    checkBoxSafe(form, name, !!data[name]);
  }

  // Flatten so the PDF is "final" for printing/signing
  try { form.flatten(); } catch {}

  const bytes = await pdfDoc.save();

  const suffix = fileSafe(data.child_full_name) || "Kind";
  const filename = `Vertrag_Hildegarten_${suffix}.pdf`;

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function maybeIsoToDE(value) {
  if (!value) return "";
  const s = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? isoToDE(s) : s;
}

function parseMinMaxHours(value) {
  // expects formats like "7-9"
  if (!value) return { min: "", max: "" };
  const s = String(value).trim();
  const m = s.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  if (m) return { min: m[1], max: m[2] };
  // fallback: if only one number exists
  const one = s.match(/(\d+)/);
  return { min: one ? one[1] : "", max: "" };
}

async function prefillIfTokenPresent() {
  const token = window.Prefill.getTokenFromUrl();
  if (!token) return;

  try {
    setStatus("Daten werden geladen …");
    const data = await window.Prefill.loadByToken(token);

    const childFullName = [data.childFirstName, data.childLastName]
      .filter(Boolean)
      .join(" ");

    const zipCity = [data.zip, data.city].filter(Boolean).join(" ");
    const childFullAddress = [data.street, zipCity].filter(Boolean).join(", ");

    const parent1FullName = [data.parent1FirstName, data.parent1LastName]
      .filter(Boolean)
      .join(" ");

    const parent2FullName = [data.parent2FirstName, data.parent2LastName]
      .filter(Boolean)
      .join(" ");

    // Hours: "7-9" -> min/max
    const { min: voucherMinH, max: voucherMaxH } = parseMinMaxHours(
      data.voucherMinMaxH
    );

    // Fill form inputs (NOT PDF yet — PDF is generated from these inputs later)
    if (data.startDate) els.startDate.value = maybeIsoToDE(data.startDate);

    if (childFullName) els.childFullName.value = childFullName;
    if (data.childBirthdate) els.childBirthdate.value = maybeIsoToDE(data.childBirthdate);
    if (childFullAddress) els.childFullAddress.value = childFullAddress;

    if (data.voucherNumber) els.voucherNumber.value = String(data.voucherNumber);

    if (data.voucherType) {
      els.voucherType.value = String(data.voucherType);
    } else if (!els.voucherType.value) {
      els.voucherType.value = "Ganztagsplatz";
    }

    if (voucherMinH) els.voucherMinH.value = voucherMinH;
    if (voucherMaxH) els.voucherMaxH.value = voucherMaxH;
    if (els.voucherDate && data.voucherDate) {
      els.voucherDate.value = maybeIsoToDE(data.voucherDate);
    }

    if (parent1FullName) els.parent1.value = parent1FullName;
    if (parent2FullName) els.parent2.value = parent2FullName;

    setStatus("Daten geladen. Bitte prüfen und ergänzen.");
  } catch (e) {
    console.error(e);
    setStatus("Konnte Daten nicht laden. Bitte Felder manuell ausfüllen.");
  }
}

prefillIfTokenPresent();

// Wire download
els.btnDownload.addEventListener("click", async () => {
  try {
    els.btnDownload.disabled = true;
    setStatus("Erstelle Vertrags-PDF …");
    await generatePdf();
    setStatus("Fertig. PDF heruntergeladen.");
  } catch (e) {
    console.error(e);
    setStatus("Fehler beim Erstellen des PDFs.");
  } finally {
    els.btnDownload.disabled = false;
  }
});