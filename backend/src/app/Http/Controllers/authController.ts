import { Response, Request } from "express";
import * as AuthProvider from "../../Services/auth";
import { GenerateJwtToken, setAuthCookie } from "../../../helper/token";

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
};

export default AuthController;
