import express, { Express } from "express";
import AuthRoutes from "./api/auth.js";
import SuggestionRoutes from "./api/suggestions.js";
import AdminRoutes from "./api/admin.js";

const api: Express = express();

api.use("/auth", AuthRoutes);
api.use("/suggestions", SuggestionRoutes);
api.use("/admin", AdminRoutes);
export default api;
