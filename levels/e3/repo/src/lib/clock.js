let offset = 0;

module.exports = {
  now: () => Date.now() + offset,
  advance: (ms) => { offset += ms; },
};
