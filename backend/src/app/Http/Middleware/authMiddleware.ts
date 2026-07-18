import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../@types/ApiResponse.js";
import { VerifyJwtToken } from "../../../helper/token.js";
import dbPool from "../../../db.js";

const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
	const token = req.cookies.auth_token;

	if (!token) {
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 401,
			message: "Unauthorized. No token provided.",
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}

	try {
		const tokenInfo = VerifyJwtToken(token);

		const sqlQuery = "SELECT id FROM users WHERE id=$1";
		const data = [tokenInfo.id];
		const result = await dbPool.query(sqlQuery, data);

		if (result.rowCount === 0) {
			const errorResponse: ApiResponse = {
				success: false,
				httpCode: 401,
				message: "Unauthorized. Invalid token or user does not exist.",
			};
			res.status(errorResponse.httpCode).json(errorResponse);
			return;
		}

		res.locals.userId = tokenInfo.id;

		next();
	} catch (error) {
		console.error(error);

		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}
};

export default verifyAuth;
