import { Request } from "express";
import { SignUpPayload } from "../../@types/Auth";
import dbPool from "../../db";
import { ApiResponse } from "../../@types/ApiResponse";
import { passwordHasher } from "../../helper/hash";

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
