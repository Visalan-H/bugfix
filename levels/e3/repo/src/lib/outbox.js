const sent = [];

module.exports = {
  send: (mail) => { sent.push(mail); },
  sent,
};
