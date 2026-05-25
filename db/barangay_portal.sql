CREATE DATABASE IF NOT EXISTS barangay_portal;
USE barangay_portal;

CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

INSERT INTO admins(username,password)
VALUES ('admin', MD5('admin'));

CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporter VARCHAR(255),
    type VARCHAR(100),
    urgency VARCHAR(50),
    location TEXT,
    details TEXT,
    photo VARCHAR(255),
    video VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Ongoing',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);