PRAGMA foreign_keys = ON;

CREATE TABLE partners (
  partner_id INTEGER PRIMARY KEY,
  partner_name TEXT NOT NULL,
  inn TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  product_name TEXT NOT NULL,
  price DECIMAL(12, 2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE sales_history (
  sale_id INTEGER PRIMARY KEY,
  partner_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  sale_date TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  amount DECIMAL(14, 2) NOT NULL CHECK (amount >= 0),
  FOREIGN KEY (partner_id) REFERENCES partners(partner_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id)
);
