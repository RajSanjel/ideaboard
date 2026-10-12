import { Request } from "express";
import dbPool from "../../db.js";
import { ApiResponse } from "../../@types/ApiResponse.js";

function paramId(value: string | string[] | undefined) {
	if (typeof value !== "string" || value.length === 0) return null;
	return value;
}

async function toggle(
	userId: string,
	targetId: string,
	kind: "suggestion" | "comment",
) {
	const client = await dbPool.connect();
	const voteTable =
		kind === "suggestion" ? "suggestion_votes" : "comment_votes";
	const parentTable = kind === "suggestion" ? "suggestions" : "comments";
	const fk = kind === "suggestion" ? "suggestion_id" : "comment_id";

	try {
		await client.query("BEGIN");

		const existing = await client.query(
			`SELECT 1 FROM ${voteTable} WHERE user_id = $1 AND ${fk} = $2`,
			[userId, targetId],
		);
		const alreadyVoted = (existing.rowCount ?? 0) > 0;

		if (alreadyVoted) {
			await client.query(
				`DELETE FROM ${voteTable} WHERE user_id = $1 AND ${fk} = $2`,
				[userId, targetId],
			);
			await client.query(
				`UPDATE ${parentTable} SET votes = GREATEST(votes - 1, 0) WHERE id = $1`,
				[targetId],
			);
		} else {
			const inserted = await client.query(
				`INSERT INTO ${voteTable} (${fk}, user_id)
				 SELECT id, $1 FROM ${parentTable} WHERE id = $2
				 ON CONFLICT DO NOTHING
				 RETURNING ${fk}`,
				[userId, targetId],
			);

			if ((inserted.rowCount ?? 0) === 0) {
				await client.query("ROLLBACK");
				return {
					success: false,
					httpCode: 404,
					message: `${kind === "suggestion" ? "Suggestion" : "Comment"} not found.`,
				};
			}

			await client.query(
				`UPDATE ${parentTable} SET votes = votes + 1 WHERE id = $1`,
				[targetId],
			);
		}

		const countResult = await client.query(
			`SELECT votes FROM ${parentTable} WHERE id = $1`,
			[targetId],
		);

		await client.query("COMMIT");

		return {
			success: true,
			httpCode: 200,
			message: alreadyVoted ? "Vote removed." : "Vote recorded.",
			data: {
				id: targetId,
				voted: !alreadyVoted,
				votes: countResult.rows[0]?.votes ?? 0,
			},
		};
	} catch (error) {
		await client.query("ROLLBACK");
		console.error("Error toggling vote:", (error as Error).message);
		return {
			success: false,
			httpCode: 500,
			message: "Internal Server Error",
		};
	} finally {
		client.release();
	}
}

export async function toggleSuggestionVote(req: Request): Promise<ApiResponse> {
	const userId = req.res?.locals.userId as string | undefined;
	const suggestionId = paramId(req.params.id);

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

	return toggle(userId, suggestionId, "suggestion");
}

export async function toggleCommentVote(req: Request): Promise<ApiResponse> {
	const userId = req.res?.locals.userId as string | undefined;
	const commentId = paramId(req.params.id);

	if (!userId) {
		return { success: false, httpCode: 401, message: "Unauthorized." };
	}
	if (!commentId) {
		return {
			success: false,
			httpCode: 400,
			message: "Comment id is required.",
		};
	}

	const owner = await dbPool.query(
		`SELECT author_id FROM comments WHERE id = $1`,
		[commentId],
	);

	if ((owner.rowCount ?? 0) === 0) {
		return { success: false, httpCode: 404, message: "Comment not found." };
	}

	if (owner.rows[0].author_id === userId) {
		return {
			success: false,
			httpCode: 403,
			message: "You cannot vote on your own comment.",
		};
	}

	return toggle(userId, commentId, "comment");
}
