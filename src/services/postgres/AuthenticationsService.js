const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class AuthenticationsService {
  constructor() {
    this._pool = new Pool();
  }

  async addRefreshToken(token) {
    const queryAuth = {
      text: 'INSERT INTO authentications VALUES($1)',
      values: [token],
    };
    await this._pool.query(queryAuth);
  }

  async verifyRefreshToken(token) {
    const queryAuth = {
      text: 'SELECT token FROM authentications WHERE token = $1',
      values: [token],
    };
    const resultAuth = await this._pool.query(queryAuth);
    if (!resultAuth.rows.length) {
      throw new InvariantError('Validasi refresh token gagal, token tidak valid');
    }
  }

  async deleteRefreshToken(token) {
    const queryAuth = {
      text: 'DELETE FROM authentications WHERE token = $1',
      values: [token],
    };
    await this._pool.query(queryAuth);
  }
}
module.exports = AuthenticationsService;
