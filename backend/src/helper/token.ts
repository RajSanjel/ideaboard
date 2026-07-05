import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { Response } from "express";

const privateKey = process.env.JWT_PRIVATE_KEY;
const publicKey = process.env.JWT_PUBLIC_KEY;
const jwt_lifetime = process.env.JWT_LIFETIME;
export const GenerateJwtToken = ({ id }: { id: string }) => {
	if (!privateKey) {
		throw new Error(
			"JWT_PRIVATE_KEY is not defined in the environment variables.",
		);
	}
	const lifetime = (jwt_lifetime || "7d") as SignOptions["expiresIn"];
	const options: SignOptions = {
		algorithm: "RS512",
	};

	if (lifetime !== undefined) {
		options.expiresIn = lifetime;
	}

	const token = jwt.sign({ id: id }, privateKey, options);

	return token;
};

export const VerifyJwtToken = (token: string) => {
	if (!publicKey) {
		throw new Error(
			"JWT_PUBLIC_KEY is not defined in the environment variables.",
		);
	}
	try {
		return jwt.verify(token, publicKey, {
			algorithms: ["RS512"],
		}) as { id: string; iat: number; exp: number };
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			throw new Error("Token has expired.");
		}
		if (err instanceof jwt.JsonWebTokenError) {
			throw new Error("Invalid token.");
		}
		throw err;
	}
};

export const setAuthCookie = (res: Response, jwt: string) => {
	const standardMaxAge = 7 * 24 * 60 * 60 * 1000;
	res.cookie("auth_token", jwt, {
		httpOnly: true,
		sameSite: "strict",
		maxAge: standardMaxAge,
	});
};

export const clearAuthCookie = (res: Response) => {
	res.cookie("auth_token", "", {
		httpOnly: true,
		sameSite: "strict",
		expires: new Date(0),
	});
};
