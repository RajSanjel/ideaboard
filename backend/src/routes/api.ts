import express, { Express } from "express";
import AuthRoutes from "./api/auth.js";
import SuggestionRoutes from "./api/suggestions.js";

const api: Express = express();

api.use("/auth", AuthRoutes);
api.use("/suggestions", SuggestionRoutes);

export default api;
