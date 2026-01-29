import sqlite3
import os

db_path = 'mass_balance.db'

if not os.path.exists(db_path):
    print(f"Error: Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get list of tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print(f"Database: {db_path}")
print(f"Tables found: {len(tables)}")

for table in tables:
    table_name = table[0]
    print(f"\nTable: {table_name}")
    print("-" * 20)
    
    # Get schema
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    
    # Print columns: cid, name, type, notnull, dflt_value, pk
    print(f"{'ID':<5} {'Name':<20} {'Type':<15} {'NotNull':<10} {'PK':<5}")
    for col in columns:
        print(f"{col[0]:<5} {col[1]:<20} {col[2]:<15} {col[3]:<10} {col[5]:<5}")

    # Initialize count to 0
    count = 0
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
    except Exception as e:
        print(f"Error getting count: {e}")
        
    print(f"Total rows: {count}")
    
    if count > 0:
        print("Sample data (first 3 rows):")
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
        rows = cursor.fetchall()
        for row in rows:
            print(row)

conn.close()
