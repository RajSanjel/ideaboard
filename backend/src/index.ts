import "dotenv/config";
import express from "express";
import dbPool from "./db.js";
import apiRoutes from "./routes/api.js";
import cookieParser from "cookie-parser";
import cors from "cors";
const app = express();
const port = process.env.PORT || 3000;

app.use(
	cors({
		credentials: true,
		origin: true,
	}),
);
app.get("/", (_req, res) => {
	res.status(200).json({
		message: "Server is running",
	});
});

dbPool.query("SELECT 1").then(() => console.log("DB is working"));

app.use(cookieParser());
app.use(express.json());
app.use("/api", apiRoutes);

app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
