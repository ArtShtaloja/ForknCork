const contactRepository = require('../repositories/contact.repository.js');

/**
 * Get all contact messages.
 * @returns {Promise<Array>}
 */
const getAll = async () => {
  return contactRepository.findAll();
};

/**
 * Get a single contact message by ID.
 * @param {number} id
 * @returns {Promise<object>}
 * @throws {Error} If not found
 */
const getById = async (id) => {
  const message = await contactRepository.findById(id);

  if (!message) {
    throw Object.assign(new Error('Contact message not found'), { statusCode: 404 });
  }

  return message;
};

/**
 * Create a new contact message.
 * @param {object} data - { name, email, phone, subject, message }
 * @returns {Promise<object>} The newly created message
 */
const create = async (data) => {
  const id = await contactRepository.create(data);
  return contactRepository.findById(id);
};

/**
 * Mark a contact message as read.
 * @param {number} id
 * @returns {Promise<object>} The updated message
 */
const markAsRead = async (id) => {
  const message = await contactRepository.findById(id);

  if (!message) {
    throw Object.assign(new Error('Contact message not found'), { statusCode: 404 });
  }

  await contactRepository.markAsRead(id);
  return contactRepository.findById(id);
};

/**
 * Delete a contact message.
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const remove = async (id) => {
  const message = await contactRepository.findById(id);

  if (!message) {
    throw Object.assign(new Error('Contact message not found'), { statusCode: 404 });
  }

  return contactRepository.delete(id);
};

/**
 * Count unread contact messages.
 * @returns {Promise<number>}
 */
const countUnread = async () => {
  return contactRepository.countUnread();
};

module.exports = {
  getAll,
  getById,
  create,
  markAsRead,
  delete: remove,
  countUnread,
};
