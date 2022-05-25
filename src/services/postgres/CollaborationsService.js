const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const NotFoundError = require('../../exceptions/NotFoundError');
const InvariantError = require('../../exceptions/InvariantError');

class CollaborationsService {
  constructor() {
    this._pool = new Pool();
  }

  async addCollaboration(playlistId, userId) {
    const id = `collab-${nanoid(16)}`;
    const queryCollaboration = {
      text: 'INSERT INTO collaborations VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, userId],
    };
    const resultCollaboration = await this._pool.query(queryCollaboration);
    if (!resultCollaboration.rows.length) {
      throw new InvariantError('Gagal menambahkan kolaborasi');
    }
    return resultCollaboration.rows[0].id;
  }

  async deleteCollaboration(playlistId, userId) {
    const queryCollaboration = {
      text: 'DELETE FROM collaborations WHERE playlist_id = $1 AND user_id = $2 RETURNING id',
      values: [playlistId, userId],
    };
    const resultCollaboration = await this._pool.query(queryCollaboration);
    if (!resultCollaboration.rows.length) {
      throw new InvariantError('Gagal menghapus kolaborasi');
    }
  }

  async verifyCollaborator(playlistId, userId) {
    const queryCollaboration = {
      text: 'SELECT * FROM collaborations WHERE playlist_id = $1 AND user_id = $2',
      values: [playlistId, userId],
    };
    const resultCollaboration = await this._pool.query(queryCollaboration);
    if (!resultCollaboration.rows.length) {
      throw new InvariantError('Gagal memverivikasi kolaborasi');
    }
  }

  async verifyExistingPlaylist(playlistsId) {
    const queryplaylist = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistsId],
    };
    const resultplaylist = await this._pool.query(queryplaylist);
    if (!resultplaylist.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
  }

  async verifyExistingUser(userId) {
    const queryUser = {
      text: 'SELECT * FROM users WHERE id = $1',
      values: [userId],
    };
    const resultUser = await this._pool.query(queryUser);
    if (!resultUser.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }
  }
}
module.exports = CollaborationsService;
