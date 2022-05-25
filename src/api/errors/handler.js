const ClientError = require('../../exceptions/ClientError');
/* eslint-disable class-methods-use-this */
/* eslint-disable no-else-return */

class ErrorHandler {
  errorHandler(request, h) {
    const { response } = request;
    const statusCode = response.output ? response.output.statusCode : 200;
    if (response instanceof ClientError) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });

      newResponse.code(response.statusCode);
      return newResponse;
    }
    if (statusCode === 500) {
      console.error(response.message);
      const serverResponse = h.response({
        status: 'error',
        message: 'Mohon maaf, Terjadi kesalahan pada server',
      });

      serverResponse.code(500);
      return serverResponse;
    }

    return response.continue || response;
  }
}
module.exports = ErrorHandler;
