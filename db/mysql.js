const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'maranguape.a3sitsolutions.com.br',
  user: 'root',
  password: '',
  database: 'meeubanco',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();
