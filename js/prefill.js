// Token → Worker → prefill
window.Prefill = (() => {
  const { WORKER_BASE_URL } = window.APP_CONFIG;

  async function loadByToken(token){
    const url = `${WORKER_BASE_URL}/lookup?token=${encodeURIComponent(token)}`;
    const resp = await fetch(url);
    const data = await resp.json().catch(() => ({}));
    if(!resp.ok) {
      const err = new Error("prefill_failed");
      err.detail = data;
      throw err;
    }
    return data;
  }

  function getTokenFromUrl(){
    return new URLSearchParams(window.location.search).get("token");
  }

  return { loadByToken, getTokenFromUrl };
})();
