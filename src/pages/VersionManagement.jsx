import React, { useEffect, useState } from "react";
import {
  Collapse,
  Input,
  DatePicker,
  Row,
  Col,
  Form,
  Button,
  Table,
  message,
  Switch,
  Checkbox,
  Modal,
  Skeleton,
  Upload,
  Image,
} from "antd";
const { Search } = Input;
import { EditOutlined, BarsOutlined, UploadOutlined } from "@ant-design/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const { TextArea } = Input;
import "../App.css";
import PageContainer from "../components/PageContainer.jsx";
import ResponsiveDataCard from "../components/ResponsiveDataCard.jsx";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { tableScroll } from "../utils/responsive";
import {
  createVersion,
  updateVersion,
  updateBulkVersions,
  getAllVersions,
  resetWhatsNew,
} from "../api/Devices";
import {
  uploadAttachments,
  resolveAttachmentUrl,
} from "../api/Attachments";
import dayjs from "dayjs";

const DraggableRow = ({ children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props["data-row-key"] });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: isDragging ? "grabbing" : "grab",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </tr>
  );
};

const VersionManagement = () => {
  const isDesktop = useIsDesktop();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    serialNo: "",
    version: "",
    releaseDate: null,
    heading: "",
    description: "",
    imageLink: "",
    hasImageLink: false,
    appLink: "",
    hasAppLink: false,
    externalLink: "",
    hasExternalLink: false,
    isActive: false,
    index: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [expandPanel, setExpandPanel] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [reorderData, setReorderData] = useState([]);
  const [form] = Form.useForm();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Table columns
  const columns = [
    {
      title: "Index",
      dataIndex: "index",
      key: "index",
      className: "text-xs md:text-md",
      hidden: true,
    },
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      className: "text-xs md:text-md",
      hidden: true,
    },
    {
      title: "Serial No",
      dataIndex: "serialNo",
      key: "serialNo",
      className: "text-xs md:text-md",
      hidden: true,
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.version || "").localeCompare(b.version || ""),
    },
    {
      title: "Release Date",
      dataIndex: "releaseDate",
      key: "releaseDate",
      className: "text-xs md:text-md",
      render: (text) => (text ? dayjs(text).format("MM/DD/YYYY") : "-"),
      sorter: (a, b) => (a.releaseDate || 0) - (b.releaseDate || 0),
    },
    {
      title: "Heading",
      dataIndex: "heading",
      key: "heading",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.heading || "").localeCompare(b.heading || ""),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      className: "text-xs md:text-md",
      hidden: true,
    },
    {
      title: "Image Link",
      dataIndex: "imageLink",
      key: "imageLink",
      className: "text-xs md:text-md",
      hidden: true,
    },
    {
      title: "Has Image Link",
      dataIndex: "hasImageLink",
      key: "hasImageLink",
      className: "text-xs md:text-md",
      render: (text) => (text ? "Yes" : "No"),
      sorter: (a, b) => (a.hasImageLink === b.hasImageLink ? 0 : a.hasImageLink ? -1 : 1),
    },
    {
      title: "App Link",
      dataIndex: "appLink",
      key: "appLink",
      className: "text-xs md:text-md",
      hidden: true,
    },
    {
      title: "Has App Link",
      dataIndex: "hasAppLink",
      key: "hasAppLink",
      className: "text-xs md:text-md",
      render: (text) => (text ? "Yes" : "No"),
      sorter: (a, b) => (a.hasAppLink === b.hasAppLink ? 0 : a.hasAppLink ? -1 : 1),
    },
    {
      title: "External Link",
      dataIndex: "externalLink",
      key: "externalLink",
      className: "text-xs md:text-md",
      hidden: true,
    },
    {
      title: "Has External Link",
      dataIndex: "hasExternalLink",
      key: "hasExternalLink",
      className: "text-xs md:text-md",
      render: (text) => (text ? "Yes" : "No"),
      sorter: (a, b) => (a.hasExternalLink === b.hasExternalLink ? 0 : a.hasExternalLink ? -1 : 1),
    },
    {
      title: "Is Active",
      dataIndex: "isActive",
      key: "isActive",
      className: "text-xs md:text-md",
      render: (text) => (text ? "Yes" : "No"),
      sorter: (a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1),
    },
    {
      title: "Actions",
      key: "actions",
      className: "text-xs md:text-md",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleEditClick(record);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  const onExpandPanel = () => {
    if (expandPanel.length === 1) {
      setExpandPanel([]);
    } else {
      setExpandPanel([1]);
    }
  };

  // Search function
  const onFilterData = (text) => {
    setSearchText(text);
    const normalizedText = (text || "").toLowerCase();
    if (normalizedText === "") {
      setFilteredData(data);
    } else {
      const filtered = data?.filter((d) => {
        return (
          d?.version?.toLowerCase().includes(normalizedText) ||
          d?.heading?.toLowerCase().includes(normalizedText) ||
          d?.description?.toLowerCase().includes(normalizedText) ||
          (d?.releaseDate && formatDate(d.releaseDate).toLowerCase().includes(normalizedText))
        );
      });
      setFilteredData(filtered);
    }
  };

  const setImageLinkValue = (url) => {
    setFormData((prev) => ({
      ...prev,
      imageLink: url,
      hasImageLink: !!url || prev.hasImageLink,
    }));
    form.setFieldsValue({
      imageLink: url,
      ...(url ? { hasImageLink: true } : {}),
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return false;

    if (!file.type?.startsWith("image/")) {
      message.error("Please upload an image file (PNG, JPG, WebP, etc.)");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      message.error("Image size should be less than 10MB");
      return false;
    }

    try {
      setIsImageUploading(true);
      const uploaded = await uploadAttachments([file]);
      const attachment = uploaded?.[0];
      const imageUrl = attachment?.url;

      if (!imageUrl) {
        throw new Error("Upload succeeded but no image URL was returned");
      }

      setImageLinkValue(imageUrl);
      message.success("Image uploaded to files.qarhami.com");
    } catch (error) {
      console.error("Error uploading version image:", error);
      message.error(error.message || "Failed to upload image");
    } finally {
      setIsImageUploading(false);
    }

    // Prevent Ant Design Upload from doing its own upload
    return false;
  };

  // Handle form submission
  const onFinish = async (values) => {
    try {
      setIsSaving(true);

      // Custom validation for conditional fields
      if (values.hasImageLink && !values.imageLink?.trim()) {
        message.error("Please upload an image or enter an image link");
        setIsSaving(false);
        return;
      }
      if (values.hasAppLink && !values.appLink?.trim()) {
        message.error("Please enter app link");
        setIsSaving(false);
        return;
      }
      if (values.hasExternalLink && !values.externalLink?.trim()) {
        message.error("Please enter external link");
        setIsSaving(false);
        return;
      }

      // Create a copy to avoid mutating original values
      const payload = { ...values };

      // Persist full files.qarhami.com URL when an attachment id was stored
      if (payload.hasImageLink && payload.imageLink) {
        payload.imageLink = resolveAttachmentUrl(payload.imageLink);
      }

      // Convert releaseDate to Date object if needed
      if (
        payload.releaseDate &&
        typeof payload.releaseDate.toDate === "function"
      ) {
        payload.releaseDate = payload.releaseDate.toDate();
      }

      if (isEditing && formData.id) {
        // Update existing record
        console.log("Updating version with ID:", formData.id);
        const result = await updateVersion(formData.id, payload);

        if (!result) {
          throw new Error("Update failed");
        }

        console.log("Update result:", result);

        const updatedData = data.map((item) =>
          item.id === formData.id
            ? {
                ...payload,
                id: formData.id,
                serialNo: formData.serialNo,
                index: formData.index,
              }
            : item
        );

        setData(updatedData);
        setFilteredData(updatedData);
        message.success("Version updated successfully");
      } else {
        // Create new record
        console.log("Creating new version");
        const result = await createVersion(payload);

        if (!result || !result.id) {
          throw new Error("Create failed - no ID returned");
        }

        console.log("Create result:", result);

        const newItem = {
          ...payload,
          id: result.id, // ✅ Use the ID from API response
          serialNo: result.serialNo || data.length + 1,
          index: 0, // New item at top
        };

        // Increment indices of existing items
        const updatedData = data.map((item) => ({
          ...item,
          index: item.index + 1,
        }));

        // Add new item at the beginning
        const finalData = [newItem, ...updatedData];

        setData(finalData);
        setFilteredData(finalData);
        message.success("Version added successfully");
      }

      // Reset form
      form.resetFields();
      setExpandPanel([]);
      setIsEditing(false);
      setSearchText("");
      setFormData({
        id: "",
        serialNo: "",
        version: "",
        releaseDate: null,
        heading: "",
        description: "",
        imageLink: "",
        hasImageLink: false,
        appLink: "",
        hasAppLink: false,
        externalLink: "",
        hasExternalLink: false,
        isActive: false,
        index: 0,
      });
    } catch (error) {
      console.error("Error saving data:", error);
      message.error(error.message || "Failed to save data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle DatePicker onChange
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      releaseDate: date,
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, checked) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  // Handle switch change
  const handleSwitchChange = (checked) => {
    setFormData({
      ...formData,
      isActive: checked,
    });
  };

  // Handle row click to expand form
  const handleRowClick = (record) => {
    console.log("Row clicked, editing record:", record);
    const formattedRecord = {
      ...record,
      releaseDate: record.releaseDate ? dayjs(record.releaseDate) : null,
    };

    // Set form data with all fields including id and index
    setFormData(formattedRecord);
    setExpandPanel([1]);
    setIsEditing(true);

    // Update form fields with selected record data
    form.setFieldsValue({
      version: formattedRecord.version,
      releaseDate: formattedRecord.releaseDate,
      heading: formattedRecord.heading,
      description: formattedRecord.description,
      hasImageLink: formattedRecord.hasImageLink,
      imageLink: formattedRecord.imageLink,
      hasAppLink: formattedRecord.hasAppLink,
      appLink: formattedRecord.appLink,
      hasExternalLink: formattedRecord.hasExternalLink,
      externalLink: formattedRecord.externalLink,
      isActive: formattedRecord.isActive,
    });
    console.log("Form values set for record:", record.id);
  };

  // Handle edit button click
  const handleEditClick = (record) => {
    console.log("Edit button clicked for record:", record);
    handleRowClick(record);
  };

  // Handle reorder modal
  const handleReorderModal = () => {
    setReorderData([...filteredData]);
    setIsReorderModalOpen(true);
  };

  // Handle reset what's new
  const handleResetWhatsNew = async () => {
    try {
      setIsResetting(true);
      const result = await resetWhatsNew();
      if (result) {
        message.success("What's New reset successfully");
        // Reload versions after reset
        const versions = await getAllVersions();
        if (versions) {
          setData(versions);
          setFilteredData(versions);
        }
      } else {
        message.error("Failed to reset What's New");
      }
    } catch (error) {
      console.error("Error resetting What's New:", error);
      message.error("Failed to reset What's New");
    } finally {
      setIsResetting(false);
    }
  };

  // Handle drag end in modal
  const handleModalDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setReorderData((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Save reordered data
  const handleSaveReorder = async () => {
    // Update indices based on new order
    const updatedReorderData = reorderData.map((item, index) => ({
      ...item,
      index: index + 1,
    }));

    // Find records that have changed order
    const changedRecords = updatedReorderData.filter((item, index) => {
      const originalItem = data.find((d) => d.id === item.id);
      return originalItem && originalItem.index !== item.index;
    });

    // Call bulk update API for changed records
    if (changedRecords.length > 0) {
      const result = await updateBulkVersions(changedRecords);
      if (result) {
        // Update main data with reordered records
        const updatedData = updatedReorderData.map((item) => item);

        setData(updatedData);
        setFilteredData(updatedData);
        setIsReorderModalOpen(false);
        message.success("Records reordered successfully");
      }
    } else {
      setIsReorderModalOpen(false);
      message.success("No changes to reorder");
    }
  };

  // useEffect for page load
  useEffect(() => {
    console.log("VersionManagement useEffect triggered - loading versions");
    const loadVersions = async () => {
      try {
        setInitialLoading(true);
        console.log("Calling getAllVersions API...");
        const result = await getAllVersions();
        console.log("getAllVersions result:", result);
        if (result && result.length > 0) {
          console.log("Setting data with", result.length, "versions");
          setData(result);
          setFilteredData(result);
        } else {
          console.log("No versions returned or empty array:", result);
        }
      } catch (error) {
        console.error("Error loading versions:", error);
        message.error("Failed to load versions");
      } finally {
        setInitialLoading(false);
        console.log("Loading complete, initialLoading set to false");
      }
    };

    loadVersions();
  }, []);

  const formatDate = (value) =>
    value ? dayjs(value).format("MM/DD/YYYY") : "-";

  const renderCards = () => (
    <div className="grid grid-cols-1 gap-4">
      {filteredData.map((record) => (
        <ResponsiveDataCard
          key={record.id}
          title={record.version || "Untitled Version"}
          subtitle={record.heading || "No heading"}
          status={record.isActive ? "Active" : "Inactive"}
          statusColor={record.isActive ? "green" : "default"}
          onClick={() => handleRowClick(record)}
          rows={[
            { label: "Release Date", value: formatDate(record.releaseDate) },
            { label: "Description", value: record.description || "-" },
            {
              label: "Image Link",
              value: record.hasImageLink ? "Enabled" : "Disabled",
            },
            {
              label: "App Link",
              value: record.hasAppLink ? "Enabled" : "Disabled",
            },
            {
              label: "External Link",
              value: record.hasExternalLink ? "Enabled" : "Disabled",
            },
          ]}
          actions={
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(record);
              }}
            >
              Edit
            </Button>
          }
        />
      ))}
    </div>
  );

  return (
    <div>
      {initialLoading ? (
        <PageContainer>
          <Skeleton active />
        </PageContainer>
      ) : (
        <PageContainer
          title="Version Management"
          actions={
            <>
              <Button
                type="default"
                onClick={handleResetWhatsNew}
                loading={isResetting}
                className="border-red-500 text-red-600 hover:border-red-600 w-full sm:w-auto"
              >
                {isResetting ? "Resetting..." : "Reset What's New"}
              </Button>
              <Button
                type="default"
                icon={<BarsOutlined />}
                onClick={handleReorderModal}
                className="border-indigo-500 text-indigo-600 hover:border-indigo-600 w-full sm:w-auto"
              >
                Reorder Records
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setFormData({
                    id: "",
                    serialNo: "",
                    version: "",
                    releaseDate: null,
                    heading: "",
                    description: "",
                    imageLink: "",
                    hasImageLink: false,
                    appLink: "",
                    hasAppLink: false,
                    externalLink: "",
                    hasExternalLink: false,
                    isActive: false,
                    index: 0,
                  });
                  form.resetFields();
                  setExpandPanel([1]);
                  setIsEditing(false);
                }}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                Add New Version
              </Button>
            </>
          }
        >
            <Collapse
              className="bg-indigo-50 mb-3 sm:min-h-[30px] overflow-auto"
              size="small"
              activeKey={expandPanel}
              onChange={onExpandPanel}
              collapsible="icon"
              items={[
                {
                  key: "1",
                  label: "Add/Edit Version",
                  children: (
                    <>
                      <Form
                        size="medium"
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={formData}
                        className="text-xs md:text-sm"
                      >
                        <Row gutter={[16, 8]}>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              label="Version"
                              name="version"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter version",
                                },
                              ]}
                            >
                              <Input
                                type="text"
                                placeholder="Enter Version"
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    version: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              label="Release Date"
                              name="releaseDate"
                              rules={[
                                {
                                  required: true,
                                  message: "Please select release date",
                                },
                              ]}
                            >
                              <DatePicker
                                style={{ width: "100%" }}
                                format="MM/DD/YYYY"
                                onChange={handleDateChange}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              label="Heading"
                              name="heading"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter heading",
                                },
                              ]}
                            >
                              <Input
                                type="text"
                                placeholder="Enter Heading"
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    heading: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              label="Description"
                              name="description"
                              rules={[
                                {
                                  required: true,
                                  message: "Please enter description",
                                },
                              ]}
                            >
                              <TextArea
                                placeholder="Enter Description"
                                rows={2}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    description: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row gutter={[16, 8]}>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              name="hasImageLink"
                              valuePropName="checked"
                            >
                              <Checkbox
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    "hasImageLink",
                                    e.target.checked
                                  )
                                }
                              >
                                Has Image Link
                              </Checkbox>
                            </Form.Item>
                            <Form.Item name="imageLink" className="mb-2">
                              <Input
                                type="text"
                                placeholder="Image URL or upload below"
                                disabled={!formData.hasImageLink}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    imageLink: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Upload
                                accept="image/*"
                                showUploadList={false}
                                beforeUpload={handleImageUpload}
                                disabled={isImageUploading}
                              >
                                <Button
                                  icon={<UploadOutlined />}
                                  loading={isImageUploading}
                                  disabled={isImageUploading}
                                >
                                  {isImageUploading
                                    ? "Uploading..."
                                    : "Upload to files.qarhami.com"}
                                </Button>
                              </Upload>
                              {formData.imageLink &&
                                !formData.imageLink.includes("youtube") &&
                                !formData.imageLink.includes("youtu.be") &&
                                !formData.imageLink.includes("lottie") && (
                                  <Image
                                    src={resolveAttachmentUrl(formData.imageLink)}
                                    alt="Version preview"
                                    width={64}
                                    height={64}
                                    style={{
                                      objectFit: "cover",
                                      borderRadius: 6,
                                    }}
                                    fallback=""
                                  />
                                )}
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              name="hasAppLink"
                              valuePropName="checked"
                            >
                              <Checkbox
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    "hasAppLink",
                                    e.target.checked
                                  )
                                }
                              >
                                Has App Link
                              </Checkbox>
                            </Form.Item>
                            <Form.Item name="appLink">
                              <Input
                                type="text"
                                placeholder="Enter App Link"
                                disabled={!formData.hasAppLink}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    appLink: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              name="hasExternalLink"
                              valuePropName="checked"
                            >
                              <Checkbox
                                onChange={(e) =>
                                  handleCheckboxChange(
                                    "hasExternalLink",
                                    e.target.checked
                                  )
                                }
                              >
                                Has External Link
                              </Checkbox>
                            </Form.Item>
                            <Form.Item name="externalLink">
                              <Input
                                type="text"
                                placeholder="Enter External Link"
                                disabled={!formData.hasExternalLink}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    externalLink: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              label="Is Active"
                              name="isActive"
                              valuePropName="checked"
                            >
                              <Switch onChange={handleSwitchChange} />
                            </Form.Item>
                          </Col>
                        </Row>

                        {/* SUBMIT BUTTON - MOVED INSIDE FORM */}
                        <Form.Item>
                          <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isSaving
                              ? "Saving..."
                              : isEditing
                              ? "Update Version"
                              : "Add Version"}
                          </Button>
                        </Form.Item>
                      </Form>
                    </>
                  ),
                },
              ]}
            />

            {/* Table Container */}
            <div className="flex-grow min-h-0 overflow-auto">
              <hr className="border-indigo-200" />
              <Search
                className="mt-3 mb-3"
                placeholder="Search versions..."
                onSearch={(value) => onFilterData(value)}
                onChange={(e) => onFilterData(e.target.value)}
                allowClear
                value={searchText}
              />
              {filteredData.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No versions found.
                </div>
              ) : isDesktop ? (
                <Table
                  size="small"
                  dataSource={filteredData}
                  columns={columns}
                  pagination={false}
                  scroll={tableScroll}
                  onRow={(record) => ({
                    onClick: () => {
                      console.log("on row click", record);
                      handleRowClick(record);
                    },
                  })}
                  rowKey="id"
                />
              ) : (
                renderCards()
              )}
            </div>
        </PageContainer>
      )}

      {/* Reorder Modal */}
      <Modal
        title="Reorder Active Records"
        open={isReorderModalOpen}
        onCancel={() => setIsReorderModalOpen(false)}
        onOk={handleSaveReorder}
        width="min(100%, 48rem)"
        okText="Save Order"
        cancelText="Cancel"
      >
        <div className="mb-4 text-sm text-gray-600">
          Drag and drop the records to reorder them.
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleModalDragEnd}
        >
          <SortableContext
            items={reorderData.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table
              size="small"
              dataSource={reorderData}
              columns={[
                {
                  title: "ID",
                  dataIndex: "id",
                  key: "id",
                  className: "text-xs md:text-md",
                },
                {
                  title: "Version",
                  dataIndex: "version",
                  key: "version",
                  className: "text-xs md:text-md",
                },
                {
                  title: "Heading",
                  dataIndex: "heading",
                  key: "heading",
                  className: "text-xs md:text-md",
                },
                {
                  title: "Release Date",
                  dataIndex: "releaseDate",
                  key: "releaseDate",
                  className: "text-xs md:text-md",
                  render: (text) =>
                    text ? dayjs(text).format("MM/DD/YYYY") : "-",
                },
              ]}
              pagination={false}
              scroll={{ y: 300, x: "max-content" }}
              rowKey="id"
              components={{
                body: {
                  row: DraggableRow,
                },
              }}
            />
          </SortableContext>
        </DndContext>
      </Modal>
    </div>
  );
};

export default VersionManagement;
