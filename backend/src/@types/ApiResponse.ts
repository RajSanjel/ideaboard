export interface ApiResponse<T = any> {
	success: boolean;
	httpCode: number;
	message: string;
	data?: T;
	errors?: any;
	meta?: {
		page: number;
		limit: number;
		total: number;
	};
}
