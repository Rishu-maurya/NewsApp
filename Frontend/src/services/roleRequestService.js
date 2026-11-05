import api from "./axiosInstance";

function getErrorMessage(err, fallback) {
  if (err?.response) {
    return err.response.data?.message || fallback;
  }
  if (err?.isAxiosError) {
    return "Cannot reach the server. Check your connection and try again.";
  }
  return err?.message || fallback;
}

export async function sendRoleRequest({ requestedRole, organization, proofLink, message, token }) {
  const body = { requestedRole };
  if (typeof proofLink === "string" && proofLink.trim()) body.proofLink = proofLink.trim();
  if (typeof message === "string" && message.trim()) body.message = message.trim();

  try {
    const config = token
      ? { headers: { authorization: `Bearer ${token}` } }
      : undefined;
    const response = await api.post("/role-requests", body, config);
    return response.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not send the request. Try again."));
  }
}

export async function getMyRequests() {
  try {
    const response = await api.get("/role-requests/mine");
    return response.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load your role requests. Try again."));
  }
}

export async function getPendingRequests() {
  try {
    const response = await api.get("/role-requests/pending");
    return response.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load pending role requests. Try again."));
  }
}

export async function reviewRequest(id, decision, reviewNote = "") {
  try {
    const response = await api.patch(`/role-requests/${id}`, { decision, reviewNote });
    return response.data.data;
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not review the role request. Try again."));
  }
}