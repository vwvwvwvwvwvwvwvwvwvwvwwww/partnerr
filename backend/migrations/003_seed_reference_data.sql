INSERT INTO crops (name, category, default_seed_rate_kg_ha, default_fertilizer_rate_kg_ha)
VALUES
    ('Пшеница озимая', 'Зерновые', 220.00, 180.00),
    ('Подсолнечник', 'Масличные', 8.50, 120.00),
    ('Кукуруза', 'Зерновые', 25.00, 150.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO machinery (
    inventory_number,
    type,
    brand,
    model,
    registration_number,
    year_of_manufacture,
    engine_hours,
    status
)
VALUES
    ('TR-001', 'tractor', 'Беларус', '1221.2', 'А123ВС', 2021, 1450.5, 'active'),
    ('CM-001', 'combine', 'Ростсельмаш', 'ACROS 595', 'К456МН', 2020, 2380.0, 'maintenance')
ON CONFLICT (inventory_number) DO NOTHING;
