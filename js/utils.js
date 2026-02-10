// Shared helpers
window.Utils = (() => {
  function todayDE(){
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  function isoToDE(iso){
    if(!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    const [y,m,d] = iso.split("-");
    return `${d}.${m}.${y}`;
  }

  function clean(s){ return (s ?? "").toString().trim(); }

  function fileSafe(s){
    return (s || "")
      .replace(/\s+/g,"_")
      .replace(/[^a-zA-Z0-9_\-]/g,"")
      .slice(0,80);
  }

  function setText(el, txt){ el.textContent = txt; }

  return { todayDE, isoToDE, clean, fileSafe, setText };
})();
