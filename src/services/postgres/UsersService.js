const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { mapUserDBToModel } = require('../../utils');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    await this.verifyNewUsername(username);
    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const queryUser = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const resultUser = await this._pool.query(queryUser);
    if (!resultUser.rows.length) {
      throw new InvariantError('Gagal menambahkan user');
    }
    return resultUser.rows[0].id;
  }

  async verifyNewUsername(username) {
    const queryUser = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };
    const resultUser = await this._pool.query(queryUser);
    if (resultUser.rows.length > 0) {
      throw new InvariantError('User gagal ditambahkan. Username sudah ada yang menggunakan.');
    }
  }

  async getUserById(userId) {
    const queryUser = {
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    };
    const resultUser = await this._pool.query(queryUser);
    if (!resultUser.rows.length) {
      throw new NotFoundError('User belum terdaftar/ User id tidak ditemukan');
    }
    return resultUser.rows.map(mapUserDBToModel)[0];
  }

  async verifyUserCredential(username, password) {
    const queryUser = {
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    };
    const resultUser = await this._pool.query(queryUser);
    if (!resultUser.rows.length) {
      throw new AuthenticationError('Kredensial yang Anda berikan kurang tepat');
    }
    const { id, password: hashedPassword } = resultUser.rows[0];
    const match = await bcrypt.compare(password, hashedPassword);
    if (!match) {
      throw new AuthenticationError('Kredensial yang Anda berikan tidak tepat');
    }
    return id;
  }
}
module.exports = UsersService;
