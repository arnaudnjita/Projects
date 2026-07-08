SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO categories (name, description)
VALUES
  ('Vegetables', 'Fresh vegetables grown in and around Buea.'),
  ('Fruits', 'Seasonal fruits from local farmers.'),
  ('Tubers', 'Cassava, yams, cocoyams, potatoes, and related produce.'),
  ('Grains', 'Maize, rice, and other grain products.'),
  ('Spices', 'Fresh and dried spices for cooking and processing.'),
  ('Legumes', 'Beans, groundnuts, soybeans, and related crops.'),
  ('Livestock Products', 'Eggs, milk, poultry, and other livestock products.'),
  ('Other', 'Other agricultural produce suitable for the marketplace.')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  updated_at = CURRENT_TIMESTAMP;
