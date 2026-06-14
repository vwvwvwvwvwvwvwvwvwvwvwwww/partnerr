-- SQLite-схема (без PostGIS): геометрия полей хранится как GeoJSON TEXT

CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'agronomist', 'mechanic', 'storekeeper', 'accountant', 'driver')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    position TEXT,
    phone TEXT,
    hired_at TEXT,
    photo_url TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS crops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    default_seed_rate_kg_ha REAL,
    default_fertilizer_rate_kg_ha REAL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cadastral_number TEXT,
    area_ha REAL NOT NULL CHECK (area_ha > 0),
    soil_type TEXT,
    status TEXT NOT NULL CHECK (status IN ('prepared', 'sown', 'growing', 'harvest', 'fallow')),
    current_crop_id INTEGER REFERENCES crops(id) ON DELETE SET NULL,
    geometry TEXT NOT NULL,
    created_by INTEGER NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fields_status ON fields (status);

CREATE TABLE IF NOT EXISTS machinery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inventory_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('tractor', 'combine', 'sprayer', 'seeder', 'truck', 'other')),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    registration_number TEXT,
    year_of_manufacture INTEGER,
    engine_hours REAL NOT NULL DEFAULT 0 CHECK (engine_hours >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'repair', 'retired')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS technology_cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE RESTRICT,
    season_year INTEGER NOT NULL CHECK (season_year BETWEEN 2000 AND 2100),
    area_ha REAL NOT NULL CHECK (area_ha > 0),
    planned_start_date TEXT NOT NULL,
    planned_end_date TEXT NOT NULL,
    seeds_required_kg REAL NOT NULL DEFAULT 0 CHECK (seeds_required_kg >= 0),
    fertilizer_required_kg REAL NOT NULL DEFAULT 0 CHECK (fertilizer_required_kg >= 0),
    notes TEXT,
    created_by INTEGER NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    work_name TEXT,
    unit TEXT,
    work_volume REAL,
    conversion_coefficient REAL,
    equivalent_area_ha REAL,
    aggregate_composition TEXT,
    aggregates_count INTEGER,
    mechanizators_count INTEGER,
    workers_count INTEGER,
    output_norm REAL,
    norm_shifts_count REAL,
    labor_costs REAL,
    tariff_rate REAL,
    tariff_fund REAL,
    extra_pay REAL,
    fuel_rate REAL,
    fuel_total_liters REAL
);

CREATE TABLE IF NOT EXISTS warehouse_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    warehouse_name TEXT NOT NULL,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('seeds', 'fertilizers', 'szr', 'parts', 'fuel', 'other')),
    unit TEXT NOT NULL,
    batch_number TEXT,
    quantity REAL NOT NULL CHECK (quantity >= 0),
    expiry_date TEXT,
    supplier_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS harvest_waybills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE RESTRICT,
    crop_id INTEGER REFERENCES crops(id) ON DELETE RESTRICT,
    document_number TEXT,
    shift_number TEXT,
    action_type TEXT,
    seed_type TEXT,
    driver_name TEXT NOT NULL,
    driver_email TEXT,
    mechanizator_name TEXT,
    vehicle_number TEXT NOT NULL,
    trailer_number TEXT,
    tractor_model TEXT,
    equipment_name TEXT,
    trip_date TEXT NOT NULL,
    departure_time TEXT,
    return_time TEXT,
    work_volume_ha REAL,
    route_distance_km REAL,
    start_odometer_km REAL,
    end_odometer_km REAL,
    start_engine_hours REAL,
    end_engine_hours REAL,
    gross_weight_kg REAL,
    tare_weight_kg REAL,
    fuel_issued_liters REAL,
    fuel_start_liters REAL,
    fuel_end_liters REAL,
    fuel_actual_liters REAL,
    destination TEXT,
    receiver_name TEXT,
    weather_conditions TEXT,
    route_description TEXT,
    responsible_person TEXT,
    notes TEXT,
    ticket_photo_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS finance_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    operation_date TEXT NOT NULL,
    reference_module TEXT NOT NULL CHECK (reference_module IN ('fields', 'planning', 'machinery', 'warehouse', 'harvest', 'finance', 'hr', 'other')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS report_exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    generated_by INTEGER NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    snapshot TEXT NOT NULL DEFAULT '{}'
);
