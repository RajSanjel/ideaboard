import { Request } from "express";
import { LoginPayload, SignUpPayload } from "../../@types/Auth";
import dbPool from "../../db";
import { ApiResponse } from "../../@types/ApiResponse";
import { hashVerifier, passwordHasher } from "../../helper/hash";

export async function register(req: Request) {
	try {
		const registrationPayload: SignUpPayload = req.body;
		const { firstName, lastName, email, password } = registrationPayload;

		const name = firstName + " " + lastName;
		const passwordHash = await passwordHasher(password);
		const sqlQuery = `
    INSERT INTO users (name, email, password_hash) 
    VALUES ($1, $2, $3)
	RETURNING id, name, email
	;
`;

		const values = [name, email, passwordHash];
		const result = await dbPool.query(sqlQuery, values);
		const newUser = result.rows[0];

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 201,
			message: "User registered successfully!",
			data: {
				id: newUser.id,
				email: newUser.email,
			},
		};

		return successResponse;
	} catch (error: any) {
		console.error("Registration error: ", error);
		if (error.code === "23505") {
			const conflictResponse: ApiResponse = {
				success: false,
				httpCode: 400,
				message: "An account with this email address already exists.",
			};

			return conflictResponse;
		}

		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 500,
			message: "An internal server error occured.",
		};

		return errorResponse;
	}
}

export async function login(req: Request) {
	try {
		const loginPayload: LoginPayload = req.body;
		const { email, password } = loginPayload;

		const sqlQuery = `SELECT id, email, password_hash from users WHERE email=$1`;
		const values = [email];

		const result = await dbPool.query(sqlQuery, values);

		if (result.rows.length === 0) {
			const errorResponse: ApiResponse = {
				success: false,
				httpCode: 400,
				message: "Invalid email or password",
			};
			return errorResponse;
		}
		const user = result.rows[0];

		const isValidPass = await hashVerifier(password, user.password_hash);

		if (isValidPass) {
			const successResponse: ApiResponse = {
				success: true,
				httpCode: 200,
				message: "User login successful",
				data: {
					id: user.id,
				},
			};
			return successResponse;
		}

		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 400,
			message: "Invalid email or password",
		};
		return errorResponse;
	} catch (error) {
		console.error(error);
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 500,
			message: "Internal Server Errror",
		};

		return errorResponse;
	}
}
