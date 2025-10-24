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
} from "antd";
import { EditOutlined, BarsOutlined } from "@ant-design/icons";
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
import {
  uploadData,
  getAllDevices,
  assignEmailToDevices,
  createVersion,
  updateVersion,
  updateBulkVersions,
} from "../api/Devices";
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
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    },
    {
      title: "Release Date",
      dataIndex: "releaseDate",
      key: "releaseDate",
      className: "text-xs md:text-md",
      render: (text) => (text ? dayjs(text).format("MM/DD/YYYY") : "-"),
    },
    {
      title: "Heading",
      dataIndex: "heading",
      key: "heading",
      className: "text-xs md:text-md",
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
    },
    {
      title: "Is Active",
      dataIndex: "isActive",
      key: "isActive",
      className: "text-xs md:text-md",
      render: (text) => (text ? "Yes" : "No"),
    },
    {
      title: "Actions",
      key: "actions",
      className: "text-xs md:text-md",
      // render: (_, record) => (
      //   <Button
      //     type="link"
      //     icon={<EditOutlined />}
      //     onClick={(e) => {
      //       e.stopPropagation();
      //       console.log("on row click");
      //       // console.log("Edit button clicked for record:", record);
      //       // handleRowClick(record);
      //     }}
      //   >
      //     Edit
      //   </Button>
      // ),
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

  // Handle form submission
  // const onFinish = async (values) => {
  //   debugger;
  //   console.log("onFinish called with values:", values);
  //   console.log("isEditing:", isEditing, "formData.id:", formData.id);
  //   try {
  //     setIsSaving(true);
  //     console.log(values, "values");
  //     console.log(
  //       "Calling API...",
  //       isEditing ? "updateVersion" : "createVersion"
  //     );

  //     // Custom validation for conditional fields
  //     if (values.hasImageLink && !values.imageLink?.trim()) {
  //       message.error("Please enter image link");
  //       setIsSaving(false);
  //       return;
  //     }
  //     if (values.hasAppLink && !values.appLink?.trim()) {
  //       message.error("Please enter app link");
  //       setIsSaving(false);
  //       return;
  //     }
  //     if (values.hasExternalLink && !values.externalLink?.trim()) {
  //       message.error("Please enter external link");
  //       setIsSaving(false);
  //       return;
  //     }

  //     // Convert releaseDate to Date object
  //     if (values.releaseDate) {
  //       values.releaseDate = values.releaseDate.toDate();
  //     }

  //     if (isEditing && formData.id) {
  //       // Update existing record via API
  //       console.log("Updating version with ID:", formData.id);
  //       const result = await updateVersion(formData.id, values);
  //       console.log("Update result:", result);
  //       if (result) {
  //         const updatedData = data.map((item) =>
  //           item.id === formData.id
  //             ? {
  //                 ...values,
  //                 id: formData.id,
  //                 serialNo: formData.serialNo,
  //                 index: formData.index,
  //               }
  //             : item
  //         );

  //         setData(updatedData);
  //         setFilteredData(updatedData);
  //         message.success("Version updated successfully");
  //       } else {
  //         message.error("Failed to update version");
  //       }
  //     } else {
  //       // Add new record via API
  //       console.log("Creating new version");
  //       const result = await createVersion(values);
  //       console.log("Create result:", result);
  //       if (result) {
  //         const newItem = {
  //           ...values,
  //           id: "",
  //           serialNo: result.serialNo || data.length + 1,
  //           index: 1,
  //         }; // New record gets index 1
  //         const updatedData = data.map((item) => ({
  //           ...item,
  //           index: item.index + 1,
  //         })); // Increment existing indices
  //         const finalData = [newItem, ...updatedData].sort(
  //           (a, b) => a.index - b.index
  //         );
  //         setData(finalData);
  //         setFilteredData(finalData);
  //         message.success("Version added successfully");
  //       } else {
  //         message.error("Failed to create version");
  //       }
  //     }

  //     // Reset form
  //     setFormData({
  //       id: "",
  //       serialNo: "",
  //       version: "",
  //       releaseDate: new Date(),
  //       heading: "",
  //       description: "",
  //       imageLink: "",
  //       hasImageLink: false,
  //       appLink: "",
  //       hasAppLink: false,
  //       externalLink: "",
  //       hasExternalLink: false,
  //       isActive: false,
  //       index: 0,
  //     });
  //     form.resetFields();
  //     setExpandPanel([]);
  //     setIsEditing(false);
  //   } catch (error) {
  //     console.error("Error saving data:", error);
  //     message.error("Failed to save data. Please try again.");
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const onFinish = async (values) => {
    console.log("onFinish called with values:", values);
    console.log("isEditing:", isEditing, "formData.id:", formData.id);

    try {
      setIsSaving(true);

      // Custom validation for conditional fields
      if (values.hasImageLink && !values.imageLink?.trim()) {
        message.error("Please enter image link");
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
      setFormData({
        id: "",
        serialNo: "",
        version: "",
        releaseDate: new Date(),
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
  // const handleRowClick = (record) => {
  //   console.log("Row clicked, editing record:", record);
  //   const formattedRecord = {
  //     ...record,
  //     releaseDate: record.releaseDate ? dayjs(record.releaseDate) : null,
  //   };
  //   setFormData(formattedRecord);
  //   setExpandPanel([1]);
  //   setIsEditing(true);
  //   // Update form fields with selected record data
  //   setTimeout(() => {
  //     if (formRef.current) {
  //       formRef.current.setFieldsValue({
  //         version: record.version,
  //         releaseDate: formattedRecord.releaseDate,
  //         heading: record.heading,
  //         description: record.description,
  //         hasImageLink: record.hasImageLink,
  //         imageLink: record.imageLink,
  //         hasAppLink: record.hasAppLink,
  //         appLink: record.appLink,
  //         hasExternalLink: record.hasExternalLink,
  //         externalLink: record.externalLink,
  //         isActive: record.isActive,
  //       });

  //       setFormData({
  //         version: record.version,
  //         releaseDate: formattedRecord.releaseDate,
  //         heading: record.heading,
  //         description: record.description,
  //         hasImageLink: record.hasImageLink,
  //         imageLink: record.imageLink,
  //         hasAppLink: record.hasAppLink,
  //         appLink: record.appLink,
  //         hasExternalLink: record.hasExternalLink,
  //         externalLink: record.externalLink,
  //         isActive: record.isActive,
  //       });
  //       console.log("Form values set for record:", record.id);
  //     }
  //   }, 100);
  // };
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
    setTimeout(() => {
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
    }, 100);
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
    // Load initial data if any
    setFilteredData(data);
  }, [data]);

  return (
    <div>
      {isLoading && (
        <img
          className="loader-container"
          src="./img/purple-spinner.gif"
          alt="Loading..."
        />
      )}
      {!isLoading && (
        <div className="bg-gray-100 flex flex-col items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 m-4 w-full max-w-[calc(100vw-32px)] h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Version Management</h2>
              <div className="flex gap-2">
                <Button
                  type="default"
                  icon={<BarsOutlined />}
                  onClick={handleReorderModal}
                  className="border-indigo-500 text-indigo-600 hover:border-indigo-600"
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add New Version
                </Button>
              </div>
            </div>
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
                            <Form.Item name="imageLink">
                              <Input
                                type="text"
                                placeholder="Enter Image Link"
                                disabled={!formData.hasImageLink}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    imageLink: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
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
                      </Form>
                      <Row>
                        <Col>
                          <Button
                            type="primary"
                            loading={isSaving}
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              console.log("Submit button clicked");
                              form.submit();
                            }}
                          >
                            {isSaving
                              ? "Saving..."
                              : isEditing
                              ? "Update Version"
                              : "Add Version"}
                          </Button>
                        </Col>
                      </Row>
                    </>
                  ),
                },
              ]}
            />

            {/* Table Container */}
            <div className="flex-grow min-h-0 overflow-auto">
              <hr className="border-indigo-200" />
              <Table
                size="small"
                dataSource={filteredData}
                columns={columns}
                pagination={false}
                scroll={{ y: 350 }}
                onRow={(record) => ({
                  onClick: (e) => {
                    console.log("on row click", record);
                    setFormData(record);
                    handleRowClick(record);
                  },
                })}
                rowKey="id"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reorder Modal */}
      <Modal
        title="Reorder Active Records"
        open={isReorderModalOpen}
        onCancel={() => setIsReorderModalOpen(false)}
        onOk={handleSaveReorder}
        width={800}
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
              scroll={{ y: 300 }}
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
