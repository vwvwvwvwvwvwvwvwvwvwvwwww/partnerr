ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS position VARCHAR(100),
    ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS hired_at DATE;

CREATE TABLE IF NOT EXISTS technology_cards (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    season_year INTEGER NOT NULL CHECK (season_year BETWEEN 2000 AND 2100),
    area_ha NUMERIC(12,2) NOT NULL CHECK (area_ha > 0),
    planned_start_date DATE NOT NULL,
    planned_end_date DATE NOT NULL,
    seeds_required_kg NUMERIC(12,2) NOT NULL CHECK (seeds_required_kg >= 0),
    fertilizer_required_kg NUMERIC(12,2) NOT NULL CHECK (fertilizer_required_kg >= 0),
    notes TEXT,
    created_by BIGINT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warehouse_items (
    id BIGSERIAL PRIMARY KEY,
    warehouse_name VARCHAR(120) NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('seeds', 'fertilizers', 'szr', 'parts', 'fuel', 'other')),
    unit VARCHAR(20) NOT NULL,
    batch_number VARCHAR(50),
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity >= 0),
    expiry_date DATE,
    supplier_name VARCHAR(150),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS harvest_waybills (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    driver_name VARCHAR(150) NOT NULL,
    vehicle_number VARCHAR(30) NOT NULL,
    trip_date DATE NOT NULL,
    gross_weight_kg NUMERIC(12,2) NOT NULL CHECK (gross_weight_kg >= 0),
    tare_weight_kg NUMERIC(12,2) NOT NULL CHECK (tare_weight_kg >= 0),
    destination VARCHAR(150) NOT NULL,
    ticket_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_type VARCHAR(20) NOT NULL CHECK (entry_type IN ('income', 'expense')),
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    operation_date DATE NOT NULL,
    reference_module VARCHAR(50) NOT NULL CHECK (reference_module IN ('fields', 'planning', 'machinery', 'warehouse', 'harvest', 'finance', 'hr', 'other')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
