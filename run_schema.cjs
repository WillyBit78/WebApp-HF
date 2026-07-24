const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres.jmfxxqbtmyzslkrslpvk:uWiR6vJrbzeo9FpJ@aws-0-ca-central-1.pooler.supabase.com:6543/postgres';

const runSchema = async () => {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Supabase Database...');
    await client.connect();
    
    // Check if the file exists
    const schemaPath = 'C:\\Users\\Willy\\.gemini\\antigravity\\brain\\085609c8-04a3-412e-ab7c-68be0ca5c467\\supabase_schema.sql';
    if (!fs.existsSync(schemaPath)) {
      console.error('Schema file not found at:', schemaPath);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing Schema SQL...');
    await client.query(sql);
    
    console.log('Schema executed successfully! Tables created.');
  } catch (error) {
    console.error('Error executing schema:', error);
  } finally {
    await client.end();
  }
};

runSchema();
