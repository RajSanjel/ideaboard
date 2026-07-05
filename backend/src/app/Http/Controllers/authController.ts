import { Response, Request } from "express";
import * as AuthProvider from "../../Services/auth";
import {
	clearAuthCookie,
	GenerateJwtToken,
	setAuthCookie,
} from "../../../helper/token";
import { ApiResponse } from "../../../@types/ApiResponse";

const AuthController = {
	register: async (req: Request, res: Response) => {
		const registerResult = await AuthProvider.register(req);
		res.status(registerResult.httpCode).json(registerResult);
	},
	login: async (req: Request, res: Response) => {
		const loginResult = await AuthProvider.login(req);
		if (loginResult.success) {
			setAuthCookie(res, GenerateJwtToken({ id: loginResult.data.id }));
		}
		res.status(loginResult.httpCode).json(loginResult);
	},
	logout: async (_req: Request, res: Response) => {
		try {
			clearAuthCookie(res);

			const successResponse: ApiResponse = {
				success: true,
				httpCode: 200,
				message: "User logout successful",
			};

			res.status(successResponse.httpCode).json(successResponse);
		} catch (error) {
			const errorResponse: ApiResponse = {
				success: false,
				httpCode: 500,
				message: "Internal Server Error",
			};
			res.status(errorResponse.httpCode).json(errorResponse);
		}
	},
};

export default AuthController;
