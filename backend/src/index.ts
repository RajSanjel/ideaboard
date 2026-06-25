import "dotenv/config";
import express from "express";
import dbClient from "./db";

const app = express();
const port = process.env.PORT || 3000;
console.log("DATABASE_URL =", process.env.DATABASE_URL);

app.get("/", (_req, res) => {
	res.status(200).json({
		message: "Server is running",
	});
});

dbClient.query("SELECT 1").then(() => console.log("DB is working"));

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
