const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const { mapSongDBToModel } = require('../../utils');

class SongsService {
  constructor() {
    this._pool = new Pool();
  }

  async addSong({
    title,
    year,
    performer,
    genre,
    duration,
    albumId,
  }) {
    const id = `song-${nanoid(16)}`;
    const querySong = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, year, performer, genre, duration, albumId],
    };
    const resultSong = await this._pool.query(querySong);
    if (!resultSong.rows[0].id) {
      throw new InvariantError('Gagal menambahkan song');
    }
    return resultSong.rows[0].id;
  }

  async getSongs(title, performer) {
    let querySong;

    if (title && performer) {
      querySong = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER (title) LIKE $1 AND LOWER (performer) LIKE $2',
        values: [`%${title}%`, `%${performer}%`],
      };
    } else if (title) {
      querySong = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER (title) LIKE $1',
        values: [`%${title}%`],
      };
    } else if (performer) {
      querySong = {
        text: 'SELECT id, title, performer FROM songs WHERE LOWER (performer) LIKE $1',
        values: [`%${performer}%`],
      };
    } else {
      querySong = {
        text: 'SELECT id, title, performer FROM songs',
      };
    }
    const resultSong = await this._pool.query(querySong);
    if (!resultSong.rowCount) {
      throw new NotFoundError('Tidak ditemukan song');
    }
    return resultSong.rows.map(mapSongDBToModel);
  }

  async getSongById(id) {
    const querySong = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [id],
    };
    const resultSong = await this._pool.query(querySong);
    if (!resultSong.rows.length) {
      throw new NotFoundError('Song tidak ditemukan');
    }
    return resultSong.rows.map(mapSongDBToModel)[0];
  }

  async editSongById(id, {
    title,
    year,
    performer,
    genre,
    duration,
  }) {
    const querySong = {
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5 WHERE id = $6 RETURNING id',
      values: [title, year, performer, genre, duration, id],
    };
    const resultSong = await this._pool.query(querySong);
    if (!resultSong.rows.length) {
      throw new NotFoundError('Gagal memperbaharui lagu. Id tidak ditemukan');
    }
  }

  async deleteSongById(id) {
    const querySong = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id',
      values: [id],
    };
    const resultSong = await this._pool.query(querySong);
    if (!resultSong.rows.length) {
      throw new NotFoundError('Gagal menghapus song. Id tidak ditemukan');
    }
  }
}
module.exports = SongsService;
