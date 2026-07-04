import bcrypt from "bcrypt";

// we use hasher when inserting user data in database
export const passwordHasher = async (password: string): Promise<string> => {
	const salt = await bcrypt.genSalt(10);
	const passwordHash = await bcrypt.hash(password, salt);
	return passwordHash;
};

// we use hash verifier when logging in to compare the password
export const hashVerifier = async (
	password: string,
	passwordHash: string,
): Promise<boolean> => {
	const isMatch = await bcrypt.compare(password, passwordHash);
	return isMatch;
};
