const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function validateProfile({ name, age, email, tags }) {
  const errors = [];
  if (!name || !String(name).trim()) errors.push('name is required');
  if (!Number.isInteger(age) || age < 0 || age > 120) errors.push('age must be an integer 0-120');
  if (!EMAIL.test(email || '')) errors.push('email is invalid');
  if (tags !== undefined && (!Array.isArray(tags) || tags.length > 5 || !tags.every((t) => typeof t === 'string'))) {
    errors.push('tags must be up to 5 strings');
  }
  return errors;
}

module.exports = { validateProfile };
