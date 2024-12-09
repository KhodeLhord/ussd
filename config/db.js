const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '65.108.74.236',
    user: 'xtocast_shiine',
    password: '^Jp;k%Ek~}iF',
    database: 'xtocast_awards_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to the database!');
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

module.exports = { pool, testConnection };
