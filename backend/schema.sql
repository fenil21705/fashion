-- Database Schema for Fashion E-commerce

CREATE DATABASE IF NOT EXISTS fashion_ecommerce;
USE fashion_ecommerce;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url LONGTEXT, -- Changed to LONGTEXT for Base64
    images LONGTEXT, -- New column for multiple images (JSON)
    sizes TEXT, -- New column for sizes (JSON)
    gender VARCHAR(50), -- New column
    category VARCHAR(100),
    stock INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    total_amount DECIMAL(10, 2) NOT NULL,
    shipping_info TEXT, -- JSON
    payment_info TEXT, -- JSON
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert Sample Products
INSERT INTO products (name, description, price, image_url, category) VALUES
('Premium Cotton White Tee', 'Crafted from 100% organic cotton, this premium white tee offers a relaxed fit and superior comfort for everyday wear.', 1499.00, 'assets/white_tee_mockup_1765949251317.png', 'Men'),
('Summer Floral Maxi Dress', 'Embrace the season with this vibrant floral maxi dress. Lightweight, breathable, and perfect for garden parties.', 2999.00, 'assets/floral_dress_mockup_1765949276855.png', 'Women'),


('Silk Draped Blouse', 'Luxurious champagne silk blouse with elegant draping detail. Perfect for evening wear or professional settings.', 4999.00, 'assets/silk_blouse_mockup_1765950130475.png', 'Women'),
('Linen Trousers', 'Breathable beige linen trousers designed for effortless style and comfort in warmer climates.', 3499.00, 'assets/linen_trousers_mockup_1765950154626.png', 'Men');
