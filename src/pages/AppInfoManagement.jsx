import React, { useEffect, useState } from "react";
import {
  Collapse,
  Input,
  Row,
  Col,
  Form,
  Button,
  message,
  Switch,
  Modal,
  Skeleton,
  Card,
  Tag,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Server } from "lucide-react";
import {
  getAllAppInfo,
  createAppInfo,
  updateAppInfo,
  deleteAppInfo,
} from "../api/AppInfo";
import PageContainer from "../components/PageContainer.jsx";
import "../App.css";

const { Search } = Input;
const { TextArea } = Input;
const { confirm } = Modal;

const emptyForm = {
  id: "",
  appName: "",
  serverIp: "",
  port: "",
  link: "",
  description: "",
  isActive: true,
};

const filterAppInfo = (items, text) => {
  const normalized = (text || "").toLowerCase();

  if (!normalized) {
    return items;
  }

  return items.filter(
    (item) =>
      item?.appName?.toLowerCase().includes(normalized) ||
      item?.serverIp?.toLowerCase().includes(normalized) ||
      String(item?.port || "").includes(normalized) ||
      item?.link?.toLowerCase().includes(normalized) ||
      item?.description?.toLowerCase().includes(normalized)
  );
};

const AppInfoManagement = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [formData, setFormData] = useState(emptyForm);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expandPanel, setExpandPanel] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setInitialLoading(true);
      const result = await getAllAppInfo();
      const list = Array.isArray(result) ? result : [];
      setData(list);
      setFilteredData(filterAppInfo(list, searchText));
    } catch {
      message.error("Failed to load app info");
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onFilterData = (text) => {
    setSearchText(text);
    setFilteredData(filterAppInfo(data, text));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    form.resetFields();
    setIsEditing(false);
    setExpandPanel([]);
  };

  const handleEdit = (record) => {
    setFormData(record);
    setIsEditing(true);
    setExpandPanel([1]);
    form.setFieldsValue({
      appName: record.appName,
      serverIp: record.serverIp,
      port: record.port,
      link: record.link,
      description: record.description,
      isActive: record.isActive,
    });
  };

  const handleDelete = (record) => {
    confirm({
      title: "Delete app info?",
      content: `Remove "${record.appName}" from the registry?`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await deleteAppInfo(record.id);
          const updated = data.filter((item) => item.id !== record.id);
          setData(updated);
          setFilteredData(filterAppInfo(updated, searchText));
          message.success("App info deleted");
          if (formData.id === record.id) resetForm();
        } catch {
          message.error("Failed to delete app info");
        }
      },
    });
  };

  const onFinish = async () => {
    try {
      setIsSaving(true);

      if (isEditing && formData.id) {
        const updated = await updateAppInfo(formData.id, formData);
        const updatedRecord = updated?.data || updated;
        const updatedList = data.map((item) =>
          item.id === formData.id
            ? { ...item, ...formData, ...updatedRecord, id: formData.id }
            : item
        );
        setData(updatedList);
        setFilteredData(filterAppInfo(updatedList, searchText));
        message.success("App info updated");
      } else {
        const created = await createAppInfo(formData);
        const newItem = { ...formData, ...created, id: created.id || created._id };
        const updatedList = [newItem, ...data];
        setData(updatedList);
        setFilteredData(filterAppInfo(updatedList, searchText));
        message.success("App info added");
      }

      resetForm();
    } catch {
      message.error("Failed to save app info");
    } finally {
      setIsSaving(false);
    }
  };

  const onExpandPanel = () => {
    setExpandPanel(expandPanel.length === 1 ? [] : [1]);
  };

  const renderInfoRow = (label, value) => (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="text-sm text-gray-800 break-all sm:text-right">
        {value || "-"}
      </span>
    </div>
  );

  return (
    <PageContainer
      title="App Info Management"
      icon={Server}
      actions={
        <Button
          type="primary"
          onClick={() => {
            resetForm();
            setExpandPanel([1]);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
        >
          Add App
        </Button>
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
              label: isEditing ? "Edit App Info" : "Add App Info",
              children: (
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={formData}
                  className="text-xs md:text-sm"
                >
                  <Row gutter={[16, 8]}>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Form.Item
                        label="App Name"
                        name="appName"
                        rules={[{ required: true, message: "Enter app name" }]}
                      >
                        <Input
                          placeholder="e.g. REST API"
                          onChange={(e) =>
                            setFormData({ ...formData, appName: e.target.value })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Form.Item label="Server IP" name="serverIp">
                        <Input
                          placeholder="e.g. 145.223.121.240"
                          onChange={(e) =>
                            setFormData({ ...formData, serverIp: e.target.value })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Form.Item label="Port" name="port">
                        <Input
                          placeholder="e.g. 3200"
                          onChange={(e) =>
                            setFormData({ ...formData, port: e.target.value })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Form.Item label="Link" name="link">
                        <Input
                          placeholder="e.g. https://api.qarhami.com"
                          onChange={(e) =>
                            setFormData({ ...formData, link: e.target.value })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={16} lg={12}>
                      <Form.Item label="Description" name="description">
                        <TextArea
                          rows={2}
                          placeholder="Optional notes"
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={6}>
                      <Form.Item
                        label="Active"
                        name="isActive"
                        valuePropName="checked"
                      >
                        <Switch
                          onChange={(checked) =>
                            setFormData({ ...formData, isActive: checked })
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item>
                    <div className="flex flex-wrap gap-2">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSaving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isEditing ? "Update" : "Save"}
                    </Button>
                    {isEditing && (
                      <Button onClick={resetForm}>Cancel</Button>
                    )}
                    </div>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />

        <div className="flex-grow min-h-0 overflow-auto">
          <hr className="border-indigo-200" />
          <Search
            className="mt-3 mb-3"
            placeholder="Search by app name, IP, port, or link..."
            onSearch={onFilterData}
            onChange={(e) => onFilterData(e.target.value)}
            allowClear
            value={searchText}
          />
          {initialLoading ? (
            <Skeleton active />
          ) : filteredData.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No app info found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredData.map((record) => (
                <Card
                  key={record.id}
                  hoverable
                  className="border border-gray-200 shadow-sm"
                  bodyStyle={{ padding: 16 }}
                  onClick={() => handleEdit(record)}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 break-words">
                          {record.appName || "Unnamed App"}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 break-all">
                          {record.description || "No description provided"}
                        </p>
                      </div>
                      <Tag color={record.isActive ? "green" : "default"}>
                        {record.isActive ? "Active" : "Inactive"}
                      </Tag>
                    </div>

                    <div className="space-y-3">
                      {renderInfoRow("Server IP", record.serverIp)}
                      {renderInfoRow("Port", record.port)}
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Link
                        </span>
                        {record.link ? (
                          <a
                            href={record.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 break-all sm:text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {record.link}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-800 sm:text-right">-</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                      {record.link ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(record.link, "_blank", "noopener,noreferrer");
                          }}
                        >
                          Navigate
                        </Button>
                      ) : null}
                      <Button
                        type="primary"
                        icon={<EditOutlined />}
                        className="bg-indigo-600 hover:bg-indigo-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(record);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(record);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
    </PageContainer>
  );
};

export default AppInfoManagement;
