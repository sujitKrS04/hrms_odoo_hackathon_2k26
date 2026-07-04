-- ============================================================
-- HRMS Seed Data
-- Run schema.sql BEFORE this file
-- Password for all seed employees: "Password@123"
-- (hash generated with: SELECT crypt('Password@123', gen_salt('bf')))
-- ============================================================

-- -------------------------------------------------------
-- Departments
-- -------------------------------------------------------
INSERT INTO departments (id, name, code, description) VALUES
    ('11111111-0000-0000-0000-000000000001', 'Engineering',        'ENG',  'Product development and platform engineering'),
    ('11111111-0000-0000-0000-000000000002', 'Human Resources',    'HR',   'Talent acquisition, onboarding, and people ops'),
    ('11111111-0000-0000-0000-000000000003', 'Finance',            'FIN',  'Accounting, payroll, and financial planning'),
    ('11111111-0000-0000-0000-000000000004', 'Sales',              'SAL',  'Business development and account management'),
    ('11111111-0000-0000-0000-000000000005', 'Product Management', 'PM',   'Roadmap, prioritisation, and stakeholder comms')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- Roles
-- -------------------------------------------------------
INSERT INTO roles (id, title, department_id, level, description) VALUES
    -- Engineering
    ('22222222-0000-0000-0000-000000000001', 'CTO',                    '11111111-0000-0000-0000-000000000001', 10, 'Chief Technology Officer'),
    ('22222222-0000-0000-0000-000000000002', 'Engineering Manager',    '11111111-0000-0000-0000-000000000001',  8, 'Manages engineering squads'),
    ('22222222-0000-0000-0000-000000000003', 'Senior Software Engineer','11111111-0000-0000-0000-000000000001', 6, 'IC level 6'),
    ('22222222-0000-0000-0000-000000000004', 'Software Engineer',      '11111111-0000-0000-0000-000000000001', 4, 'IC level 4'),
    ('22222222-0000-0000-0000-000000000005', 'Junior Engineer',        '11111111-0000-0000-0000-000000000001', 2, 'IC level 2'),
    -- HR
    ('22222222-0000-0000-0000-000000000006', 'HR Director',            '11111111-0000-0000-0000-000000000002', 9, 'Leads People function'),
    ('22222222-0000-0000-0000-000000000007', 'HR Business Partner',    '11111111-0000-0000-0000-000000000002', 5, 'Strategic HR partnering'),
    -- Finance
    ('22222222-0000-0000-0000-000000000008', 'CFO',                    '11111111-0000-0000-0000-000000000003', 10, 'Chief Financial Officer'),
    ('22222222-0000-0000-0000-000000000009', 'Finance Analyst',        '11111111-0000-0000-0000-000000000003',  4, 'Reporting and forecasting'),
    -- Sales
    ('22222222-0000-0000-0000-000000000010', 'Head of Sales',          '11111111-0000-0000-0000-000000000004',  9, 'Leads global sales'),
    ('22222222-0000-0000-0000-000000000011', 'Account Executive',      '11111111-0000-0000-0000-000000000004',  4, 'Closes enterprise deals'),
    -- Product
    ('22222222-0000-0000-0000-000000000012', 'VP Product',             '11111111-0000-0000-0000-000000000005',  9, 'Owns product vision'),
    ('22222222-0000-0000-0000-000000000013', 'Product Manager',        '11111111-0000-0000-0000-000000000005',  5, 'Feature squads PM')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- Employees
-- Password hash for "Password@123"
-- -------------------------------------------------------
INSERT INTO employees (
    id, employee_code, first_name, last_name, email, phone,
    date_of_birth, gender, department_id, role_id, manager_id,
    hire_date, status, password_hash, is_admin
) VALUES
    -- Admin / CTO (no manager)
    (
        'eeeeeeee-0000-0000-0000-000000000001',
        'EMP-001', 'Arjun', 'Sharma',
        'arjun.sharma@hrms.internal', '+91-9800000001',
        '1985-03-12', 'male',
        '11111111-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000001',
        NULL,
        '2020-01-15', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        TRUE
    ),
    -- HR Director
    (
        'eeeeeeee-0000-0000-0000-000000000002',
        'EMP-002', 'Priya', 'Nair',
        'priya.nair@hrms.internal', '+91-9800000002',
        '1988-07-22', 'female',
        '11111111-0000-0000-0000-000000000002',
        '22222222-0000-0000-0000-000000000006',
        NULL,
        '2020-03-01', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    -- Engineering Manager (reports to CTO)
    (
        'eeeeeeee-0000-0000-0000-000000000003',
        'EMP-003', 'Rahul', 'Mehta',
        'rahul.mehta@hrms.internal', '+91-9800000003',
        '1990-11-05', 'male',
        '11111111-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000002',
        'eeeeeeee-0000-0000-0000-000000000001',
        '2021-06-01', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    -- Senior Engineers
    (
        'eeeeeeee-0000-0000-0000-000000000004',
        'EMP-004', 'Sneha', 'Patel',
        'sneha.patel@hrms.internal', '+91-9800000004',
        '1993-02-14', 'female',
        '11111111-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000003',
        'eeeeeeee-0000-0000-0000-000000000003',
        '2022-01-10', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    (
        'eeeeeeee-0000-0000-0000-000000000005',
        'EMP-005', 'Vikram', 'Singh',
        'vikram.singh@hrms.internal', '+91-9800000005',
        '1992-09-30', 'male',
        '11111111-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000003',
        'eeeeeeee-0000-0000-0000-000000000003',
        '2022-04-01', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    -- Junior Engineer (on probation)
    (
        'eeeeeeee-0000-0000-0000-000000000006',
        'EMP-006', 'Anjali', 'Reddy',
        'anjali.reddy@hrms.internal', '+91-9800000006',
        '1999-05-20', 'female',
        '11111111-0000-0000-0000-000000000001',
        '22222222-0000-0000-0000-000000000005',
        'eeeeeeee-0000-0000-0000-000000000003',
        '2025-11-01', 'probation',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    -- HR Business Partner
    (
        'eeeeeeee-0000-0000-0000-000000000007',
        'EMP-007', 'Kiran', 'Das',
        'kiran.das@hrms.internal', '+91-9800000007',
        '1991-12-01', 'male',
        '11111111-0000-0000-0000-000000000002',
        '22222222-0000-0000-0000-000000000007',
        'eeeeeeee-0000-0000-0000-000000000002',
        '2021-09-15', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    -- Finance Analyst
    (
        'eeeeeeee-0000-0000-0000-000000000008',
        'EMP-008', 'Meera', 'Joshi',
        'meera.joshi@hrms.internal', '+91-9800000008',
        '1994-08-17', 'female',
        '11111111-0000-0000-0000-000000000003',
        '22222222-0000-0000-0000-000000000009',
        NULL,
        '2023-02-01', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    -- Account Executive
    (
        'eeeeeeee-0000-0000-0000-000000000009',
        'EMP-009', 'Rohan', 'Gupta',
        'rohan.gupta@hrms.internal', '+91-9800000009',
        '1995-04-28', 'male',
        '11111111-0000-0000-0000-000000000004',
        '22222222-0000-0000-0000-000000000011',
        NULL,
        '2023-07-10', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    ),
    -- Product Manager
    (
        'eeeeeeee-0000-0000-0000-000000000010',
        'EMP-010', 'Divya', 'Kumar',
        'divya.kumar@hrms.internal', '+91-9800000010',
        '1990-06-11', 'female',
        '11111111-0000-0000-0000-000000000005',
        '22222222-0000-0000-0000-000000000013',
        NULL,
        '2022-10-01', 'active',
        '$2a$12$KIXwVhu3PJc/dYkYwY5GZueTlYaBbbxFSFpPJxSGFgAH09YtpMXLG',
        FALSE
    )
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- Attendance  (last 7 days for active employees)
-- -------------------------------------------------------
INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', CURRENT_DATE - 1, '09:01', '18:05', 'present'),
    ('eeeeeeee-0000-0000-0000-000000000002', CURRENT_DATE - 1, '09:15', '17:55', 'present'),
    ('eeeeeeee-0000-0000-0000-000000000003', CURRENT_DATE - 1, '09:30', '18:30', 'present'),
    ('eeeeeeee-0000-0000-0000-000000000004', CURRENT_DATE - 1, '09:00', '18:00', 'work_from_home'),
    ('eeeeeeee-0000-0000-0000-000000000005', CURRENT_DATE - 1, NULL,    NULL,    'absent'),
    ('eeeeeeee-0000-0000-0000-000000000001', CURRENT_DATE - 2, '09:05', '18:10', 'present'),
    ('eeeeeeee-0000-0000-0000-000000000002', CURRENT_DATE - 2, '09:00', '13:00', 'half_day'),
    ('eeeeeeee-0000-0000-0000-000000000003', CURRENT_DATE - 2, '09:20', '18:00', 'present')
ON CONFLICT (employee_id, date) DO NOTHING;

-- -------------------------------------------------------
-- Leave Requests
-- -------------------------------------------------------
INSERT INTO leave_requests (
    employee_id, leave_type, start_date, end_date, days_count, reason, status, reviewed_by
) VALUES
    (
        'eeeeeeee-0000-0000-0000-000000000005',
        'annual',
        CURRENT_DATE + 7,
        CURRENT_DATE + 11,
        5,
        'Family vacation',
        'pending',
        NULL
    ),
    (
        'eeeeeeee-0000-0000-0000-000000000004',
        'sick',
        CURRENT_DATE - 3,
        CURRENT_DATE - 2,
        2,
        'Fever and rest',
        'approved',
        'eeeeeeee-0000-0000-0000-000000000003'
    ),
    (
        'eeeeeeee-0000-0000-0000-000000000007',
        'annual',
        CURRENT_DATE + 14,
        CURRENT_DATE + 18,
        5,
        'Personal travel',
        'pending',
        NULL
    )
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------
-- Payroll  (last 3 months for a few employees)
-- -------------------------------------------------------
INSERT INTO payroll (
    employee_id, period_month, period_year,
    basic_salary, allowances, deductions, status, paid_at
) VALUES
    -- Arjun Sharma (CTO) — last 3 months
    ('eeeeeeee-0000-0000-0000-000000000001', 3, 2026, 250000, 50000, 30000, 'paid', NOW() - INTERVAL '3 months'),
    ('eeeeeeee-0000-0000-0000-000000000001', 4, 2026, 250000, 50000, 30000, 'paid', NOW() - INTERVAL '2 months'),
    ('eeeeeeee-0000-0000-0000-000000000001', 5, 2026, 250000, 50000, 30000, 'paid', NOW() - INTERVAL '1 month'),
    -- Rahul Mehta (Eng Manager)
    ('eeeeeeee-0000-0000-0000-000000000003', 3, 2026, 150000, 30000, 20000, 'paid', NOW() - INTERVAL '3 months'),
    ('eeeeeeee-0000-0000-0000-000000000003', 4, 2026, 150000, 30000, 20000, 'paid', NOW() - INTERVAL '2 months'),
    ('eeeeeeee-0000-0000-0000-000000000003', 5, 2026, 150000, 30000, 20000, 'paid', NOW() - INTERVAL '1 month'),
    -- Sneha Patel (Senior SWE) — current month draft
    ('eeeeeeee-0000-0000-0000-000000000004', 3, 2026, 120000, 25000, 18000, 'paid',  NOW() - INTERVAL '3 months'),
    ('eeeeeeee-0000-0000-0000-000000000004', 4, 2026, 120000, 25000, 18000, 'paid',  NOW() - INTERVAL '2 months'),
    ('eeeeeeee-0000-0000-0000-000000000004', 5, 2026, 120000, 25000, 18000, 'draft', NULL)
ON CONFLICT (employee_id, period_month, period_year) DO NOTHING;
