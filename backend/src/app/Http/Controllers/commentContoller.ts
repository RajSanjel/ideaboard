import { Request, Response } from "express";
import * as CommentProvider from "../../Services/comments.js";

const CommentController = {
	create: async (req: Request, res: Response) => {
		const result = await CommentProvider.createComment(req);
		res.status(result.httpCode).json(result);
	},
	list: async (req: Request, res: Response) => {
		const result = await CommentProvider.getComments(req);
		res.status(result.httpCode).json(result);
	},
};

export default CommentController;
