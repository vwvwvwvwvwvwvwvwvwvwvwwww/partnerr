CREATE TABLE IF NOT EXISTS report_exports (
    id BIGSERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL DEFAULT 'summary' CHECK (report_type IN ('summary')),
    title VARCHAR(200) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generated_by BIGINT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_report_exports_generated_at ON report_exports (generated_at DESC);

-- Демонстрационные записи в журнале (если есть пользователь admin/agronomist)
INSERT INTO report_exports (report_type, title, file_name, generated_at, generated_by, snapshot)
SELECT
    'summary',
    v.title,
    v.file_name,
    v.generated_at::timestamptz,
    u.id,
    v.snapshot::jsonb
FROM (
    VALUES
        (
            'Сводка по хозяйству — январь 2026',
            'partner-svodka-2026-01-31.docx',
            '2026-01-31 16:00:00+00',
            '{"fieldsCount":12,"totalAreaHa":695,"cropsCount":3,"financeBalance":1200000}'
        ),
        (
            'Сводка по хозяйству — март 2026',
            'partner-svodka-2026-03-15.docx',
            '2026-03-15 11:30:00+00',
            '{"fieldsCount":12,"totalAreaHa":695,"cropsCount":3,"financeBalance":2100000}'
        ),
        (
            'Сводка по хозяйству — апрель 2026',
            'partner-svodka-2026-04-20.docx',
            '2026-04-20 09:15:00+00',
            '{"fieldsCount":12,"totalAreaHa":695,"cropsCount":3,"financeBalance":2771500}'
        )
) AS v(title, file_name, generated_at, snapshot)
CROSS JOIN LATERAL (
    SELECT id FROM app_users
    WHERE is_active = TRUE AND role IN ('admin', 'agronomist', 'accountant')
    ORDER BY CASE role WHEN 'admin' THEN 0 WHEN 'accountant' THEN 1 ELSE 2 END
    LIMIT 1
) u
WHERE NOT EXISTS (
    SELECT 1 FROM report_exports re WHERE re.file_name = v.file_name
);
