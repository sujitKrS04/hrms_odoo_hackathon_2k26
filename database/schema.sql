-- ============================================================
-- HRMS Database Schema — Corrected Version (14 tables, 5 enums)
-- PostgreSQL 15+
--
-- NOTE: This file is for reference & local setup only.
-- Prisma (backend/prisma/schema.prisma) is the single source
-- of truth. Use Prisma migrations to create/alter the DB:
--   cd backend
--   npx prisma migrate dev --name init
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM (
    'admin',
    'hr',
    'employee'
);

CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'half_day',
    'work_from_home',
    'on_leave'
);

CREATE TYPE leave_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);

CREATE TYPE compensation_type AS ENUM (
    'earning',
    'deduction'
);

CREATE TYPE salary_component_name AS ENUM (
    'basic',
    'hra',
    'conveyance_allowance',
    'medical_allowance',
    'special_allowance',
    'provident_fund',
    'professional_tax',
    'income_tax'
);

-- ─── Table 1: companies ──────────────────────────────────────
CREATE TABLE companies (
    id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(200) NOT NULL UNIQUE,
    code       VARCHAR(20)  NOT NULL UNIQUE,
    address    TEXT,
    phone      VARCHAR(20),
    email      VARCHAR(255),
    website    VARCHAR(255),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Table 2: departments ────────────────────────────────────
CREATE TABLE departments (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id  UUID         NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(20)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (company_id, code)
);

-- ─── Table 3: job_positions ──────────────────────────────────
CREATE TABLE job_positions (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID         NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    title         VARCHAR(100) NOT NULL,
    level         SMALLINT     NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
    description   TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Table 4: users ──────────────────────────────────────────
-- login_id format: <company_code> + first2(first_name) + last2(last_name)
--                  + join_year + 3-digit serial   e.g. ACarma2024001
CREATE TABLE users (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id      UUID        NOT NULL REFERENCES companies(id)     ON DELETE CASCADE,
    login_id        VARCHAR(50) NOT NULL UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT        NOT NULL,
    role            user_role   NOT NULL DEFAULT 'employee',
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    department_id   UUID        REFERENCES departments(id)   ON DELETE SET NULL,
    job_position_id UUID        REFERENCES job_positions(id) ON DELETE SET NULL,
    manager_id      UUID        REFERENCES users(id)         ON DELETE SET NULL,
    hire_date       DATE        NOT NULL,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table 5: employee_profiles ──────────────────────────────
CREATE TABLE employee_profiles (
    id                      UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth           DATE,
    gender                  VARCHAR(20),
    address                 TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    pincode                 VARCHAR(10),
    nationality             VARCHAR(100) DEFAULT 'Indian',
    marital_status          VARCHAR(20),
    avatar_url              TEXT,
    emergency_contact_name  VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Table 6: bank_details ───────────────────────────────────
CREATE TABLE bank_details (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(30)  NOT NULL,
    bank_name      VARCHAR(100) NOT NULL,
    ifsc_code      VARCHAR(20)  NOT NULL,
    account_type   VARCHAR(20)  NOT NULL DEFAULT 'savings',
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Table 7: skills ─────────────────────────────────────────
CREATE TABLE skills (
    id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    proficiency VARCHAR(20)  DEFAULT 'intermediate',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Table 8: certifications ─────────────────────────────────
CREATE TABLE certifications (
    id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(200) NOT NULL,
    issuing_org   VARCHAR(200) NOT NULL,
    issue_date    DATE         NOT NULL,
    expiry_date   DATE,
    credential_id VARCHAR(100),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Table 9: attendance ─────────────────────────────────────
-- check_in / check_out store full timestamps (date + time + tz)
-- The date column is purely the calendar date for lookup/uniqueness
CREATE TABLE attendance (
    id         UUID              PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       DATE              NOT NULL,
    check_in   TIMESTAMPTZ,
    check_out  TIMESTAMPTZ,
    status     attendance_status NOT NULL DEFAULT 'present',
    note       TEXT,
    created_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date)
);

-- ─── Table 10: leave_types ───────────────────────────────────
CREATE TABLE leave_types (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(100) NOT NULL UNIQUE,
    description       TEXT,
    is_paid           BOOLEAN     NOT NULL DEFAULT TRUE,
    max_days_per_year INTEGER     NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table 11: leave_allocations ────────────────────────────
CREATE TABLE leave_allocations (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID        NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    leave_type_id UUID        NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    year          INTEGER     NOT NULL,
    total_days    INTEGER     NOT NULL,
    used_days     INTEGER     NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, leave_type_id, year)
);

-- ─── Table 12: leave_requests ────────────────────────────────
CREATE TABLE leave_requests (
    id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID         NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
    leave_type_id  UUID         NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date     DATE         NOT NULL,
    end_date       DATE         NOT NULL,
    days_count     INTEGER      NOT NULL CHECK (days_count > 0),
    reason         TEXT,
    status         leave_status NOT NULL DEFAULT 'pending',
    reviewed_by_id UUID         REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at    TIMESTAMPTZ,
    reviewer_note  TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

-- ─── Table 13: salary_structures ────────────────────────────
-- One active structure per employee (unique on user_id)
CREATE TABLE salary_structures (
    id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID           NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    effective_from DATE           NOT NULL,
    ctc            NUMERIC(12, 2) NOT NULL,
    is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ─── Table 14: salary_components ────────────────────────────
-- Line items (Basic, HRA, PF deduction, etc.) per salary structure
CREATE TABLE salary_components (
    id                  UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    salary_structure_id UUID                  NOT NULL REFERENCES salary_structures(id) ON DELETE CASCADE,
    name                salary_component_name NOT NULL,
    type                compensation_type     NOT NULL,
    amount              NUMERIC(12, 2)        NOT NULL,
    created_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_departments_company       ON departments(company_id);
CREATE INDEX idx_job_positions_department  ON job_positions(department_id);
CREATE INDEX idx_users_company             ON users(company_id);
CREATE INDEX idx_users_department          ON users(department_id);
CREATE INDEX idx_users_manager             ON users(manager_id);
CREATE INDEX idx_users_role                ON users(role);
CREATE INDEX idx_users_is_active           ON users(is_active);
CREATE INDEX idx_attendance_user           ON attendance(user_id);
CREATE INDEX idx_attendance_date           ON attendance(date);
CREATE INDEX idx_leave_alloc_user          ON leave_allocations(user_id);
CREATE INDEX idx_leave_req_user            ON leave_requests(user_id);
CREATE INDEX idx_leave_req_status          ON leave_requests(status);
CREATE INDEX idx_salary_comp_structure     ON salary_components(salary_structure_id);

-- ─── Updated-at trigger ──────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_companies_updated_at          BEFORE UPDATE ON companies         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_departments_updated_at        BEFORE UPDATE ON departments       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_job_positions_updated_at      BEFORE UPDATE ON job_positions     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at              BEFORE UPDATE ON users             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_employee_profiles_updated_at  BEFORE UPDATE ON employee_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_bank_details_updated_at       BEFORE UPDATE ON bank_details      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_updated_at         BEFORE UPDATE ON attendance        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leave_types_updated_at        BEFORE UPDATE ON leave_types       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leave_allocations_updated_at  BEFORE UPDATE ON leave_allocations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_leave_requests_updated_at     BEFORE UPDATE ON leave_requests    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_salary_structures_updated_at  BEFORE UPDATE ON salary_structures FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_salary_components_updated_at  BEFORE UPDATE ON salary_components FOR EACH ROW EXECUTE FUNCTION set_updated_at();
