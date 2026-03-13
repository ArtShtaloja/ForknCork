/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {*}      data       - Payload to return under `data`
 * @param {string} [message]  - Human-readable success message
 * @param {number} [statusCode=200]
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res
 * @param {string} [message]    - Human-readable error message
 * @param {number} [statusCode=500]
 * @param {*}      [errors]     - Optional validation / detail errors
 */
function error(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  const body = {
    success: false,
    message,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
}

/**
 * Send a paginated JSON response.
 *
 * @param {import('express').Response} res
 * @param {Array}  data   - The current page of records
 * @param {number} page   - Current page number (1-based)
 * @param {number} limit  - Records per page
 * @param {number} total  - Total record count across all pages
 */
function paginate(res, data, page, limit, total) {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    message: 'Success',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

module.exports = { success, error, paginate };
