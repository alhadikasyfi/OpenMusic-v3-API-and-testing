const { ExportPlaylistsSchema } = require('./schema');
const InvariantError = require('../../exceptions/InvariantError');

const ExportsValidator = {
  validateExportPlaylistsPayload: (payload) => {
    const { error } = ExportPlaylistsSchema.validate(payload);
    if (error) {
      throw new InvariantError(error.message);
    }
  },
};
module.exports = ExportsValidator;
