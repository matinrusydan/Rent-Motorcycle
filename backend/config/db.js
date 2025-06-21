// backend/config/db.js
const mysql = require('mysql2/promise'); 
require('dotenv').config(); 

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', 
    database: process.env.DB_NAME || 'rental_motor_db', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


db.getConnection()
  .then(connection => {
    console.log('Terhubung ke database MySQL!');
    connection.release(); 
  })
  .catch(err => {
    console.error('Gagal terhubung ke database MySQL:', err);
    process.exit(1); 
  });

module.exports = db;