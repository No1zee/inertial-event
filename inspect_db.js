const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'keygen-server', 'database.sqlite');
console.log('Opening DB at:', dbPath);

try {
    const db = new Database(dbPath);
    const tableInfo = db.prepare("PRAGMA table_info(licenses)").all();
    console.log('Schema for licenses table:');
    console.table(tableInfo);
    
    // Check if device_id allows NULL
    const deviceIdCol = tableInfo.find(c => c.name === 'device_id');
    if (deviceIdCol) {
        console.log('device_id notnull:', deviceIdCol.notnull); // 0 means allows null, 1 means not null
    } else {
        console.error('device_id column MISSING!');
    }

} catch (err) {
    console.error('Error inspecting DB:', err);
}
