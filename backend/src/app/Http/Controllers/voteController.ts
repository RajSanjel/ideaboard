import { Request, Response } from "express";
import * as VoteProvider from "../../Services/votes.js";

const VoteController = {
	toggleSuggestion: async (req: Request, res: Response) => {
		const result = await VoteProvider.toggleSuggestionVote(req);
		res.status(result.httpCode).json(result);
	},
	toggleComment: async (req: Request, res: Response) => {
		const result = await VoteProvider.toggleCommentVote(req);
		res.status(result.httpCode).json(result);
	},
};

export default VoteController;
