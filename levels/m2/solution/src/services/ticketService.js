const repo = require('../repositories/ticketRepo');
const { ValidationError, NotFoundError, ForbiddenError, ConflictError } = require('../errors');

async function listTickets({ status }) {
  const tickets = await repo.findTickets(status ? { status } : {});
  return Promise.all(tickets.map(async (t) => ({ ...t, replyCount: await repo.countReplies(t._id) })));
}

async function createTicket(user, { title, description }) {
  if (!title || !title.trim()) throw new ValidationError('title is required');
  return repo.insertTicket({ title: title.trim(), description: description || '', authorId: user.id, status: 'open' });
}

async function getTicket(id) {
  const ticket = await repo.findTicketById(id);
  if (!ticket) throw new NotFoundError('Ticket');
  const replies = await repo.findReplies(id);
  return { ...ticket, replies };
}

async function addReply(ticketId, user, body) {
  if (!body || !body.trim()) throw new ValidationError('reply body is required');
  const ticket = await repo.findTicketById(ticketId);
  if (!ticket) throw new NotFoundError('Ticket');
  if (ticket.status === 'closed') throw new ConflictError('ticket is closed');
  return repo.insertReply({ ticketId, authorId: user.id, body: body.trim() });
}

async function closeTicket(id, user) {
  const ticket = await repo.findTicketById(id);
  if (!ticket) throw new NotFoundError('Ticket');
  if (ticket.authorId !== user.id && user.role !== 'agent') {
    throw new ForbiddenError('only the author or an agent can close this ticket');
  }
  return repo.updateTicket(id, { status: 'closed' });
}

module.exports = { listTickets, createTicket, getTicket, addReply, closeTicket };
