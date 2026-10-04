import { Request } from "express";
import dbPool from "../../db.js";
import { ApiResponse } from "../../@types/ApiResponse.js";

function paramId(value: string | string[] | undefined) {
	if (typeof value !== "string" || value.length === 0) return null;
	return value;
}

export async function createComment(req: Request): Promise<ApiResponse> {
	try {
		const userId = req.res?.locals.userId as string | undefined;
		const suggestionId = paramId(req.params.id);
		const body = String(req.body?.body ?? "").trim();
		const parentId = req.body?.parentId ? String(req.body.parentId) : null;

		if (!userId) {
			return { success: false, httpCode: 401, message: "Unauthorized." };
		}
		if (!suggestionId) {
			return {
				success: false,
				httpCode: 400,
				message: "Suggestion id is required.",
			};
		}
		if (!body) {
			return {
				success: false,
				httpCode: 400,
				message: "Comment body is required.",
			};
		}

		if (parentId) {
			const parent = await dbPool.query(
				`SELECT id FROM comments WHERE id = $1 AND suggestion_id = $2`,
				[parentId, suggestionId],
			);
			if ((parent.rowCount ?? 0) === 0) {
				return {
					success: false,
					httpCode: 400,
					message: "Parent comment not found on this suggestion.",
				};
			}
		}

		const sqlQuery = `
			INSERT INTO comments (
				suggestion_id, parent_id, body, author_id, author_name, author_role
			)
			SELECT $1, $2, $3, id, name, role
			FROM users
			WHERE id = $4
			RETURNING id, suggestion_id, parent_id, body, votes,
			          author_name, author_role, author_id, created_at
		`;

		const result = await dbPool.query(sqlQuery, [
			suggestionId,
			parentId,
			body,
			userId,
		]);

		if ((result.rowCount ?? 0) === 0) {
			return {
				success: false,
				httpCode: 404,
				message: "User not found.",
			};
		}

		return {
			success: true,
			httpCode: 201,
			message: "Comment posted.",
			data: result.rows[0],
		};
	} catch (error) {
		console.error("Error creating comment:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}

export async function getComments(req: Request): Promise<ApiResponse> {
	try {
		const suggestionId = paramId(req.params.id);
		if (!suggestionId) {
			return {
				success: false,
				httpCode: 400,
				message: "Suggestion id is required.",
			};
		}

		const suggestion = await dbPool.query(
			`SELECT id FROM suggestions WHERE id = $1`,
			[suggestionId],
		);
		if ((suggestion.rowCount ?? 0) === 0) {
			return {
				success: false,
				httpCode: 404,
				message: "Suggestion not found.",
			};
		}

		const result = await dbPool.query(
			`SELECT id, suggestion_id, parent_id, body, votes,
			        author_name, author_role, author_id, created_at, edited_at
			 FROM comments
			 WHERE suggestion_id = $1
			 ORDER BY created_at ASC`,
			[suggestionId],
		);

		return {
			success: true,
			httpCode: 200,
			message: "Comments fetched.",
			data: result.rows,
		};
	} catch (error) {
		console.error("Error fetching comments:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}
