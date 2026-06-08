const { sendError } = require('../utils/response.helper');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(', ');
      return sendError(res, message, 400);
    }
    req.validatedBody = result.data;
    next();
  };
}

module.exports = { validate };
