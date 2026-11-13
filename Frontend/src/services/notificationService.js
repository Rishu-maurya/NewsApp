import api from "./axiosInstance";

// Backend jab ready ho, sirf yeh path badalna padega.
// Expected response: { data: [{ _id, type, message, createdAt }] }
export const NOTIFICATIONS_PATH = "/notifications";

// .env me VITE_MOCK_ALERTS=true rakhne par nakli events aate hain (sirf testing ke liye)
const MOCK = import.meta.env.VITE_MOCK_ALERTS === "true";

const MOCK_EVENTS = [
    { type: "user_added", message: "Riya Sharma ne editor ke roop me join kiya" },
    { type: "user_removed", message: "Neha Verma ko journalist se remove kiya gaya" },
    { type: "user_added", message: "Aman Gupta naya journalist add hua" },
    { type: "user_removed", message: "Rohit Mehta ka account remove hua" },
];

export async function getNotifications(since) {
    if (MOCK) {
        const pick = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
        return [{ _id: String(Date.now()), ...pick, createdAt: new Date().toISOString() }];
    }

    const response = await api.get(NOTIFICATIONS_PATH, {
        params: since ? { since } : undefined,
    });
    return response.data?.data || [];
}