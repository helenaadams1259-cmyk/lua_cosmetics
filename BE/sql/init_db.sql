CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE,
    description TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brands (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    brand_id INT NULL,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(191) NOT NULL UNIQUE,
    short_description TEXT,
    description MEDIUMTEXT,
    ingredients TEXT,
    `usage` TEXT,
    origin VARCHAR(255),
    skin_type VARCHAR(255),
    volume VARCHAR(255),
    price INT NOT NULL,
    original_price INT NULL,
    stock INT DEFAULT 0,
    rating DOUBLE DEFAULT 5,
    review_count INT DEFAULT 0,
    discount_percent INT DEFAULT 0,
    images TEXT,
    is_featured TINYINT DEFAULT 0,
    is_best_seller TINYINT DEFAULT 0,
    is_new TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_products_category (category_id),
    KEY idx_products_brand (brand_id),
    KEY idx_products_created_at (created_at),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_features (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    feature TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_product_features_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    ingredient TEXT NOT NULL,
    CONSTRAINT fk_product_ingredients_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_usages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    instruction TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_product_usages_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_specifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    spec_key VARCHAR(255) NOT NULL,
    spec_value TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    CONSTRAINT fk_product_specifications_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_name VARCHAR(255),
    rating INT,
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(191) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin TINYINT DEFAULT 0,
    email VARCHAR(191) NULL UNIQUE,
    phone VARCHAR(20) NULL,
    province VARCHAR(255) NULL,
    district VARCHAR(255) NULL,
    ward VARCHAR(255) NULL,
    street_address VARCHAR(500) NULL,
    password_reset_token_hash VARCHAR(64) NULL,
    password_reset_expires_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_users_phone (phone),
    KEY idx_users_reset_token (password_reset_token_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    customer_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(191) NULL,
    province VARCHAR(255) NOT NULL,
    district VARCHAR(255) NOT NULL,
    ward VARCHAR(255) NOT NULL,
    street_address VARCHAR(500) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'cod',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'cod',
    subtotal INT NOT NULL,
    shipping_fee INT NOT NULL DEFAULT 30000,
    membership_tier VARCHAR(30) NULL,
    discount_percent INT NOT NULL DEFAULT 0,
    discount_amount INT NOT NULL DEFAULT 0,
    total_amount INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    vnpay_txn_ref VARCHAR(100) NULL UNIQUE,
    vnpay_transaction_no VARCHAR(50) NULL,
    vnpay_bank_code VARCHAR(50) NULL,
    vnpay_response_code VARCHAR(10) NULL,
    vnpay_pay_date VARCHAR(20) NULL,
    paid_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_orders_status (status),
    KEY idx_orders_created_at (created_at),
    KEY idx_orders_user (user_id),
    KEY idx_orders_payment_status (payment_status),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    product_image TEXT NOT NULL,
    product_price INT NOT NULL,
    quantity INT NOT NULL,
    subtotal INT NOT NULL,
    KEY idx_order_items_order_id (order_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    txn_ref VARCHAR(100) NOT NULL UNIQUE,
    amount INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    response_code VARCHAR(10) NULL,
    transaction_no VARCHAR(50) NULL,
    bank_code VARCHAR(50) NULL,
    pay_date VARCHAR(20) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    KEY idx_payment_transactions_order (order_id),
    CONSTRAINT fk_payment_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (name, username, password, is_admin) VALUES
('Admin', 'admin', '$2b$12$u8zupzLqTmwp3G9y7I.DMOFVg6kXSH1pdwCL6Usr7ltUzF640Ksxi', 1);

INSERT IGNORE INTO categories (name, slug, description, image) VALUES
('Kem chống nắng', 'kem-chong-nang', 'Các sản phẩm kem chống nắng', NULL),
('Sữa rửa mặt', 'sua-rua-mat', 'Các sản phẩm sữa rửa mặt', NULL),
('Serum', 'serum', 'Các loại serum chăm sóc da', NULL),
('Kem dưỡng', 'kem-duong', 'Các sản phẩm kem dưỡng da', NULL),
('Son môi', 'son-moi', 'Các loại son môi', NULL),
('Cushion', 'cushion', 'Các sản phẩm cushion', NULL),
('Phấn phủ', 'phan-phu', 'Các loại phấn phủ', NULL),
('Nước tẩy trang', 'nuoc-tay-trang', 'Các sản phẩm nước tẩy trang', NULL),
('Toner', 'toner', 'Các loại toner', NULL),
('Mặt nạ', 'mat-na', 'Các sản phẩm mặt nạ', NULL)
