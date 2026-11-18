const db = require('memdb');
const tickets = db.collection('tickets');
const replies = db.collection('replies');

let seq = 0;

exports.findTickets = (filter) => tickets.find(filter);
exports.findTicketById = (id) => tickets.findById(id);
exports.insertTicket = (doc) => tickets.insert(doc);
exports.updateTicket = (id, patch) => tickets.updateById(id, patch);

exports.insertReply = (doc) => replies.insert({ ...doc, seq: ++seq });
exports.countReplies = (ticketId) => replies.count({ ticketId });
exports.findReplies = async (ticketId) => {
  const rows = await replies.find({ ticketId });
  return rows.sort((a, b) => a.seq - b.seq);
};
