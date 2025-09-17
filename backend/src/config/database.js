import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../models/index.js';

let db;
let connection;

export async function connectDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Create PostgreSQL connection with more permissive settings
    connection = postgres(connectionString, {
      max: 20,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
      onnotice: () => {}, // Suppress notices
      transform: {
        undefined: null
      }
    });

    // Initialize Drizzle ORM
    db = drizzle(connection, { schema });

    // Test connection
    await connection`SELECT 1`;
    console.log('✅ Database connected successfully');

    return db;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    
    // Try alternative connection without password authentication
    try {
      console.log('Attempting alternative database connection...');
      const altConnectionString = 'postgresql://telehealth_user@localhost:5432/telehealth_db';
      connection = postgres(altConnectionString, {
        max: 5,
        idle_timeout: 30,
        connect_timeout: 5,
        ssl: false,
        onnotice: () => {},
        transform: {
          undefined: null
        }
      });
      
      db = drizzle(connection, { schema });
      await connection`SELECT 1`;
      console.log('✅ Alternative database connection successful');
      return db;
    } catch (altError) {
      console.warn('Alternative connection also failed:', altError.message);
      throw error;
    }
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return db;
}

export function getRawConnection() {
  if (!connection) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return connection;
}

export async function closeDatabase() {
  if (connection) {
    await connection.end();
  }
}
