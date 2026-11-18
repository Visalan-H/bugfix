function parseLine(line) {
  return line.split(',').map((f) => f.trim());
}

module.exports = { parseLine };
