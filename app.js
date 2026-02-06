/* KiLa Auto-Fill App
   - If URL contains ?token=..., it loads child data from Cloudflare Worker and pre-fills the form.
   - Generates the ORIGINAL contract PDF (template) client-side via pdf-lib.
*/

const { PDFDocument, StandardFonts, rgb } = PDFLib;

// ====== CONFIG ======
const WORKER_BASE_URL = "https://kila-vertrag-worker.vorstandsarbeit-hildegarten.workers.dev";

// ====== DOM ======
const els = {
  startDate: document.getElementById("startDate"),
  placeType: document.getElementById("placeType"),
  childFirstName: document.getElementById("childFirstName"),
  childLastName: document.getElementById("childLastName"),
  childBirthdate: document.getElementById("childBirthdate"),
  voucherDate: document.getElementById("voucherDate"),
  voucherNumber: document.getElementById("voucherNumber"),
  hours: document.getElementById("hours"),
  parent1: document.getElementById("parent1"),
  parent2: document.getElementById("parent2"),
  street: document.getElementById("street"),
  city: document.getElementById("city"),
  consentInfoMail: document.getElementById("consentInfoMail"),
  consentSignalYes: document.getElementById("consentSignalYes"),
  consentSignalNo: document.getElementById("consentSignalNo"),
  consentListsYes: document.getElementById("consentListsYes"),
  consentListsNo: document.getElementById("consentListsNo"),
  consentPhotoYes: document.getElementById("consentPhotoYes"),
  consentPhotoNo: document.getElementById("consentPhotoNo"),
  consentBookYes: document.getElementById("consentBookYes"),
  consentBookNo: document.getElementById("consentBookNo"),
  signCity: document.getElementById("signCity"),
  signDate: document.getElementById("signDate"),
  btnDownload: document.getElementById("btnDownload"),
  btnReset: document.getElementById("btnReset"),
  status: document.getElementById("status"),
};

const COORDS = {
  "pageSize": {
    "w": 595.28,
    "h": 841.89
  },
  "p1": {
    "aufnahmeDatum": {
      "x": 439.35,
      "top": 412.33,
      "bottom": 423.33,
      "w": 62.62,
      "h": 11.0
    },
    "kindZeile": {
      "x": 191.0,
      "top": 450.54,
      "bottom": 462.59,
      "w": 267.55,
      "h": 12.05
    },
    "voucherZeile": {
      "x": 106.0,
      "top": 487.33,
      "bottom": 498.33,
      "w": 437.63,
      "h": 11.0
    },
    "stundenZeile": {
      "x": 106.0,
      "top": 499.33,
      "bottom": 510.33,
      "w": 233.59,
      "h": 11.0
    },
    "parentsLine": {
      "x": 266.0,
      "top": 280.33,
      "bottom": 291.33,
      "w": 85.56,
      "h": 11.0
    },
    "addressLine": {
      "x": 179.0,
      "top": 292.33,
      "bottom": 303.33,
      "w": 260.41,
      "h": 11.0
    }
  },
  "footer": {
    "x": 71.0,
    "top": 797.7,
    "bottom": 805.7,
    "w": 189.88,
    "h": 8.0
  },
  "signature": {
    "pageIndex": 6,
    "berlinLine": {
      "x": 99.0,
      "top": 144.33,
      "bottom": 155.33,
      "w": 194.35,
      "h": 11.0
    }
  },
  "consent": {
    "pageIndex7": 6,
    "infoMailBox": {
      "x": 89.0,
      "top": 648.2,
      "bottom": 659.33,
      "w": 14.06,
      "h": 11.13
    },
    "signalJa": {
      "x": 177.2,
      "top": 708.33,
      "bottom": 719.33,
      "w": 14.68,
      "h": 11.0
    },
    "signalNein": {
      "x": 318.8,
      "top": 708.33,
      "bottom": 719.33,
      "w": 25.68,
      "h": 11.0
    },
    "pageIndex8": 7,
    "listsJa": {
      "x": 177.2,
      "top": 156.33,
      "bottom": 167.33,
      "w": 14.68,
      "h": 11.0
    },
    "listsNein": {
      "x": 318.8,
      "top": 156.33,
      "bottom": 167.33,
      "w": 25.68,
      "h": 11.0
    },
    "photoJaBox": {
      "x": 89.0,
      "top": 360.2,
      "bottom": 371.33,
      "w": 31.79,
      "h": 11.13
    },
    "photoNeinBox": {
      "x": 248.0,
      "top": 360.2,
      "bottom": 371.33,
      "w": 42.79,
      "h": 11.13
    },
    "bookJaBox": {
      "x": 89.0,
      "top": 456.2,
      "bottom": 467.33,
      "w": 31.79,
      "h": 11.13
    },
    "bookNeinBox": {
      "x": 248.0,
      "top": 456.2,
      "bottom": 467.33,
      "w": 42.79,
      "h": 11.13
    }
  }
};

// ====== Utils ======
function todayDE(){
  const d = new Date();
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
if(!els.signDate.value) els.signDate.value = todayDE();

function clean(s){ return (s ?? "").toString().trim(); }
function setStatus(msg){ els.status.textContent = msg; }

function isoToDE(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function fileSafe(s) {
  return (s || "").replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_\-]/g,"");
}

// ====== Prefill from token ======
async function prefillFromTokenIfPresent() {
  const token = new URLSearchParams(window.location.search).get("token");
  if (!token) return;

  try {
    setStatus("Daten werden geladen …");
    const resp = await fetch(`${WORKER_BASE_URL}/lookup?token=${encodeURIComponent(token)}`);
    const data = await resp.json();

    if (!resp.ok) {
      console.error("Prefill error:", data);
      setStatus("Konnte Daten nicht laden. Bitte Felder manuell ausfüllen.");
      return;
    }

    els.childFirstName.value = data.childFirstName || "";
    els.childLastName.value  = data.childLastName || "";
    els.childBirthdate.value = isoToDE(data.childBirthdate) || "";

    els.street.value = data.street || "";
    const zipCity = [data.zip, data.city].filter(Boolean).join(" ");
    if (zipCity) els.city.value = zipCity;

    setStatus("Daten geladen ✅ Bitte prüfen und ergänzen.");
  } catch (e) {
    console.error(e);
    setStatus("Fehler beim Laden. Bitte Felder manuell ausfüllen.");
  }
}
prefillFromTokenIfPresent();

// ====== Form gather/reset ======
function gather(){
  return {
    startDate: clean(els.startDate.value),
    placeType: els.placeType.value,
    childFirstName: clean(els.childFirstName.value),
    childLastName: clean(els.childLastName.value),
    childBirthdate: clean(els.childBirthdate.value),
    voucherDate: clean(els.voucherDate.value),
    voucherNumber: clean(els.voucherNumber.value),
    hours: clean(els.hours.value),
    parent1: clean(els.parent1.value),
    parent2: clean(els.parent2.value),
    street: clean(els.street.value),
    city: clean(els.city.value),
    signCity: clean(els.signCity.value) || "Berlin",
    signDate: clean(els.signDate.value),

    consentInfoMail: !!els.consentInfoMail.checked,
    consentSignal: els.consentSignalYes.checked ? "ja" : (els.consentSignalNo.checked ? "nein" : ""),
    consentLists: els.consentListsYes.checked ? "ja" : (els.consentListsNo.checked ? "nein" : ""),
    consentPhoto: els.consentPhotoYes.checked ? "ja" : (els.consentPhotoNo.checked ? "nein" : ""),
    consentBook: els.consentBookYes.checked ? "ja" : (els.consentBookNo.checked ? "nein" : ""),
  };
}

els.btnReset.addEventListener("click", () => {
  for(const id of ["startDate","childFirstName","childLastName","childBirthdate","voucherDate","voucherNumber","hours","parent1","parent2","street","city"]){
    els[id].value = "";
  }
  els.placeType.value = "teilzeit";
  els.consentInfoMail.checked = false;
  for(const r of ["consentSignalYes","consentSignalNo","consentListsYes","consentListsNo","consentPhotoYes","consentPhotoNo","consentBookYes","consentBookNo"]){
    els[r].checked = false;
  }
  els.signCity.value = "Berlin";
  els.signDate.value = todayDE();
  setStatus("Felder geleert.");
});

// ====== PDF helpers ======
function rectFromBox(pageHeight, box) {
  const x = box.x;
  const y = pageHeight - box.bottom;
  const w = box.w;
  const h = box.bottom - box.top;
  return {x,y,w,h};
}

function coverBox(page, box) {
  const r = rectFromBox(page.getHeight(), box);
  page.drawRectangle({
    x: r.x - 1,
    y: r.y - 1,
    width: r.w + 2,
    height: r.h + 2,
    color: rgb(1,1,1),
    opacity: 1
  });
}

function drawTextOver(page, font, text, box, size=11) {
  coverBox(page, box);
  const r = rectFromBox(page.getHeight(), box);
  page.drawText(text, {
    x: r.x,
    y: r.y + 2,
    size,
    font,
    color: rgb(0,0,0),
    maxWidth: r.w
  });
}

function drawX(page, font, box, offsetX=2) {
  const r = rectFromBox(page.getHeight(), box);
  page.drawText("X", {
    x: r.x + offsetX,
    y: r.y + 1,
    size: 12,
    font,
    color: rgb(0,0,0),
  });
}

function markYesNo(page, font, which, yesBox, noBox) {
  if(which === "ja") drawX(page, font, yesBox);
  else if(which === "nein") drawX(page, font, noBox);
}

function downloadBytes(bytes, filename) {
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

// ====== Generate PDF ======
async function generatePDF() {
  const data = gather();
  const templateBytes = await fetch("./templates/vertrag_template.pdf").then(r => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const p1 = pages[0];

  const fullChild = `${data.childFirstName} ${data.childLastName}`.trim();
  const parents = [data.parent1, data.parent2].filter(Boolean).join(" und ");
  const addressLine = [data.street, data.city].filter(Boolean).join(" in ");

  if(data.startDate) drawTextOver(p1, font, data.startDate, COORDS.p1.aufnahmeDatum, 11);

  if(fullChild || data.childBirthdate) {
    const text = `Name: ${fullChild || "—"} geboren am ${data.childBirthdate || "—"}`;
    drawTextOver(p1, font, text, COORDS.p1.kindZeile, 11);
  }

  {
    const place = data.placeType === "ganztag" ? "Ganztagsplatz" : "Teilzeitplatz";
    const gd = data.voucherDate || "—";
    const gn = data.voucherNumber || "—";
    const text = `Das Kind erhält aufgrund des Bescheides des zuständigen Jugendamtes vom ${gd} mit der Gutscheinnummer ${gn} einen ${place}`;
    drawTextOver(p1, font, text, COORDS.p1.voucherZeile, 10);
  }

  if(data.hours) drawTextOver(p1, font, `(${data.hours}).`, COORDS.p1.stundenZeile, 10);
  if(parents) drawTextOver(p1, font, parents, COORDS.p1.parentsLine, 11);

  if(addressLine) {
    const text = `wohnhaft in der ${data.street || ""} in ${data.city || ""}`.trim();
    drawTextOver(p1, font, text, COORDS.p1.addressLine, 11);
  }

  const footerText = `Vertrag EKT Hildegarten_2020 (${fullChild || "Vorname und Name"})`;
  for(const page of pages) drawTextOver(page, font, footerText, COORDS.footer, 8);

  {
    const sigPage = pages[COORDS.signature.pageIndex];
    const text = `${data.signCity || "Berlin"}, ${data.signDate || ""}`;
    drawTextOver(sigPage, font, text, COORDS.signature.berlinLine, 11);
  }

  {
    const c7 = pages[COORDS.consent.pageIndex7];
    if(data.consentInfoMail) drawX(c7, font, COORDS.consent.infoMailBox);
    markYesNo(c7, font, data.consentSignal, COORDS.consent.signalJa, COORDS.consent.signalNein);
  }

  {
    const c8 = pages[COORDS.consent.pageIndex8];
    markYesNo(c8, font, data.consentLists, COORDS.consent.listsJa, COORDS.consent.listsNein);
    if(data.consentPhoto === "ja") drawX(c8, font, COORDS.consent.photoJaBox);
    if(data.consentPhoto === "nein") drawX(c8, font, COORDS.consent.photoNeinBox);
    if(data.consentBook === "ja") drawX(c8, font, COORDS.consent.bookJaBox);
    if(data.consentBook === "nein") drawX(c8, font, COORDS.consent.bookNeinBox);
  }

  const outBytes = await pdfDoc.save();
  const suffix = fileSafe(fullChild) || "Kind";
  downloadBytes(outBytes, `Vertrag_EKT_Hildegarten_${suffix}.pdf`);
}

els.btnDownload.addEventListener("click", async () => {
  try {
    els.btnDownload.disabled = true;
    setStatus("Erstelle Vertrags-PDF …");
    await generatePDF();
    setStatus("Fertig ✅ PDF heruntergeladen.");
  } catch (e) {
    console.error(e);
    setStatus("Fehler beim Erstellen des PDFs. Bitte später erneut versuchen.");
  } finally {
    els.btnDownload.disabled = false;
  }
});
