class PlaylistsHandler {
  constructor(service, validator) {
    this._validator = validator;
    this._service = service;

    // Binding playlist
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);

    // binding song to playlist
    this.deleteSongFromPlaylistHandler = this.deleteSongFromPlaylistHandler.bind(this);
    this.postSongToPlaylistHandler = this.postSongToPlaylistHandler.bind(this);
    this.getSongsFromPlaylistHandler = this.getSongsFromPlaylistHandler.bind(this);

    // binding playlist activities
    this.getPlaylistActivitiesHandler = this.getPlaylistActivitiesHandler.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { name } = request.payload;
    const playlistId = await this._service.addPlaylist(name, credentialId);
    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan playlist',
      data: {
        playlistId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const filteredPlaylists = await this._service.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists: filteredPlaylists.map((playlists) => ({
          id: playlists.id,
          name: playlists.name,
          username: playlists.username,
        })),
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._service.verifyPlaylistOwner(id, credentialId);
    await this._service.deletePlaylistById(id);
    return {
      status: 'success',
      message: 'Berhasil menghapus playlist',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { songId } = request.payload;
    const { id: playlistId } = request.params;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.addSongToPlaylist(playlistId, songId);
    await this._service.postActivity(playlistId, songId, credentialId, 'add');
    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan song ke playlist',
    });

    response.code(201);
    return response;
  }

  async getSongsFromPlaylistHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this._service.getPlaylistById(playlistId);
    const songs = await this._service.getSongsFromPlaylist(playlistId);
    const playlistContainSongs = { ...playlist, songs };
    return {
      status: 'success',
      data: {
        playlist: playlistContainSongs,
      },
    };
  }

  async deleteSongFromPlaylistHandler(request) {
    const { songId } = request.payload;
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    await this._service.deleteSongFromPlaylist(playlistId, songId);
    await this._service.postActivity(playlistId, songId, credentialId, 'delete');
    return {
      status: 'success',
      message: 'Berhasil menghapus song dari playlist',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    await this._service.verifyPlaylistAccess(playlistId, credentialId);
    const activities = await this._service.getPlaylistActivities(playlistId);
    return {
      status: 'success',
      data: {
        playlistId,
        activities: activities.map((playlistact) => ({
          username: playlistact.username,
          title: playlistact.title,
          action: playlistact.action,
          time: playlistact.time,
        })),
      },
    };
  }
}
module.exports = { PlaylistsHandler };
