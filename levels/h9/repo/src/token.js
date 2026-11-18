const SECRET = 's3cr3t';

function b64(s) { return btoa(s).replace(/=+$/, ''); }
function unb64(s) { return atob(s); }
function sign(body) {
  const h = [...(body + SECRET)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
  return (h >>> 0).toString(16);
}
function issue(payload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

module.exports = { issue, sign, b64, unb64 };
