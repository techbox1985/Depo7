-- 1) Alter promotions table
ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS stock_limited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS promo_stock_limit INTEGER,
ADD COLUMN IF NOT EXISTS promo_stock_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS target_type TEXT; -- 'global', 'rubro', 'producto', 'stock_limit'

-- 2) Create promotion_products table
CREATE TABLE IF NOT EXISTS promotion_products (
    promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (promotion_id, product_id)
);
