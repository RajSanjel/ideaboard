import { Client } from "pg";

const dbClient = new Client({
	connectionString: process.env.DATABASE_URL,
});

dbClient.connect();

export default dbClient;
