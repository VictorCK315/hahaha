require('dotenv').config();
const env = process.env;
const db = {
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_DATABASE,
}
const mysql = require('mysql');

const pubsub = {
  TOPICNAME_PRICE: env.TOPICNAME_PRICE,
  TOPICNAME_STOCK: env.TOPICNAME_STOCK,
}

exports.pubsub = pubsub;

function disconnect_handler() {
  let conn = mysql.createConnection(db);
  conn.connect(err => {
    (err) && setTimeout('disconnect_handler()', 2000);
  });

  conn.on('error', err => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      // db error reconnect
      console.log('db error reconnecting');
      disconnect_handler();
    } else {
      throw err;
    }
  });
  exports.conn = conn;
}

exports.disconnect_handler = disconnect_handler;
