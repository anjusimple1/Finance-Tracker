const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const users = [];
const transactions = [];

function now() {
  return new Date();
}

function cloneUserForClient(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
}

async function findUserByEmail(email) {
  return users.find((u) => u.email === String(email).toLowerCase().trim()) || null;
}

async function createUser({ name, email, password }) {
  const hashed = await bcrypt.hash(password, 10);
  const timestamp = now();
  const user = {
    _id: randomUUID(),
    name: name.trim(),
    email: String(email).toLowerCase().trim(),
    password: hashed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  users.push(user);
  return user;
}

async function checkPassword(user, enteredPassword) {
  return bcrypt.compare(enteredPassword, user.password);
}

async function findUserById(id) {
  return users.find((u) => String(u._id) === String(id)) || null;
}

async function listTransactionsForUser(userId) {
  return transactions
    .filter((t) => String(t.userId) === String(userId))
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function createTransaction({ userId, amount, type, category, date }) {
  const timestamp = now();
  const transaction = {
    _id: randomUUID(),
    userId,
    amount,
    type,
    category,
    date,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  transactions.push(transaction);
  return transaction;
}

async function updateTransactionById(id, userId, updates) {
  const idx = transactions.findIndex((t) => String(t._id) === String(id) && String(t.userId) === String(userId));
  if (idx < 0) return null;
  transactions[idx] = {
    ...transactions[idx],
    ...updates,
    updatedAt: now(),
  };
  return transactions[idx];
}

async function deleteTransactionById(id, userId) {
  const idx = transactions.findIndex((t) => String(t._id) === String(id) && String(t.userId) === String(userId));
  if (idx < 0) return null;
  const [removed] = transactions.splice(idx, 1);
  return removed;
}

module.exports = {
  cloneUserForClient,
  findUserByEmail,
  createUser,
  checkPassword,
  findUserById,
  listTransactionsForUser,
  createTransaction,
  updateTransactionById,
  deleteTransactionById,
};
