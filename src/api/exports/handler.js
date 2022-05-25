class ExportsHandler {
  constructor(service, playlistsService, validator) {
    this._playlistsService = playlistsService;
    this._service = service;
    this._validator = validator;

    // Binding
    this.postExportPlaylistsHandler = this.postExportPlaylistsHandler.bind(this);
  }

  async postExportPlaylistsHandler(request, h) {
    this._validator.validateExportPlaylistsPayload(request.payload);
    const { playlistId } = request.params;
    const { id: userId } = request.auth.credentials;
    const { targetEmail } = request.payload;
    await this._playlistsService.verifyExistingPlaylist(playlistId);
    await this._playlistsService.verifyPlaylistAccess(playlistId, userId);

    const messageMail = { playlistId, targetEmail };
    await this._service.sendMessage('export:playlists', JSON.stringify(messageMail));
    const response = h.response({
      status: 'success',
      message: 'Permintaan sudah masuk ke dalam antrian message',
    });

    response.code(201);
    return response;
  }
}
module.exports = { ExportsHandler };
