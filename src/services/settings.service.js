const settingsRepository = require('../repositories/settings.repository.js');

/**
 * Get all restaurant settings.
 * @returns {Promise<Array>}
 */
const getAll = async () => {
  return settingsRepository.findAll();
};

/**
 * Get a single setting by its key.
 * @param {string} key
 * @returns {Promise<object>}
 * @throws {Error} If not found
 */
const getByKey = async (key) => {
  const setting = await settingsRepository.findByKey(key);

  if (!setting) {
    throw Object.assign(new Error(`Setting "${key}" not found`), { statusCode: 404 });
  }

  return setting;
};

/**
 * Update a setting value by key.
 * @param {string} key
 * @param {string} value
 * @returns {Promise<object>} The updated setting
 */
const update = async (key, value) => {
  const setting = await settingsRepository.findByKey(key);

  if (!setting) {
    throw Object.assign(new Error(`Setting "${key}" not found`), { statusCode: 404 });
  }

  await settingsRepository.update(key, value);
  return settingsRepository.findByKey(key);
};

/**
 * Get all opening hours.
 * @returns {Promise<Array>}
 */
const getOpeningHours = async () => {
  return settingsRepository.getOpeningHours();
};

/**
 * Update opening hours for a specific day.
 * @param {number} id
 * @param {object} data - { open_time, close_time, is_closed }
 * @returns {Promise<boolean>}
 */
const updateOpeningHours = async (id, data) => {
  const updated = await settingsRepository.updateOpeningHours(id, data);

  if (!updated) {
    throw Object.assign(new Error('Opening hours entry not found'), { statusCode: 404 });
  }

  return updated;
};

module.exports = {
  getAll,
  getByKey,
  update,
  getOpeningHours,
  updateOpeningHours,
};
