-- Демонстрационные финансовые операции
INSERT INTO finance_entries (entry_type, category, amount, operation_date, reference_module, notes)
SELECT v.entry_type, v.category, v.amount, v.operation_date::date, v.reference_module, v.notes
FROM (
    VALUES
        ('income', 'Реализация пшеницы озимой', 4520000, '2026-02-15', 'harvest', 'Отгрузка на элеватор'),
        ('income', 'Реализация подсолнечника', 2840000, '2026-03-20', 'harvest', 'Маслозавод'),
        ('income', 'Субсидия АПК (региональная)', 1150000, '2026-04-01', 'other', 'Поддержка СХП'),
        ('income', 'Реализация кукурузы на зерно', 980000, '2026-04-28', 'harvest', 'Поле № 4'),
        ('expense', 'ГСМ (дизель для тракторов)', 890000, '2026-03-05', 'machinery', 'Март'),
        ('expense', 'Семена и посадматериалы', 1450000, '2026-02-10', 'warehouse', 'Склад №1'),
        ('expense', 'Минеральные удобрения (NPK)', 980000, '2026-02-18', 'warehouse', 'Подкормка озимых'),
        ('expense', 'Заработная плата механизаторов', 2100000, '2026-03-31', 'hr', 'Ведомость за март'),
        ('expense', 'Ремонт зерноуборочного комбайна', 340000, '2026-01-22', 'machinery', 'ACROS 595'),
        ('expense', 'Аренда сельхозтехники', 180000, '2026-02-01', 'machinery', 'Весенняя кампания'),
        ('expense', 'Страхование посевов', 125000, '2026-01-15', 'fields', '695 га'),
        ('expense', 'Агрономическое сопровождение', 45000, '2026-01-30', 'planning', 'Техкарты'),
        ('expense', 'Услуги элеватора (приёмка и сушка)', 220000, '2026-02-20', 'harvest', 'Подработка зерна'),
        ('expense', 'Средства защиты растений (СЗР)', 310000, '2026-05-10', 'warehouse', 'Гербициды'),
        ('expense', 'Коммунальные и административные', 78500, '2026-03-15', 'finance', 'Офис, связь')
) AS v(entry_type, category, amount, operation_date, reference_module, notes)
WHERE NOT EXISTS (
    SELECT 1 FROM finance_entries fe
    WHERE fe.category = v.category
      AND fe.operation_date = v.operation_date::date
      AND fe.amount = v.amount
      AND fe.entry_type = v.entry_type
);
