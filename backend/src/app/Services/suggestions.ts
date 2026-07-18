import { Request, Response } from "express"; // Import Response
import { ApiResponse } from "../../@types/ApiResponse.js";
import { SuggestionPayload } from "../../@types/Suggestion.js";
import dbPool from "../../db.js";

export async function createSuggestion(req: Request, res: Response) {
	try {
		const suggestionPayload = req.body as SuggestionPayload;
		const { title, details, category } = suggestionPayload;

		const userId = res.locals.userId;

		const sqlQuery = `
			INSERT INTO suggestions (
                ref, title, description, category, author_id, author_name, author_role
            ) 
			SELECT 
                'S-' || lpad(nextval('suggestion_ref_seq')::text, 3, '0'), 
                $1, 
                $2, 
                $3, 
                id, 
                name, 
                role 
            FROM users 
            WHERE id = $4
			RETURNING *;
		`;

		const data = [title, details, category, userId];
		const result = await dbPool.query(sqlQuery, data);

		if (result.rowCount === 0) {
			return {
				success: false,
				httpCode: 404,
				message: "User not found. Could not create suggestion.",
			};
		}

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 201,
			message: "Suggestion submitted successfully.",
			data: result.rows[0],
		};

		return successResponse;
	} catch (error) {
		console.error("Error creating suggestion:", (error as Error).message);

		const errResponse: ApiResponse = {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};

		return errResponse;
	}
}
