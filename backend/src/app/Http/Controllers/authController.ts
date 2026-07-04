import { Response, Request } from "express";
import * as AuthProvider from "../../Services/auth";

const AuthController = {
	register: async (req: Request, res: Response) => {
		const registerResult = await AuthProvider.register(req);
		res.status(registerResult.httpCode).json(registerResult);
	},
};

export default AuthController;
