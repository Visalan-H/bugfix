function sign(payload) {
  const h = [...String(payload)].reduce((a, c) => (a * 33 + c.charCodeAt(0)) | 0, 5381);
  return (h >>> 0).toString(16);
}

function verify(payload, signature) {
  return signature === sign(payload);
}

module.exports = { sign, verify };
