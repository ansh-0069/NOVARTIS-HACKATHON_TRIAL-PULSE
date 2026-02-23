const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'mass_balance.db');
const migrationPath = path.join(__dirname, 'migrations', 'add_bayesian_tables.sql');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

const migrationSql = fs.readFileSync(migrationPath, 'utf8');

db.exec(migrationSql, (err) => {
    if (err) {
        console.error('Error executing migration:', err.message);
        process.exit(1);
    }
    console.log('Migration applied successfully.');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
    });
});
