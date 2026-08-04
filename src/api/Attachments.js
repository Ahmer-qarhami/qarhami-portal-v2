const ATTACHMENTS_BASE_URL = (
  import.meta.env.VITE_ATTACHMENTS_API_ENDPOINT || "https://files.qarhami.com"
).replace(/\/$/, "");

/**
 * Upload files to files.qarhami.com (attachments service).
 * @param {File[]} files
 * @returns {Promise<Array<{ id: string, filename: string, originalName: string, url: string }>>}
 */
const uploadAttachments = async (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("At least one file is required");
  }

  files.forEach((file) => {
    if (!file || !(file instanceof File)) {
      throw new Error(`Invalid file: ${file?.name || "unknown"}`);
    }
  });

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file, file.name);
  });

  const uploadUrl = `${ATTACHMENTS_BASE_URL}/attachments`;
  let response;
  try {
    response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Network/CORS error while uploading to ${uploadUrl}. Check attachments service availability and allowed origins.`
      );
    }
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Upload failed (${response.status}): ${errorText.substring(0, 200)}`
    );
  }

  const data = await response.json();
  const records = Array.isArray(data) ? data : [data];

  return records.map((record) => {
    const id =
      record?.id ||
      (typeof record?.filename === "string"
        ? record.filename.replace(/\.[^/.]+$/, "")
        : "");
    return {
      ...record,
      id,
      url: id ? `${ATTACHMENTS_BASE_URL}/attachments/${id}` : "",
    };
  });
};

/**
 * Resolve a stored imageLink (full URL or attachment id) to a displayable URL.
 */
const resolveAttachmentUrl = (imageLink) => {
  if (!imageLink || typeof imageLink !== "string") return "";
  const trimmed = imageLink.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const normalizedId = trimmed
    .replace(/^\/?attachments\//, "")
    .replace(/\.[^/.]+$/, "");
  return `${ATTACHMENTS_BASE_URL}/attachments/${encodeURIComponent(normalizedId)}`;
};

export { uploadAttachments, resolveAttachmentUrl, ATTACHMENTS_BASE_URL };
