import api from "./axiosInstance";

export async function sendRoleRequest({ requestedRole, organization, proofLink, message }) {
  const body = { requestedRole, organization: organization.trim() };
  if (proofLink && proofLink.trim()) body.proofLink = proofLink.trim();
  if (message && message.trim()) body.message = message.trim();

  try {
    const response = await api.post("/role-requests", body);
    return response.data.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Could not send the request. Try again.");
  }
}

export async function getMyRequests() {
  const response = await api.get("/role-requests/mine");
  return response.data.data;
}