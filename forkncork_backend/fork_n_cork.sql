-- ============================================================
-- Fork n Cork - Fast Food Restaurant Database
-- Complete SQL Dump with Schema and Seed Data
-- ============================================================

CREATE DATABASE IF NOT EXISTS fork_n_cork;
USE fork_n_cork;

-- ============================================================
-- TABLE: admins
-- ============================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin', 'manager') NOT NULL DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_customers_email` (`email`),
  INDEX `idx_customers_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_categories_slug` (`slug`),
  INDEX `idx_categories_sort_order` (`sort_order`),
  INDEX `idx_categories_is_active` (`is_active`),
  INDEX `idx_categories_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `price` DECIMAL(8,2) NOT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `is_available` TINYINT(1) NOT NULL DEFAULT 1,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_products_slug` (`slug`),
  INDEX `idx_products_category_id` (`category_id`),
  INDEX `idx_products_is_available` (`is_available`),
  INDEX `idx_products_is_featured` (`is_featured`),
  INDEX `idx_products_price` (`price`),
  INDEX `idx_products_deleted_at` (`deleted_at`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: product_images
-- ============================================================
CREATE TABLE IF NOT EXISTS `product_images` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` INT UNSIGNED NOT NULL,
  `image_path` VARCHAR(500) NOT NULL,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_product_images_product_id` (`product_id`),
  INDEX `idx_product_images_is_primary` (`is_primary`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_email` VARCHAR(255) DEFAULT NULL,
  `customer_phone` VARCHAR(30) NOT NULL,
  `customer_address` TEXT DEFAULT NULL,
  `order_type` ENUM('dine-in', 'takeaway', 'delivery') NOT NULL DEFAULT 'dine-in',
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_order_type` (`order_type`),
  INDEX `idx_orders_customer_email` (`customer_email`),
  INDEX `idx_orders_created_at` (`created_at`),
  INDEX `idx_orders_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `product_name` VARCHAR(200) DEFAULT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(8,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `special_instructions` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_order_items_order_id` (`order_id`),
  INDEX `idx_order_items_product_id` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: restaurant_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS `restaurant_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_restaurant_settings_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: opening_hours
-- ============================================================
CREATE TABLE IF NOT EXISTS `opening_hours` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `day_of_week` TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
  `open_time` TIME NOT NULL,
  `close_time` TIME NOT NULL,
  `is_closed` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_opening_hours_day` (`day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: contact_messages
-- ============================================================
CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_contact_messages_is_read` (`is_read`),
  INDEX `idx_contact_messages_created_at` (`created_at`),
  INDEX `idx_contact_messages_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: promotions
-- ============================================================
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
  `discount_value` DECIMAL(8,2) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_promotions_is_active` (`is_active`),
  INDEX `idx_promotions_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS `reviews` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `customer_name` VARCHAR(100) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `is_approved` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_reviews_rating` (`rating`),
  INDEX `idx_reviews_is_approved` (`is_approved`),
  INDEX `idx_reviews_created_at` (`created_at`),
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` >= 1 AND `rating` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- SEED DATA
-- ============================================================

-- ------------------------------------------------------------
-- Admin user
-- ------------------------------------------------------------
INSERT INTO `admins` (`name`, `email`, `password`, `role`) VALUES
('Admin', 'admin@forkncork.com', '$2b$10$JJLNC8iUS7BAb0tkKViNOOdcMYWenMlqQxBQSg1kRdbiR7MR3bAee', 'super_admin');

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image_url`, `is_active`, `sort_order`) VALUES
(1, 'Burgers',    'burgers',    'Juicy, flame-grilled burgers made with fresh ingredients and served on toasted brioche buns.', '/images/categories/burgers.jpg',    1, 1),
(2, 'Pizzas',     'pizzas',     'Hand-tossed pizzas baked to perfection with our signature tomato sauce and premium toppings.',  '/images/categories/pizzas.jpg',     1, 2),
(3, 'Sandwiches', 'sandwiches', 'Freshly prepared sandwiches and wraps packed with flavour for every appetite.',                 '/images/categories/sandwiches.jpg', 1, 3),
(4, 'Drinks',     'drinks',     'Refreshing cold and hot beverages to complement your meal.',                                    '/images/categories/drinks.jpg',     1, 4),
(5, 'Desserts',   'desserts',   'Sweet treats and indulgent desserts to finish your meal on a high note.',                        '/images/categories/desserts.jpg',   1, 5),
(6, 'Sides',      'sides',      'Crispy sides and shareable bites that go perfectly with any main.',                              '/images/categories/sides.jpg',      1, 6);

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------

-- Burgers
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `image_url`, `is_available`, `is_featured`) VALUES
(1,  1, 'Classic Burger',    'classic-burger',    'Our signature beef patty with lettuce, tomato, onion, and our house sauce on a toasted brioche bun.',                  4.50, '/images/menu/classic-burger.jpg',    1, 1),
(2,  1, 'Cheese Burger',     'cheese-burger',     'A juicy beef patty topped with melted cheddar cheese, pickles, lettuce, and ketchup.',                                 5.00, '/images/menu/cheese-burger.jpg',     1, 1),
(3,  1, 'BBQ Bacon Burger',  'bbq-bacon-burger',  'Smoky BBQ sauce, crispy bacon strips, cheddar cheese, and caramelised onions on a flame-grilled patty.',               6.50, '/images/menu/bbq-bacon-burger.jpg',  1, 0),
(4,  1, 'Double Burger',     'double-burger',     'Two flame-grilled beef patties stacked high with double cheese, lettuce, tomato, and our special sauce.',              7.00, '/images/menu/double-burger.jpg',     1, 0),

-- Pizzas
(5,  2, 'Margherita',        'margherita',        'Classic Italian pizza with San Marzano tomato sauce, fresh mozzarella, and basil leaves.',                             6.00, '/images/menu/margherita.jpg',        1, 1),
(6,  2, 'Pepperoni',         'pepperoni',         'Generous layers of spicy pepperoni slices over mozzarella and our signature tomato sauce.',                            7.00, '/images/menu/pepperoni.jpg',         1, 1),
(7,  2, 'BBQ Chicken Pizza', 'bbq-chicken-pizza', 'Grilled chicken, red onion, and green peppers on a smoky BBQ sauce base with mozzarella.',                            7.50, '/images/menu/bbq-chicken-pizza.jpg', 1, 0),
(8,  2, 'Veggie Pizza',      'veggie-pizza',      'A colourful medley of bell peppers, mushrooms, olives, onions, and sweetcorn on a tomato base.',                      6.50, '/images/menu/veggie-pizza.jpg',      1, 0),

-- Sandwiches
(9,  3, 'Club Sandwich',     'club-sandwich',     'Triple-decker sandwich with grilled chicken, bacon, lettuce, tomato, and mayo on toasted bread.',                     4.00, '/images/menu/club-sandwich.jpg',     1, 0),
(10, 3, 'Chicken Wrap',      'chicken-wrap',      'Warm tortilla wrap filled with seasoned grilled chicken, mixed greens, and garlic yoghurt dressing.',                 4.50, '/images/menu/chicken-wrap.jpg',      1, 1),
(11, 3, 'Philly Steak',      'philly-steak',      'Thinly sliced steak with melted provolone, sauteed peppers, and onions in a toasted hoagie roll.',                   5.50, '/images/menu/philly-steak.jpg',      1, 0),
(12, 3, 'BLT',               'blt',               'Crispy bacon, fresh lettuce, and ripe tomato slices with mayo on toasted sourdough.',                                 3.50, '/images/menu/blt.jpg',               1, 0),

-- Drinks
(13, 4, 'Coca Cola',         'coca-cola',         'Ice-cold Coca Cola served in a 330 ml can.',                                                                          1.50, '/images/menu/coca-cola.jpg',         1, 0),
(14, 4, 'Fresh Lemonade',    'fresh-lemonade',    'Freshly squeezed lemonade with a hint of mint, served over ice.',                                                     2.00, '/images/menu/fresh-lemonade.jpg',    1, 0),
(15, 4, 'Milkshake',         'milkshake',         'Thick and creamy milkshake available in chocolate, vanilla, or strawberry.',                                           3.00, '/images/menu/milkshake.jpg',         1, 1),
(16, 4, 'Iced Coffee',       'iced-coffee',       'Chilled espresso blended with milk and ice for a smooth, refreshing pick-me-up.',                                    2.50, '/images/menu/iced-coffee.jpg',       1, 0),

-- Desserts
(17, 5, 'Chocolate Brownie',  'chocolate-brownie',  'Rich, fudgy chocolate brownie served warm with a dusting of powdered sugar.',                                       3.00, '/images/menu/chocolate-brownie.jpg',  1, 0),
(18, 5, 'Ice Cream Sundae',   'ice-cream-sundae',   'Three scoops of ice cream drizzled with chocolate sauce, whipped cream, and a cherry on top.',                      3.50, '/images/menu/ice-cream-sundae.jpg',   1, 1),
(19, 5, 'Apple Pie',          'apple-pie',          'Warm apple pie with a flaky golden crust, lightly spiced with cinnamon and served with cream.',                      2.50, '/images/menu/apple-pie.jpg',          1, 0),
(20, 5, 'Cheesecake',         'cheesecake',         'New York-style creamy cheesecake on a buttery biscuit base with a berry compote drizzle.',                           4.00, '/images/menu/cheesecake.jpg',         1, 0),

-- Sides
(21, 6, 'French Fries',       'french-fries',       'Golden, crispy French fries seasoned with sea salt. The perfect side for any meal.',                                 2.00, '/images/menu/french-fries.jpg',       1, 1),
(22, 6, 'Onion Rings',        'onion-rings',        'Beer-battered onion rings fried until golden and served with a tangy dipping sauce.',                                2.50, '/images/menu/onion-rings.jpg',        1, 0),
(23, 6, 'Chicken Wings',      'chicken-wings',      'Crispy chicken wings tossed in your choice of buffalo, BBQ, or honey garlic sauce.',                                 4.00, '/images/menu/chicken-wings.jpg',      1, 0),
(24, 6, 'Mozzarella Sticks',  'mozzarella-sticks',  'Breaded mozzarella sticks fried to a golden crisp, served with marinara dipping sauce.',                             3.50, '/images/menu/mozzarella-sticks.jpg',  1, 0);

-- ------------------------------------------------------------
-- Restaurant Settings
-- ------------------------------------------------------------
INSERT INTO `restaurant_settings` (`setting_key`, `setting_value`) VALUES
('restaurant_name', 'Fork n Cork'),
('address',         'Yll Morina pn, Gjakovë'),
('city',            'Gjakovë 50000'),
('country',         'Kosovo'),
('phone_1',         '+383 44 168 776'),
('phone_2',         '+383 45 660 127'),
('email',           'info@forkncork.com'),
('google_maps',     '9CFP+J3, Gjakovë 50000'),
('currency',        'EUR'),
('currency_symbol', '€'),
('features',        'Dine-in, Drive-through'),
('about_us',        'Welcome to Fork n Cork, Gjakovë''s favourite fast food destination! Nestled in the heart of the city on Yll Morina street, we have been serving up freshly prepared burgers, pizzas, sandwiches, and more since day one. Our kitchen uses only quality ingredients sourced from trusted local suppliers, and every meal is made to order so you get it hot, fresh, and full of flavour. Whether you are grabbing a quick bite on your lunch break, treating the family to a weekend feast, or cruising through our drive-through on the way home, Fork n Cork is here to deliver great food with a smile. Come hungry, leave happy!');

-- ------------------------------------------------------------
-- Opening Hours (0=Sunday, 1=Monday, ..., 6=Saturday)
-- ------------------------------------------------------------
INSERT INTO `opening_hours` (`day_of_week`, `open_time`, `close_time`, `is_closed`) VALUES
(0, '08:00:00', '00:00:00', 0),
(1, '08:00:00', '00:00:00', 0),
(2, '08:00:00', '00:00:00', 0),
(3, '08:00:00', '00:00:00', 0),
(4, '08:00:00', '00:00:00', 0),
(5, '08:00:00', '00:00:00', 0),
(6, '08:00:00', '00:00:00', 0);
