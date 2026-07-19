import API_CONFIG from '../config/api.js';

let cachedUser = null;
let authRequestPromise = null;

export async function me(forceRefresh = false) {

    if (forceRefresh) {
        cachedUser = null;
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('user_status');
    }

    if (cachedUser !== null) {
        return cachedUser;
    }

    const userStatus = sessionStorage.getItem('user_status');
    if (userStatus === 'guest') {
        return null;
    }

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        cachedUser = JSON.parse(storedUser);
        return cachedUser;
    }

    if (authRequestPromise !== null) {
        return authRequestPromise;
    }

    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.AUTH_ENDPOINT}/me`;
    authRequestPromise = (async () => {
        try {
            const resp = await fetch(url, {
                method: "GET",
                credentials: "include",
            });

            const respData = await resp.json();
            if (respData.httpCode !== 200) {
                cachedUser = null;
                sessionStorage.setItem('user_status', 'guest');
                return null;
            }
            cachedUser = respData.data;
            sessionStorage.setItem('user_status', 'logged_in');
            sessionStorage.setItem('user', JSON.stringify(cachedUser));

            return cachedUser;
        } catch (error) {
            console.error(error)
            return null;
        } finally {

            authRequestPromise = null;
        }

    })();
    return authRequestPromise;
}


export async function logout() {
    const url = `${API_CONFIG.BASE_URL}/${API_CONFIG.AUTH_ENDPOINT}/logout`;
    try {
        await fetch(url, {
            method: "POST",
            credentials: "include",
        });
        cachedUser = null;
        sessionStorage.removeItem('user');
        sessionStorage.setItem('user_status', 'guest');
    } catch (error) {
        console.error("Logout error:", error);
        return null;
    }
}

export function getCachedUser() {
    if (cachedUser !== null) {
        return cachedUser;
    }

    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
        cachedUser = JSON.parse(storedUser);
        return cachedUser;
    }

    return null;
}