// Stand-in for bcrypt. Not the bug.
exports.hash = (s) => 'h$' + s.split('').reverse().join('');
