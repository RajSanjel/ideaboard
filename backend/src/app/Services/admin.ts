import { Request } from "express";
import dbPool from "../../db.js";
import { ApiResponse } from "../../@types/ApiResponse.js";

const ALLOWED_STATUSES = [
	"open",
	"review",
	"planned",
	"progress",
	"done",
	"rejected",
] as const;

type SuggestionStatus = (typeof ALLOWED_STATUSES)[number];

function isSuggestionStatus(value: string): value is SuggestionStatus {
	return (ALLOWED_STATUSES as readonly string[]).includes(value);
}

export async function updateSuggestionStatus(req: Request) {
	try {
		const isAdmin = Boolean(req.res?.locals.isAdmin);
		const isStaff = Boolean(req.res?.locals.isStaff);

		if (!isAdmin && !isStaff) {
			const forbidden: ApiResponse = {
				success: false,
				httpCode: 403,
				message: "Forbidden. Staff or admin access required.",
			};
			return forbidden;
		}

		const suggestionId = req.params.id;
		const status = String(req.body?.status ?? "").trim();
		if (!suggestionId) {
			const badRequest: ApiResponse = {
				success: false,
				httpCode: 400,
				message: "Suggestion id is required.",
			};
			return badRequest;
		}

		if (!isSuggestionStatus(status)) {
			const badRequest: ApiResponse = {
				success: false,
				httpCode: 400,
				message:
					"Invalid status. Allowed values: open, review, planned, progress, done, rejected.",
			};
			return badRequest;
		}

		const sqlQuery = `
			UPDATE suggestions
			SET status = $1,
			    edited_at = now()
			WHERE id = $2
			RETURNING id, ref, title, status, category, votes, edited_at
		`;

		const result = await dbPool.query(sqlQuery, [status, suggestionId]);

		if (result.rowCount === 0) {
			const notFound: ApiResponse = {
				success: false,
				httpCode: 404,
				message: "Suggestion not found.",
			};
			return notFound;
		}

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 200,
			message: "Suggestion status updated.",
			data: result.rows[0],
		};
		return successResponse;
	} catch (error) {
		console.error(error);
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
		return errorResponse;
	}
}
