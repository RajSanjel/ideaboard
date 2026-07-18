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

export async function getAllSuggestions(req: Request): Promise<ApiResponse> {
	try {
		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(
			100,
			Math.max(1, parseInt(req.query.limit as string) || 10),
		);
		const offset = (page - 1) * limit;

		const countQuery = `SELECT COUNT(*) FROM suggestions`;
		const countResult = await dbPool.query(countQuery);
		const total = parseInt(countResult.rows[0].count, 10);

		const dataQuery = `
			SELECT * FROM suggestions 
			ORDER BY created_at DESC 
			LIMIT $1 OFFSET $2;
		`;
		const dataResult = await dbPool.query(dataQuery, [limit, offset]);

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 200,
			message: "Suggestions fetched successfully.",
			data: dataResult.rows,
			meta: {
				page: page,
				limit: limit,
				total: total,
			},
		};

		return successResponse;
	} catch (error) {
		console.error("Error fetching suggestions:", (error as Error).message);

		const errResponse: ApiResponse = {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};

		return errResponse;
	}
}
