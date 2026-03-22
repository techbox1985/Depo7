ALTER TABLE promotions
ADD COLUMN IF NOT EXISTS vigencia_type TEXT DEFAULT 'date', -- 'date' | 'stock'
ADD COLUMN IF NOT EXISTS applies_to_price_list TEXT DEFAULT 'all'; -- 'all' | 'lista_1' | 'lista_2' | 'lista_3'
