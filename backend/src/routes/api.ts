import express, { Express } from "express";
import AuthRoutes from "./api/auth";

const api: Express = express();

api.use("/auth", AuthRoutes);

export default api;
