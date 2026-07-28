const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const sslConfig = {
    ca: fs.readFileSync(path.join(__dirname, "ca.pem"))
};

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const initDB = async () => {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: sslConfig
        });

        console.log("Connected to Aiven MySQL.");

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role ENUM('student','admin') DEFAULT 'student',
                profile_picture LONGTEXT,
                mobile_number VARCHAR(20),
                dob DATE,
                gender VARCHAR(20),
                register_number VARCHAR(50),
                department VARCHAR(100),
                year_of_study VARCHAR(20),
                section VARCHAR(20),
                college_name VARCHAR(200),
                last_login_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS exams (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                duration_minutes INT NOT NULL,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by)
                    REFERENCES users(id)
                    ON DELETE SET NULL
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS questions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                exam_id INT NOT NULL,
                question_text TEXT NOT NULL,
                option_a VARCHAR(255) NOT NULL,
                option_b VARCHAR(255) NOT NULL,
                option_c VARCHAR(255) NOT NULL,
                option_d VARCHAR(255) NOT NULL,
                correct_option CHAR(1) NOT NULL,
                FOREIGN KEY (exam_id)
                    REFERENCES exams(id)
                    ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                exam_id INT NOT NULL,
                score INT NOT NULL,
                total_questions INT NOT NULL,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)
                    REFERENCES users(id)
                    ON DELETE CASCADE,
                FOREIGN KEY (exam_id)
                    REFERENCES exams(id)
                    ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS answers (
                id INT AUTO_INCREMENT PRIMARY KEY,
                result_id INT NOT NULL,
                question_id INT NOT NULL,
                selected_option CHAR(1),
                is_correct BOOLEAN DEFAULT FALSE,
                FOREIGN KEY (result_id)
                    REFERENCES results(id)
                    ON DELETE CASCADE,
                FOREIGN KEY (question_id)
                    REFERENCES questions(id)
                    ON DELETE CASCADE
            )
        `);

        console.log("Database tables initialized successfully.");
    } catch (err) {
        console.error("Database initialization failed:");
        console.error(err);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

module.exports = {
    pool,
    initDB
};