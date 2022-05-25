const Joi = require('joi');

const ExportPlaylistsSchema = Joi.object({
  targetEmail: Joi.string().email({ tlds: true }).required(),
});
module.exports = { ExportPlaylistsSchema };
