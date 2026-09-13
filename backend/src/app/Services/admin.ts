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

function requireStaffPortal(req: Request): ApiResponse | null {
	const isAdmin = Boolean(req.res?.locals.isAdmin);
	const isStaff = Boolean(req.res?.locals.isStaff);

	if (!isAdmin && !isStaff) {
		return {
			success: false,
			httpCode: 403,
			message: "Forbidden. Staff or admin access required.",
		};
	}

	return null;
}

function accessType(isAdmin: boolean, isStaff: boolean) {
	if (isAdmin) return "admin";
	if (isStaff) return "staff";
	return "member";
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

export async function getUsers(req: Request): Promise<ApiResponse> {
	try {
		const forbidden = requireStaffPortal(req);
		if (forbidden) return forbidden;

		const page = Math.max(1, parseInt(req.query.page as string) || 1);
		const limit = Math.min(
			100,
			Math.max(1, parseInt(req.query.limit as string) || 10),
		);
		const offset = (page - 1) * limit;

		const { filter, search } = req.query;

		const conditions: string[] = [];
		const values: any[] = [];
		let paramIndex = 1;

		if (filter === "admin") {
			conditions.push(`is_admin = true`);
		} else if (filter === "staff") {
			conditions.push(`is_staff = true AND is_admin = false`);
		} else if (filter === "member") {
			conditions.push(`is_admin = false AND is_staff = false`);
		}

		if (search) {
			conditions.push(
				`(name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR role ILIKE $${paramIndex})`,
			);
			values.push(`%${search}%`);
			paramIndex++;
		}

		const whereClause =
			conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
		const countResult = await dbPool.query(countQuery, values);
		const total = parseInt(countResult.rows[0].count, 10);

		const dataQuery = `
			SELECT id, name, email, role, is_staff, is_admin, created_at
			FROM users
			${whereClause}
			ORDER BY is_admin DESC, is_staff DESC, name ASC
			LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
		`;

		const queryValues = [...values, limit, offset];
		const dataResult = await dbPool.query(dataQuery, queryValues);

		const people = dataResult.rows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			role: row.role,
			isAdmin: row.is_admin,
			isStaff: row.is_staff,
			access: accessType(row.is_admin, row.is_staff),
			createdAt: row.created_at,
		}));

		const successResponse: ApiResponse = {
			success: true,
			httpCode: 200,
			message: "Users fetched successfully.",
			data: people,
			meta: { page, limit, total },
		};

		return successResponse;
	} catch (error) {
		console.error("Error fetching users:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}

export async function getUserStats(req: Request): Promise<ApiResponse> {
	try {
		const forbidden = requireStaffPortal(req);
		if (forbidden) return forbidden;

		const sqlQuery = `
			SELECT
				COUNT(*) FILTER (WHERE is_admin = true) AS admins,
				COUNT(*) FILTER (WHERE is_staff = true AND is_admin = false) AS staff,
				COUNT(*) FILTER (WHERE is_admin = false AND is_staff = false) AS people
			FROM users
		`;

		const result = await dbPool.query(sqlQuery);
		const row = result.rows[0];

		const data = {
			admins: parseInt(row.admins, 10) || 0,
			staff: parseInt(row.staff, 10) || 0,
			people: parseInt(row.people, 10) || 0,
		};

		return {
			success: true,
			httpCode: 200,
			message: "User stats fetched.",
			data,
		};
	} catch (error) {
		console.error("Error fetching user stats:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}
