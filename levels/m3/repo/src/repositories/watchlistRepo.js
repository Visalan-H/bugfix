const db = require('memdb');
const lists = db.collection('watchlists');

exports.getOrCreate = async (userId) => {
  const found = await lists.findOne({ userId });
  if (found) return found;
  return lists.insert({ userId, items: [] });
};

exports.save = (wl) => lists.updateById(wl._id, { items: wl.items });
