// backend/services/users/profileData.js — turns the body of PATCH /api/users/me into the columns to update.
const { cleanName, cleanOptional } = require('./validation');

const DEPARTMENT_MAX = 150;
const BIO_MAX = 300;
const PHONE_HINT = 'Phone number can only contain digits, spaces, "-" and a leading "+"';

// One entry per optional field: how to clean the value the client sent.
const CLEANERS = {
  firstName: (v) => cleanName(v, 'First name'),
  lastName: (v) => cleanName(v, 'Last name'),
  studentId: (v) => cleanOptional(v, 'Student / staff ID', 20, /^[0-9]+$/, 'Student / staff ID must be a number'),
  phone: (v) => cleanOptional(v, 'Phone number', 20, /^\+?[0-9][0-9\s-]{5,}$/, PHONE_HINT),
  department: (v) => cleanOptional(v, 'Department', DEPARTMENT_MAX),
  bio: (v) => cleanOptional(v, 'Bio', BIO_MAX),
};

/** Only the fields present in `body` are cleaned and returned (an absent field stays untouched). */
function buildProfileData(body) {
  const data = {};
  for (const [field, clean] of Object.entries(CLEANERS)) {
    if (body[field] !== undefined) data[field] = clean(body[field]);
  }
  return data;
}

module.exports = { buildProfileData };
