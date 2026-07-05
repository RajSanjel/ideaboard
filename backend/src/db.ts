import { Pool } from "pg";

const dbPool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 20,
	idleTimeoutMillis: 30000,
});

dbPool.connect();

export default dbPool;
