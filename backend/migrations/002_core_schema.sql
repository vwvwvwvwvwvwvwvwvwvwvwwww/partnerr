CREATE TABLE IF NOT EXISTS app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'agronomist', 'mechanic', 'storekeeper', 'accountant')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crops (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    default_seed_rate_kg_ha NUMERIC(10,2),
    default_fertilizer_rate_kg_ha NUMERIC(10,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fields (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    cadastral_number VARCHAR(50),
    area_ha NUMERIC(12,2) NOT NULL CHECK (area_ha > 0),
    soil_type VARCHAR(100),
    status VARCHAR(30) NOT NULL CHECK (status IN ('prepared', 'sown', 'growing', 'harvest', 'fallow')),
    current_crop_id BIGINT REFERENCES crops(id) ON DELETE SET NULL,
    geometry GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    created_by BIGINT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fields_geometry_gist
    ON fields
    USING GIST (geometry);

CREATE INDEX IF NOT EXISTS idx_fields_status
    ON fields (status);

CREATE TABLE IF NOT EXISTS field_history (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    crop_id BIGINT REFERENCES crops(id) ON DELETE RESTRICT,
    season_year INTEGER NOT NULL CHECK (season_year BETWEEN 2000 AND 2100),
    yield_t_ha NUMERIC(10,2) CHECK (yield_t_ha >= 0),
    fertilizer_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (field_id, season_year)
);

CREATE TABLE IF NOT EXISTS soil_samples (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    sample_date DATE NOT NULL,
    ph NUMERIC(4,2),
    nitrogen_mg_kg NUMERIC(10,2),
    phosphorus_mg_kg NUMERIC(10,2),
    potassium_mg_kg NUMERIC(10,2),
    organic_matter_percent NUMERIC(5,2),
    geometry GEOMETRY(POINT, 4326),
    laboratory_name VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soil_samples_geometry_gist
    ON soil_samples
    USING GIST (geometry);

CREATE TABLE IF NOT EXISTS machinery (
    id BIGSERIAL PRIMARY KEY,
    inventory_number VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('tractor', 'combine', 'sprayer', 'seeder', 'truck', 'other')),
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(30),
    year_of_manufacture INTEGER CHECK (year_of_manufacture BETWEEN 1950 AND 2100),
    engine_hours NUMERIC(12,1) NOT NULL DEFAULT 0 CHECK (engine_hours >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'repair', 'retired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_machinery_status
    ON machinery (status);

CREATE TABLE IF NOT EXISTS machinery_maintenance (
    id BIGSERIAL PRIMARY KEY,
    machinery_id BIGINT NOT NULL REFERENCES machinery(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    engine_hours_at_service NUMERIC(12,1) CHECK (engine_hours_at_service >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crop_cycles (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    crop_id BIGINT NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    season_year INTEGER NOT NULL CHECK (season_year BETWEEN 2000 AND 2100),
    sowing_date DATE,
    harvest_date DATE,
    seed_rate_kg_ha NUMERIC(10,2) CHECK (seed_rate_kg_ha > 0),
    fertilizer_rate_kg_ha NUMERIC(10,2) CHECK (fertilizer_rate_kg_ha >= 0),
    expected_yield_t_ha NUMERIC(10,2) CHECK (expected_yield_t_ha >= 0),
    actual_yield_t_ha NUMERIC(10,2) CHECK (actual_yield_t_ha >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (field_id, crop_id, season_year)
);
