import axios from "axios";
import { getToken } from "./Auth";

const API_URL = import.meta.env.VITE_API_BASE_URL;

const authHeaders = () => ({
  Authorization: `Bearer ${getToken()}`,
});

const getAllAppInfo = async () => {
  return axios
    .get(`${API_URL}/app-info/getAll`, { headers: authHeaders() })
    .then((res) => res?.data)
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

const createAppInfo = async (data) => {
  return axios
    .post(`${API_URL}/app-info/create`, data, { headers: authHeaders() })
    .then((res) => res?.data)
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

const updateAppInfo = async (id, data) => {
  return axios
    .put(`${API_URL}/app-info/update/${id}`, data, { headers: authHeaders() })
    .then((res) => res?.data)
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

const deleteAppInfo = async (id) => {
  return axios
    .delete(`${API_URL}/app-info/delete/${id}`, { headers: authHeaders() })
    .then((res) => res?.data)
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

export { getAllAppInfo, createAppInfo, updateAppInfo, deleteAppInfo };
