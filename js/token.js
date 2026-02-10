// Token generator (client-side only)
const els = {
  len: document.getElementById("len"),
  token: document.getElementById("token"),
  btnGen: document.getElementById("btnGen"),
  btnCopy: document.getElementById("btnCopy"),
  status: document.getElementById("status"),
  appUrl: document.getElementById("appUrl"),
  link: document.getElementById("link"),
  btnCopyLink: document.getElementById("btnCopyLink"),
};

function setStatus(msg) { els.status.textContent = msg; }

function base64url(bytes) {
  let bin = "";
  bytes.forEach(b => (bin += String.fromCharCode(b)));
  return btoa(bin).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function generateToken(len) {
  const bytes = new Uint8Array(Math.ceil(len * 0.8) + 8);
  crypto.getRandomValues(bytes);
  return base64url(bytes).slice(0, len);
}

function updateLink() {
  const token = (els.token.value || "").trim();
  const app = (els.appUrl.value || "").trim();
  if (!token || !app) { els.link.value = ""; return; }
  const normalized = app.split("?")[0];
  els.link.value = `${normalized}?token=${encodeURIComponent(token)}`;
}

async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    return true;
  }
}

function genAndFill() {
  const len = parseInt(els.len.value, 10) || 32;
  els.token.value = generateToken(len);
  setStatus("Neuer Token erzeugt ✅");
  updateLink();
}

els.btnGen.addEventListener("click", genAndFill);

els.btnCopy.addEventListener("click", async () => {
  const t = (els.token.value || "").trim();
  if (!t) return setStatus("Bitte zuerst einen Token erzeugen.");
  await copyToClipboard(t);
  setStatus("Token kopiert ✅");
});

els.appUrl.addEventListener("input", updateLink);

els.btnCopyLink.addEventListener("click", async () => {
  const l = (els.link.value || "").trim();
  if (!l) return setStatus("Bitte App-URL setzen (und Token erzeugen).");
  await copyToClipboard(l);
  setStatus("Link kopiert ✅");
});

genAndFill();
