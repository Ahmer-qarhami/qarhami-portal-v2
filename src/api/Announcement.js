import axios from "axios";
const API_URL = import.meta.env.VITE_API_BASE_URL;
import { getToken } from "./Auth";

const getAnnouncement = async () => {
  let token = getToken();
  return await axios
    .get(`${API_URL}/announcements/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const updateAnnouncement = async (data) => {
  let token = getToken();
  return await axios
    .post(`${API_URL}/announcements/update`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

export { getAnnouncement, updateAnnouncement };
