const service = require('../services/ticketService');

exports.list = async (req, res) => {
  const tickets = await service.listTickets({ status: req.query.status });
  res.json(tickets);
};

exports.create = async (req, res) => {
  const ticket = await service.createTicket(req.user, req.body);
  res.status(201).json(ticket);
};

exports.get = async (req, res) => {
  const ticket = await service.getTicket(req.params.id);
  res.json(ticket);
};

exports.addReply = async (req, res) => {
  const reply = await service.addReply(req.params.ticketId, req.user, req.body.body);
  res.status(201).json(reply);
};

exports.close = async (req, res) => {
  const ticket = await service.closeTicket(req.params.id, req.user);
  res.json(ticket);
};
