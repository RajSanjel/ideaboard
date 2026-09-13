import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../../@types/ApiResponse.js";
import { VerifyJwtToken } from "../../../helper/token.js";
import dbPool from "../../../db.js";

const verifyPerms = async (req: Request, res: Response, next: NextFunction) => {
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

		const sqlQuery = `
			SELECT id, is_admin, is_staff
			FROM users
			WHERE id = $1
		`;
		const result = await dbPool.query(sqlQuery, [tokenInfo.id]);

		if (result.rowCount === 0) {
			const errorResponse: ApiResponse = {
				success: false,
				httpCode: 401,
				message: "Unauthorized. Invalid token or user does not exist.",
			};
			res.status(errorResponse.httpCode).json(errorResponse);
			return;
		}

		const user = result.rows[0];

		res.locals.userId = user.id;
		res.locals.isAdmin = Boolean(user.is_admin);
		res.locals.isStaff = Boolean(user.is_staff);
		res.locals.isStaffPortal = Boolean(user.is_admin || user.is_staff);
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

export default verifyPerms;
