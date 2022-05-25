const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const {
  mapGetPlaylistDBToModel,
  mapSongDBToModel,
  mapGetPlaylistActivitiesDBToModel,
} = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid(16)}`;
    const queryPlaylist = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows.length) {
      throw new InvariantError('Gagal menambahkan playlist');
    }
    return resultPlaylist.rows[0].id;
  }

  async getPlaylists(owner) {
    const queryPlaylist = {
      text: `
        SELECT playlists.id, playlists.name, users.username 
        FROM playlists
        LEFT JOIN users ON playlists.owner = users.id
        LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id
        WHERE playlists.owner = $1 OR collaborations.user_id = $1`,
      values: [owner],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    return resultPlaylist.rows.map(mapGetPlaylistDBToModel);
  }

  async getPlaylistById(id) {
    const queryPlaylist = {
      text: `
        SELECT playlists.id, playlists.name, users.username FROM playlists 
        LEFT JOIN users ON playlists.owner = users.id
        LEFT JOIN collaborations ON playlists.id = collaborations.playlist_id
        WHERE playlists.id = $1`,
      values: [id],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Gagal menemukan playlist, Id playlist tidak ditemukan');
    }
    return resultPlaylist.rows.map(mapGetPlaylistDBToModel)[0];
  }

  async deletePlaylistById(id) {
    const queryPlaylist = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Gagal menghapus playlist. Id tidak ditemukan');
    }
  }

  async addSongToPlaylist(playlistId, songId) {
    await this.verifyExistingSong(songId);
    const id = `playlist_songs-${nanoid(16)}`;
    const queryPlaylist = {
      text: 'INSERT INTO playlist_songs(id, playlist_id, song_id) VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows[0].id) {
      throw new InvariantError('Gagal menambahkan song ke playlist');
    }
  }

  async getSongsFromPlaylist(playlistId) {
    const queryPlaylist = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs
      JOIN playlist_songs ON songs.id = playlist_songs.song_id 
      WHERE playlist_songs.playlist_id = $1`,
      values: [playlistId],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    return resultPlaylist.rows.map(mapSongDBToModel);
  }

  async deleteSongFromPlaylist(playlistId, songId) {
    const queryPlaylist = {
      text: 'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING id',
      values: [playlistId, songId],
    };

    const resultPlaylist = await this._pool.query(queryPlaylist);

    if (!resultPlaylist.rows.length) {
      throw new InvariantError('Gagal menghapus song. Id lagu tidak ditemukan didalam Playlist');
    }
  }

  async getPlaylistActivities(playlistId) {
    const queryPlaylist = {
      text: `SELECT users.username, songs.title, playlist_song_activities.action, playlist_song_activities.time
        FROM playlist_song_activities
        RIGHT JOIN users ON users.id = playlist_song_activities.user_id
        RIGHT JOIN songs ON songs.id = playlist_song_activities.song_id
        WHERE playlist_song_activities.playlist_id = $1`,
      values: [playlistId],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    return resultPlaylist.rows.map(mapGetPlaylistActivitiesDBToModel);
  }

  async postActivity(playlistId, songId, userId, action) {
    const id = `playlist_song_activities-${nanoid(16)}`;
    const time = new Date().toISOString();
    const queryPlaylist = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows.length) {
      throw new InvariantError('Aktifitas gagal ditambahkan');
    }
    return resultPlaylist.rows[0].id;
  }

  async verifyPlaylistOwner(id, owner) {
    const queryPlaylist = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [id],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }
    const playlist = resultPlaylist.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Tidak berhak mengakses resource');
    }
  }

  async verifyExistingSong(songId) {
    const queryPlaylist = {
      text: 'SELECT * FROM songs WHERE id = $1',
      values: [songId],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Song tidak ditemukan');
    }
  }

  async verifyExistingPlaylist(playlistId) {
    const queryPlaylist = {
      text: 'SELECT * FROM playlists WHERE id = $1',
      values: [playlistId],
    };
    const resultPlaylist = await this._pool.query(queryPlaylist);
    if (!resultPlaylist.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan, silahkan membuat playlist baru');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }
}

module.exports = PlaylistsService;
