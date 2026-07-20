import React, { useEffect, useState } from "react";
import {
  Collapse,
  Input,
  Row,
  Col,
  Form,
  Button,
  Table,
  message,
  Switch,
  Modal,
  Skeleton,
} from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Server } from "lucide-react";
import {
  getAllAppInfo,
  createAppInfo,
  updateAppInfo,
  deleteAppInfo,
} from "../api/AppInfo";
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

  const columns = [
    {
      title: "App Name",
      dataIndex: "appName",
      key: "appName",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.appName || "").localeCompare(b.appName || ""),
    },
    {
      title: "Server IP",
      dataIndex: "serverIp",
      key: "serverIp",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.serverIp || "").localeCompare(b.serverIp || ""),
    },
    {
      title: "Port",
      dataIndex: "port",
      key: "port",
      className: "text-xs md:text-md",
      sorter: (a, b) => String(a.port || "").localeCompare(String(b.port || "")),
    },
    {
      title: "Link",
      dataIndex: "link",
      key: "link",
      className: "text-xs md:text-md",
      render: (text) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            {text}
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      className: "text-xs md:text-md",
      render: (val) => (val ? "Yes" : "No"),
      sorter: (a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1),
    },
    {
      title: "Actions",
      key: "actions",
      className: "text-xs md:text-md",
      render: (_, record) => (
        <div className="flex gap-1">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          >
            Edit
          </Button>
          <Button
            type="link"
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
      ),
    },
  ];

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

  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 m-6 w-full max-w-[calc(100vw-32px)] h-[calc(100vh-100px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Server className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-semibold">App Info Management</h2>
          </div>
          <Button
            type="primary"
            onClick={() => {
              resetForm();
              setExpandPanel([1]);
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Add App
          </Button>
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
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isSaving}
                      className="bg-green-600 hover:bg-green-700 mr-2"
                    >
                      {isEditing ? "Update" : "Save"}
                    </Button>
                    {isEditing && (
                      <Button onClick={resetForm}>Cancel</Button>
                    )}
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
          ) : (
            <Table
              size="small"
              dataSource={filteredData}
              columns={columns}
              pagination={false}
              scroll={{ y: 350 }}
              rowKey="id"
              onRow={(record) => ({
                onClick: () => handleEdit(record),
              })}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AppInfoManagement;
