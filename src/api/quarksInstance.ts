import { createClient } from "./quarks";

export const getQuarksInstance = () => {
    const baseUrl = import.meta.env.VITE_PROXY_SERVER_URL;
    console.log('quarks base url:', baseUrl);
    return createClient({
        baseUrl,
        appId: import.meta.env.VITE_QUARKSHUB_APP_ID || "skyharvest"
    });
}