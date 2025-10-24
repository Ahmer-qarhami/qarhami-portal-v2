import axios from "axios";
const API_URL = import.meta.env.VITE_API_BASE_URL;
import { getToken } from "./Auth";
const uploadData = async (data) => {
  let token = getToken();
  return await axios
    .post(`${API_URL}/device-master/uploadData`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAllDevices = async () => {
  let token = getToken();
  return await axios
    .get(`${API_URL}/device-master/getAllData`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const assignEmailToDevices = async (data) => {
  let token = getToken();
  return await axios
    .post(`${API_URL}/device-master/assignEmailToDevices`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getDataByEmail = async (email) => {
  let token = getToken();
  return await axios
    .get(`${API_URL}/user-accounts/getDataByEmail/${email}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const updateFreeTrialStatus = async (body) => {
  let token = getToken();
  return await axios
    .post(`${API_URL}/stripe/update-freetrial-status`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAllActiveDevices = async () => {
  let token = getToken();
  return await axios
    .get(`${API_URL}/device-master/getAllActiveDevices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const createVersion = async (data) => {
  console.log(data);
  let token = getToken();
  return await axios
    .post(`${API_URL}/version-management/createVersion`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const updateVersion = async (id, data) => {
  let token = getToken();
  return await axios
    .put(`${API_URL}/version-management/updateVersion/${id}`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const updateBulkVersions = async (data) => {
  let token = getToken();
  return await axios
    .post(`${API_URL}/version-management/updateBulkVersions`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getAllVersions = async () => {
  console.log("getAllVersions called");
  let token = getToken();
  console.log("Token retrieved:", token ? "present" : "null/undefined");
  console.log("API URL:", API_URL);
  console.log("Full endpoint:", `${API_URL}/version-management/getAllVersions`);
  return await axios
    .get(`${API_URL}/version-management/getAllVersions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      console.log("getAllVersions success response:", res);
      console.log("Response data:", res?.data);
      return res?.data;
    })
    .catch((err) => {
      console.error("getAllVersions error:", err);
      console.error("Error response:", err.response);
      console.error("Error status:", err.response?.status);
      console.error("Error data:", err.response?.data);
      throw err; // Re-throw to let caller handle
    });
};

export {
  uploadData,
  getAllDevices,
  assignEmailToDevices,
  getDataByEmail,
  updateFreeTrialStatus,
  getAllActiveDevices,
  createVersion,
  updateVersion,
  updateBulkVersions,
  getAllVersions,
};
