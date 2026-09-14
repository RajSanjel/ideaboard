import { Request, Response } from "express";
import * as AdminProvider from "../../Services/admin.js";

const AdminController = {
	updateSuggestionStatus: async (req: Request, res: Response) => {
		const result = await AdminProvider.updateSuggestionStatus(req);
		res.status(result.httpCode).json(result);
	},
	getUsers: async (req: Request, res: Response) => {
		const result = await AdminProvider.getUsers(req);
		res.status(result.httpCode).json(result);
	},
	getUserStats: async (req: Request, res: Response) => {
		const result = await AdminProvider.getUserStats(req);
		res.status(result.httpCode).json(result);
	},
	updateUserAccess: async (req: Request, res: Response) => {
		const result = await AdminProvider.updateUserAccess(req);
		res.status(result.httpCode).json(result);
	},
};

export default AdminController;
