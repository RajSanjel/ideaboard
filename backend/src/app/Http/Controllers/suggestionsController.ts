import { Request, Response } from "express";
import * as SuggestionProvider from "../../Services/suggestions.js";

const SuggestionController = {
	create: async (req: Request, res: Response) => {
		const result = await SuggestionProvider.createSuggestion(req, res);
		res.status(result.httpCode).json(result);
	},
	getAll: async (req: Request, res: Response) => {
		const result = await SuggestionProvider.getAllSuggestions(req);
		res.status(result.httpCode).json(result);
	},
	getStats: async (req: Request, res: Response) => {
		const result = await SuggestionProvider.getSuggestionStats(req);
		res.status(result.httpCode).json(result);
	},
	getByref: async (req: Request, res: Response) => {
		const result = await SuggestionProvider.getSuggestionByRef(req);
		res.status(result.httpCode).json(result);
	},
};

export default SuggestionController;
