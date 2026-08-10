import { Request, Response } from "express";
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

		const { status, category, sort, search } = req.query;

		const conditions: string[] = [];
		const values: any[] = [];
		let paramIndex = 1;

		if (status && status !== "All" && status !== "default") {
			conditions.push(`status = $${paramIndex}`);
			values.push(status);
			paramIndex++;
		}

		if (category && category !== "All" && category !== "default") {
			conditions.push(`category = $${paramIndex}`);
			values.push(category);
			paramIndex++;
		}

		if (search) {
			conditions.push(
				`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR ref ILIKE $${paramIndex})`,
			);
			values.push(`%${search}%`);
			paramIndex++;
		}

		const whereClause =
			conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		const countQuery = `SELECT COUNT(*) FROM suggestions ${whereClause}`;
		const countResult = await dbPool.query(countQuery, values);
		const total = parseInt(countResult.rows[0].count, 10);

		let orderBy = "created_at DESC";
		if (sort === "most_votes") {
			orderBy = "votes DESC, created_at DESC";
		} else if (sort === "least_votes") {
			orderBy = "votes ASC, created_at DESC";
		}

		const dataQuery = `
			SELECT * 
			FROM suggestions 
			${whereClause} 
			ORDER BY ${orderBy} 
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
		`;

		const queryValues = [...values, limit, offset];
		const dataResult = await dbPool.query(dataQuery, queryValues);

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 200,
			message: "Suggestions fetched successfully.",
			data: dataResult.rows,
			meta: { page, limit, total },
		};

		return successResponse;
	} catch (error) {
		console.error("Error fetching suggestions:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}

export async function getSuggestionStats(_req: Request) {
	try {
		const sqlQuery = `
			SELECT 
				COUNT(*) as total,
				COUNT(*) FILTER (WHERE status = 'open') as open,
				COUNT(*) FILTER (WHERE status = 'review') as review,
				COUNT(*) FILTER (WHERE status = 'planned') as planned,
				COUNT(*) FILTER (WHERE status = 'progress') as in_progress,
				COUNT(*) FILTER (WHERE status = 'done') as completed
			FROM suggestions
			WHERE status != 'rejected';
		`;

		const result = await dbPool.query(sqlQuery);
		const stats = result.rows[0];

		const data = {
			total: parseInt(stats.total, 10) || 0,
			open: parseInt(stats.open, 10) || 0,
			review: parseInt(stats.review, 10) || 0,
			planned: parseInt(stats.planned, 10) || 0,
			in_progress: parseInt(stats.in_progress, 10) || 0,
			completed: parseInt(stats.completed, 10) || 0,
		};

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 200,
			message: "Suggestion stats fetched.",
			data: data,
		};

		return successResponse;
	} catch (error) {
		console.error(
			"Error fetching suggestion stats:",
			(error as Error).message,
		);

		const errResponse: ApiResponse = {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};

		return errResponse;
	}
}

export async function getSuggestionByRef(req: Request) {
	try {
		const ref = req.query.refId as string;

		if (!ref) {
			return {
				success: false,
				httpCode: 400,
				message: "Suggestion reference code (ref) is required.",
			};
		}

		const sqlQuery = `
			SELECT * 
			FROM suggestions 
			WHERE ref = $1;
		`;

		const result = await dbPool.query(sqlQuery, [ref]);

		if (result.rowCount === 0) {
			return {
				success: false,
				httpCode: 404,
				message: "Suggestion not found.",
			};
		}

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 200,
			message: "Suggestion fetched successfully.",
			data: result.rows[0],
		};

		return successResponse;
	} catch (error) {
		console.error(
			"Error fetching suggestion by ref:",
			(error as Error).message,
		);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}
