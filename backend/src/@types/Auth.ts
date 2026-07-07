export type LoginPayload = {
	email: string;
	password: string;
};

export type SignUpPayload = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	confirmPassword: string;
};

export type UserProfile = {
	name: string;
	email: string;
	is_admin: boolean;
	is_staff: boolean;
};
