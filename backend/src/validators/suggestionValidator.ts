import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../@types/ApiResponse.js";
import { SuggestionPayload } from "../@types/Suggestion.js";
import categoriesData from "../../../shared/categories.json";

const validCategoryIds = categoriesData.map((c) => c.id);

export const validateSuggestion = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (req.body == null) {
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 400,
			message: "Request body is missing",
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}

	for (const key in req.body) {
		if (typeof req.body[key] === "string") {
			req.body[key] = req.body[key].trim();
		}
	}

	if (!req.body.category) {
		req.body.category = "general";
	}

	const { title, details, category } = req.body as SuggestionPayload;
	const errors: Record<string, string> = {};

	if (!title || typeof title !== "string" || title.length < 5) {
		errors.title = "Title must be at least 5 characters long.";
	}

	if (!details || typeof details !== "string" || details.length < 100) {
		errors.details = "Details must be at least 100 characters long.";
	} else if (details.length > 6000) {
		errors.details = "Details cannot be more than 6000 characters.";
	}

	if (!validCategoryIds.includes(category as string)) {
		errors.category = "Selected category is invalid.";
	}

	if (Object.keys(errors).length > 0) {
		const errorResponse: ApiResponse = {
			success: false,
			httpCode: 422,
			message: "Data Validation failed",
			errors,
		};
		res.status(errorResponse.httpCode).json(errorResponse);
		return;
	}

	next();
};
