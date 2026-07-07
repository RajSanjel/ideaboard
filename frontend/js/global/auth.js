import API_CONFIG from '../config/api.js';

window.App = window.App || {};

export async function me() {
    const url = API_CONFIG.BASE_URL + API_CONFIG.AUTH_ENDPOINT + "/me";
    let user;
    try {
        const resp = await fetch(url, {
            method: "GET",
            credentials: "include",
        });

        const respData = await resp.json();
        if (respData.httpCode !== 200) {
            this.user = null;
            return null;
        }
        user = respData.data;
        return user;
    } catch (error) {
        console.error(error)
        return null;
    }

}


export async function logout() {
    const url = API_CONFIG.BASE_URL + API_CONFIG.AUTH_ENDPOINT + "/logout";
    try {
        const resp = await fetch(url, {
            method: "POST",
            credentials: "include",
        });

    } catch (error) {
        console.error(error)
        return null;
    }
}