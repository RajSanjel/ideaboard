import "dotenv/config";
import express from "express";
import dbPool from "./db";
import apiRoutes from "./routes/api";

const app = express();
const port = process.env.PORT || 3000;
console.log("DATABASE_URL =", process.env.DATABASE_URL);

app.get("/", (_req, res) => {
	res.status(200).json({
		message: "Server is running",
	});
});

dbPool.query("SELECT 1").then(() => console.log("DB is working"));

app.use(express.json());
app.use("/api", apiRoutes);

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
