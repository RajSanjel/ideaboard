import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../@types/ApiResponse";
import { SignUpPayload } from "../@types/Auth";

const isValidEmail = (email: string): boolean => {
	const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const validateSignUp = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (req.body == null) {
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 400,
			message: "Request body is missing",
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}
	for (const key in req.body) {
		if (typeof req.body[key] === "string") {
			req.body[key] = req.body[key].trim();
		}
	}

	const { firstName, lastName, email, password, confirmPassword } =
		req.body as SignUpPayload;

	const errors: Record<string, string> = {};

	if (!firstName || typeof firstName !== "string" || firstName.length < 2) {
		errors.firstName = "First name must be atleast 2 characters long.";
	}

	if (!lastName || typeof lastName !== "string" || lastName.length < 2) {
		errors.lastName = "Last name must be atleast 2 characters long.";
	}

	if (!email || typeof email !== "string" || !isValidEmail(email)) {
		errors.email = "Email address is not valid.";
	}

	if (!password || typeof password !== "string" || password.length < 8) {
		errors.password = "Password must be atleast 8 character long.";
	}

	if (password !== confirmPassword) {
		errors.confirmPassword = "Password do not match";
	}

	if (Object.keys(errors).length > 0) {
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 422,
			message: "Data Validation failed",
			errors,
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}

	next();
};

export const validateLogin = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	if (req.body == null) {
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 400,
			message: "Request body is missing",
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}

	for (const key in req.body) {
		if (typeof req.body[key] === "string") {
			req.body[key] = req.body[key].trim();
		}
	}

	const { email, password } = req.body as SignUpPayload;
	const errors: Record<string, string> = {};
	if (!isValidEmail(email)) {
		errors.email = "Email address not valid";
	}

	if (!password || typeof password !== "string" || password.length < 8) {
		errors.password = "Password must be atleast 8 character long.";
	}

	if (Object.keys(errors).length > 0) {
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 422,
			message: "Data Validation failed",
			errors,
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}
	next();
};
