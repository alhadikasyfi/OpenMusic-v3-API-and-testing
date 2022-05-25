const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const {
  mapAlbumDBToModel,
  mapSongDBToModel,
} = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum(name, year) {
    const id = `album-${nanoid(16)}`;
    const queryAlbum = {
      text: 'INSERT INTO albums(id, name, year) VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const resultAlbum = await this._pool.query(queryAlbum);

    if (!resultAlbum.rows[0].id) {
      throw new InvariantError('Gagal Menambahkan album');
    }
    await this._cacheService.delete('albums');
    return resultAlbum.rows[0].id;
  }

  async getAlbums() {
    try {
      const resultAlbum = await this._cacheService.get('album');
      return { albums: JSON.parse(resultAlbum), isCache: 1 };
    } catch (error) {
      const queryAlbum = {
        text: 'SELECT * FROM albums',
      };
      const resultAlbum = await this._pool.query(queryAlbum);
      const mappedResult = resultAlbum.rows.map(mapAlbumDBToModel);
      await this._cacheService.set('albums', JSON.stringify(mappedResult));
      return { albums: { ...mappedResult } };
    }
  }

  async getAlbumById(id) {
    try {
      const resultAlbum = await this._cacheService.get(`album:${id}`);
      return { album: JSON.parse(resultAlbum), isCache: 1 };
    } catch (error) {
      const queryAlbum = {
        text: 'SELECT * FROM albums WHERE id = $1',
        values: [id],
      };

      const resultAlbum = await this._pool.query(queryAlbum);
      if (!resultAlbum.rows.length) {
        throw new NotFoundError('Id Album Tidak ditemukan');
      }
      const mappedResult = resultAlbum.rows.map(mapAlbumDBToModel)[0];
      await this._cacheService.set(`album:${id}`, JSON.stringify(mappedResult));
      return { album: { ...mappedResult } };
    }
  }

  async editAlbumById(id, { name, year }) {
    const queryAlbum = {
      text: 'UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id',
      values: [name, year, id],
    };
    const resultAlbum = await this._pool.query(queryAlbum);
    if (!resultAlbum.rows.length) {
      throw new NotFoundError('Album Gagal diperbaharui, Id tidak ditemukan');
    }
    await this._cacheService.delete(`album:${id}`);
  }

  async deleteAlbumById(id) {
    const queryAlbum = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };
    const resultAlbum = await this._pool.query(queryAlbum);
    if (!resultAlbum.rows.length) {
      throw new NotFoundError('Gagal menghapus album, Id tidak ditemukan');
    }
    await this._cacheService.delete(`album:${id}`);
  }

  async getSongsByAlbumId(id) {
    try {
      const resultAlbum = await this._cacheService.get(`album-songs:${id}`);
      return { songs: JSON.parse(resultAlbum), isCache: 1 };
    } catch (error) {
      const queryAlbum = {
        text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
        values: [id],
      };
      const resultAlbum = await this._pool.query(queryAlbum);
      const mappedResult = resultAlbum.rows.map(mapSongDBToModel);
      await this._cacheService.set(`album-songs:${id}`, JSON.stringify(mappedResult));
      return { songs: mappedResult };
    }
  }

  async addAlbumCover(albumId, coverUrl) {
    const queryAlbum = {
      text: 'UPDATE albums SET cover_url = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, albumId],
    };

    const resultAlbum = await this._pool.query(queryAlbum);
    if (!resultAlbum.rows.length) {
      throw new InvariantError('Gagal menambahkan cover');
    }
    await this._cacheService.delete(`album:${albumId}`);
  }

  async addAlbumLikes(albumId, userId) {
    const queryAlbum = {
      text: 'SELECT * FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };

    const resultAlbum = await this._pool.query(queryAlbum);

    if (!resultAlbum.rowCount) {
      await this.doLikeAlbum(userId, albumId);
    } else {
      await this.doDislikeAlbum(userId, albumId);
    }
    await this._cacheService.delete(`likes:${albumId}`);
  }

  async doLikeAlbum(userId, albumId) {
    const id = `likes-${nanoid(16)}`;
    const queryAlbum = {
      text: 'INSERT INTO user_album_likes(id, user_id, album_id) VALUES($1, $2, $3)',
      values: [id, userId, albumId],
    };
    const resultAlbum = await this._pool.query(queryAlbum);
    if (!resultAlbum.rowCount) {
      throw new InvariantError('Gagal menambah jumlah like');
    }
  }

  async doDislikeAlbum(userId, albumId) {
    const queryAlbum = {
      text: 'DELETE FROM user_album_likes WHERE album_id = $1 AND user_id = $2',
      values: [albumId, userId],
    };
    const resultAlbum = await this._pool.query(queryAlbum);
    if (!resultAlbum.rowCount) {
      throw new InvariantError('Gagal mengurangi like');
    }
  }

  async getAllAlbumLikes(albumId) {
    try {
      const resultAlbum = await this._cacheService.get(`likes:${albumId}`);
      return { likes: JSON.parse(resultAlbum), isCache: 1 };
    } catch (error) {
      const queryAlbum = {
        text: 'SELECT user_id FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const resultAlbum = await this._pool.query(queryAlbum);

      await this._cacheService.set(`likes:${albumId}`, JSON.stringify(resultAlbum.rows));
      return { likes: resultAlbum.rows };
    }
  }
}
module.exports = AlbumsService;
