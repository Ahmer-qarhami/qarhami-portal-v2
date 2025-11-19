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

const resetWhatsNew = async () => {
  let token = getToken();
  return await axios
    .post(
      `${API_URL}/device-master/resetWhatsNew`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

// OpenPhone SMS API functions
const OPENPHONE_API_BASE = "https://api.openphone.com";
const OPENPHONE_API_KEY = import.meta.env.VITE_OPENPHONE_API_KEY;
const OPENPHONE_PHONE_ID = import.meta.env.VITE_OPENPHONE_PHONE_ID;
const OPENPHONE_USER_ID = import.meta.env.VITE_OPENPHONE_USER_ID;

// const sendSMS = async (phoneNumber, message) => {
//   debugger;
//   const maxRetries = 3;
//   let lastError;

//   for (let attempt = 0; attempt <= maxRetries; attempt++) {
//     try {
//       const response = await axios.post(
//         `${OPENPHONE_API_BASE}`,
//         {
//           to: [phoneNumber],
//           from: OPENPHONE_PHONE_ID,
//           content: message,
//           phoneNumberId: OPENPHONE_PHONE_ID,
//           userId: OPENPHONE_USER_ID,
//           setInboxStatus: "done",
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: OPENPHONE_API_KEY,
//           },
//         }
//       );

//       return response.data;
//     } catch (error) {
//       lastError = error;
//       console.error(`Attempt ${attempt + 1} failed for ${phoneNumber}:`, error);

//       if (attempt < maxRetries) {
//         const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
//         console.log(`Retrying in ${delay}ms...`);
//         await new Promise((resolve) => setTimeout(resolve, delay));
//       }
//     }
//   }

//   console.error(
//     `Failed to send SMS to ${phoneNumber} after ${maxRetries + 1} attempts`
//   );
//   throw lastError;
// };

const sendSMS = async (phoneNumber, message) => {
  debugger;
  const maxRetries = 3;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Updated endpoint - often includes version and specific path
      const response = await axios.post(
        `${OPENPHONE_API_BASE}/v1/messages`, // or similar endpoint
        {
          to: phoneNumber, // Often just a string, not array
          from: OPENPHONE_PHONE_ID,
          text: message, // Sometimes "text" instead of "content"
          // phoneNumberId and userId might not be needed in body if in auth
          userId: OPENPHONE_USER_ID,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENPHONE_API_KEY}`, // Often needs "Bearer"
          },
        }
      );

      return response.data;
    } catch (error) {
      lastError = error;
      console.error(
        `Attempt ${attempt + 1} failed:`,
        error.response?.data || error.message
      );

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

const getAllUserPhones = async () => {
  try {
    const response = await fetch(`${API_URL}/users/phones`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user phone numbers");
    }

    const data = await response.json();
    return data.phones || [];
  } catch (error) {
    console.error("Error fetching user phones:", error);
    throw error;
  }
};

const sendBulkSMS = async (phones, message, onProgress) => {
  const batchSize = 10; // OpenPhone allows 10 SMS per second
  const delayBetweenBatches = 1000; // 1 second delay between batches

  const results = {
    successful: 0,
    failed: 0,
    total: phones.length,
  };

  for (let i = 0; i < phones.length; i += batchSize) {
    const batch = phones.slice(i, i + batchSize);

    // Send batch of SMS
    const batchPromises = batch.map(async (phone) => {
      try {
        await sendSMS(phone, message);
        results.successful++;
        return { phone, success: true };
      } catch (error) {
        results.failed++;
        return { phone, success: false, error: error.message };
      }
    });

    await Promise.allSettled(batchPromises);

    // Update progress
    if (onProgress) {
      onProgress({
        completed: Math.min(i + batchSize, phones.length),
        total: phones.length,
        successful: results.successful,
        failed: results.failed,
      });
    }

    // Wait before next batch (except for the last batch)
    if (i + batchSize < phones.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
};

const broadcastSmsViaTwilio = async (message) => {
  let token = getToken();
  return await axios
    .post(
      `${API_URL}/twilio/broadcastSmsViaTwilio`,
      { message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
    });
};

const getTwilioUsers = async () => {
  let token = getToken();
  return await axios
    .get(`${API_URL}/twilio/users`, {
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

const sendBulkSmsToSpecificRecipients = async (recipients, message) => {
  let token = getToken();
  return await axios
    .post(
      `${API_URL}/twilio/sendBulkSmsToSpecificRecipients`,
      { recipients, message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    .then((res) => {
      return res?.data;
    })
    .catch((err) => {
      console.log(err);
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
  resetWhatsNew,
  sendSMS,
  getAllUserPhones,
  sendBulkSMS,
  broadcastSmsViaTwilio,
  getTwilioUsers,
  sendBulkSmsToSpecificRecipients,
};
