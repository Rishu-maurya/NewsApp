import api from "./axiosInstance";

function getErrorMessage(err, fallback) {
  if (err?.response) return err.response.data?.message || fallback;
  if (err?.isAxiosError) return "Cannot reach the server. Check your connection and try again.";
  return err?.message || fallback;
}

function normalizeUser(user) {
  return {
    id: user._id,
    name: user.fullName,
    email: user.email,
    role: user.role === "user" ? "reader" : user.role,
    active: user.isActive,
  };
}

export async function getAdminUsers(page = 1, limit = 50) {
  try {
    const response = await api.get("/users", { params: { page, limit } });
    return {
      users: response.data.data.map(normalizeUser),
      pagination: response.data.pagination,
    };
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not load users."));
  }
}

export async function updateAdminUserRole(id, role) {
  try {
    const response = await api.patch(`/users/${id}/role`, { role: role === "reader" ? "user" : role });
    return normalizeUser(response.data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not update this user's role."));
  }
}

export async function updateAdminUserStatus(id, isActive) {
  try {
    const response = await api.patch(`/users/${id}/status`, { isActive });
    return normalizeUser(response.data.data);
  } catch (err) {
    throw new Error(getErrorMessage(err, "Could not update this user's status."));
  }
}