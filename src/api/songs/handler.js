class SongsHandler {
  constructor(service, validator) {
    this._validator = validator;
    this._service = service;

    // binding song
    this.getSongByIdHandler = this.getSongByIdHandler.bind(this);
    this.deleteSongByIdHandler = this.deleteSongByIdHandler.bind(this);
    this.putSongByIdHandler = this.putSongByIdHandler.bind(this);
    this.postSongHandler = this.postSongHandler.bind(this);
    this.getSongsHandler = this.getSongsHandler.bind(this);
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const {
      title = 'untitled',
      year,
      performer,
      genre,
      duration,
      albumId,
    } = request.payload;

    const songId = await this._service.addSong({
      title,
      year,
      performer,
      genre,
      duration,
      albumId,
    });
    const response = h.response({
      status: 'success',
      message: 'Berhasil menambahkan song',
      data: {
        songId,
      },
    });

    response.code(201);
    return response;
  }

  async getSongsHandler(request, h) {
    const {
      title,
      performer,
    } = request.query;
    const songs = await this._service.getSongs(title, performer);
    const response = h.response({
      status: 'success',
      data: {
        songs: songs.map((persong) => ({
          id: persong.id,
          title: persong.title,
          performer: persong.performer,
        })),
      },
    });

    response.code(200);
    return response;
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);
    const { id } = request.params;
    await this._service.editSongById(id, request.payload);
    return {
      status: 'success',
      message: 'Berhasil memperbaharui song',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteSongById(id);
    return {
      status: 'success',
      message: 'Berhasil menghapus song',
    };
  }
}
module.exports = { SongsHandler };
