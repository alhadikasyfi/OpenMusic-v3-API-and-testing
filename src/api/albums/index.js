const { routes } = require('./routes');
const { AlbumsHandler } = require('./handler');

module.exports = {
  name: 'albums',
  version: '1.0.0',
  register: async (
    server,
    {
      service,
      validator,
      storageService,
      uploadValidator,
    },
  ) => {
    const handler = new AlbumsHandler(service, validator, storageService, uploadValidator);
    server.route(routes(handler));
  },
};
