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

const ALLOWED_ACCESS = ["admin", "staff", "member"] as const;

type UserAccess = (typeof ALLOWED_ACCESS)[number];
type SuggestionStatus = (typeof ALLOWED_STATUSES)[number];

function isSuggestionStatus(value: string): value is SuggestionStatus {
	return (ALLOWED_STATUSES as readonly string[]).includes(value);
}

function isUserAccess(value: string): value is UserAccess {
	return (ALLOWED_ACCESS as readonly string[]).includes(value);
}

function accessType(isAdmin: boolean, isStaff: boolean) {
	if (isAdmin) return "admin";
	if (isStaff) return "staff";
	return "member";
}

function flagsForAccess(access: UserAccess) {
	if (access === "admin") return { is_admin: true, is_staff: true };
	if (access === "staff") return { is_admin: false, is_staff: true };
	return { is_admin: false, is_staff: false };
}

export async function updateSuggestionStatus(req: Request) {
	try {
		const suggestionId = req.params.id;
		const status = String(req.body?.status ?? "").trim();

		if (!suggestionId) {
			return {
				success: false,
				httpCode: 400,
				message: "Suggestion id is required.",
			};
		}

		if (!isSuggestionStatus(status)) {
			return {
				success: false,
				httpCode: 400,
				message:
					"Invalid status. Allowed values: open, review, planned, progress, done, rejected.",
			};
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
			return {
				success: false,
				httpCode: 404,
				message: "Suggestion not found.",
			};
		}

		return {
			success: true,
			httpCode: 200,
			message: "Suggestion status updated.",
			data: result.rows[0],
		};
	} catch (error) {
		console.error(error);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}

export async function getUsers(req: Request): Promise<ApiResponse> {
	try {
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

		return {
			success: true,
			httpCode: 200,
			message: "Users fetched successfully.",
			data: people,
			meta: { page, limit, total },
		};
	} catch (error) {
		console.error("Error fetching users:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}

export async function getUserStats(_req: Request): Promise<ApiResponse> {
	try {
		const sqlQuery = `
			SELECT
				COUNT(*) FILTER (WHERE is_admin = true) AS admins,
				COUNT(*) FILTER (WHERE is_staff = true AND is_admin = false) AS staff,
				COUNT(*) FILTER (WHERE is_admin = false AND is_staff = false) AS people
			FROM users
		`;

		const result = await dbPool.query(sqlQuery);
		const row = result.rows[0];

		return {
			success: true,
			httpCode: 200,
			message: "User stats fetched.",
			data: {
				admins: parseInt(row.admins, 10) || 0,
				staff: parseInt(row.staff, 10) || 0,
				people: parseInt(row.people, 10) || 0,
			},
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

export async function updateUserAccess(req: Request): Promise<ApiResponse> {
	try {
		const isAdmin = Boolean(req.res?.locals.isAdmin);

		if (!isAdmin) {
			return {
				success: false,
				httpCode: 403,
				message: "Forbidden. Admin access required.",
			};
		}

		const id = req.params.id;
		const access = String(req.body?.access ?? "").trim();

		if (!id) {
			return {
				success: false,
				httpCode: 400,
				message: "User id is required.",
			};
		}

		if (!isUserAccess(access)) {
			return {
				success: false,
				httpCode: 400,
				message:
					"Invalid access. Allowed values: admin, staff, member.",
			};
		}

		const { is_admin, is_staff } = flagsForAccess(access);

		const sqlQuery = `
			UPDATE users
			SET is_admin = $1,
			    is_staff = $2
			WHERE id = $3
			RETURNING id, name, email, role, is_admin, is_staff
		`;

		const result = await dbPool.query(sqlQuery, [is_admin, is_staff, id]);

		if (result.rowCount === 0) {
			return {
				success: false,
				httpCode: 404,
				message: "User not found.",
			};
		}

		const row = result.rows[0];

		return {
			success: true,
			httpCode: 200,
			message: "User access updated.",
			data: {
				id: row.id,
				name: row.name,
				email: row.email,
				role: row.role,
				isAdmin: row.is_admin,
				isStaff: row.is_staff,
				access: accessType(row.is_admin, row.is_staff),
			},
		};
	} catch (error) {
		console.error("Error updating user access:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	}
}
