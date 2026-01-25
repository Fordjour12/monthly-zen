# Migration Guide: Yearly Resolutions Feature

This document describes the database migrations required for the Yearly Resolutions feature.

## New Tables

### 1. `yearly_resolutions`

Stores user yearly resolutions with progress tracking.

```sql
CREATE TABLE yearly_resolutions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category resolution_category NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 12,
  progress INTEGER NOT NULL DEFAULT 0,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_yearly_resolutions_user_year ON yearly_resolutions(user_id, year);
CREATE INDEX idx_yearly_resolutions_category ON yearly_resolutions(category);
```

### 2. `yearly_resolution_logs`

Tracks individual completions of resolutions.

```sql
CREATE TABLE yearly_resolution_logs (
  id SERIAL PRIMARY KEY,
  resolution_id INTEGER NOT NULL REFERENCES yearly_resolutions(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_resolution_logs_resolution ON yearly_resolution_logs(resolution_id);
CREATE INDEX idx_resolution_logs_completed ON yearly_resolution_logs(completed_at);
```

### 3. `plan_tasks` (Updated)

Added `resolution_ids` column to link tasks to resolutions.

```sql
ALTER TABLE plan_tasks ADD COLUMN resolution_ids INTEGER[] DEFAULT '{}';
```

## Migration Commands

Run these commands from the root directory:

```bash
# Start the database (if not running)
bun run db:start

# Generate migration files
bun run db:generate

# Run migrations
bun run db:migrate
```

## Rollback (if needed)

If you need to rollback, you can:

1. **Using Drizzle rollback** (if using drizzle-kit's rollback feature):

   ```bash
   bun run db:migrate --down
   ```

2. **Manual SQL rollback**:
   ```sql
   DROP TABLE IF EXISTS yearly_resolution_logs;
   DROP TABLE IF EXISTS yearly_resolutions;
   ALTER TABLE plan_tasks DROP COLUMN IF EXISTS resolution_ids;
   ```

## Verification

After running migrations, verify the tables were created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check columns
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'yearly_resolutions';
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'plan_tasks';
```
