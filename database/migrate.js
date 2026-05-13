const pool = require('../backend/db'); // adjust path if your db.js is elsewhere

async function migrate() {
  console.log('Running migrations...');

  // Migration 001 — add image_path to links
  // Safe to leave here permanently; will error if column already exists,
  // so wrap in a try/catch per migration step
  try {
    await pool.query(`
      ALTER TABLE links ADD COLUMN image_path VARCHAR(500) NULL
    `);
    console.log('  ✓ Added image_path to links');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('  – image_path already exists, skipping');
    } else {
      throw err;
    }
  }

  // Future migrations go here as new try/catch blocks
  // e.g. Migration 002 — add description column to users

  console.log('Migrations complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});