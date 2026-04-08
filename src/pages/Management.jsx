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
  Modal,
  Select,
  Popconfirm,
} from "antd";
const { Search } = Input;
const { Option } = Select;
import { ExcelToJson } from "../utils/ExcelReader";
import "../App.css";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import {
  getDataByEmail,
  updateFreeTrialStatus,
  cancelSubscription,
  undoCancelSubscription,
} from "../api/Devices";
import dayjs from "dayjs";

const Management = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [expandPanel, setExpandPanel] = useState([]);
  const [duplicateData, setDuplicateData] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // New state for save button loading
  const [cancellingSerial, setCancellingSerial] = useState(null);
  const [undoingSerial, setUndoingSerial] = useState(null);
  const formRef = React.createRef();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [assignEmail, setAssignEmail] = useState("");

  // Function to format Unix timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(Number(timestamp * 1000));
    return dayjs(date).format("MM/DD/YYYY");
  };

  const subscriptionLooksCancelled = (status) =>
    String(status || "")
      .toUpperCase()
      .includes("CANCEL_PENDING");

  const canShowUndoCancel = (status) => {
    const s = String(status || "").toUpperCase();
    return s === "CANCEL_PENDING";
  };

  const handleUndoCancelSubscription = async (record) => {
    const email = record.email || formData.email;
    if (!email) {
      message.error(
        "Email is required. Enter it above and use Get Data before undoing.",
      );
      return;
    }
    try {
      setUndoingSerial(record.deviceSerial);
      await undoCancelSubscription({
        email,
        deviceSerial: record.deviceSerial,
      });
      const patch = { ...record, subscriptionStatus: "SUBSCRIBED" };
      const merge = (rows) =>
        rows.map((row) =>
          row.deviceSerial === record.deviceSerial ? { ...row, ...patch } : row,
        );
      setData(merge(data));
      setFilteredData(merge(filteredData));
      setDuplicateData((prev) => merge(prev));
      message.success("Subscription cancellation undone");
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      message.error(apiMsg || "Failed to undo cancellation");
    } finally {
      setUndoingSerial(null);
    }
  };

  const handleCancelSubscription = async (record) => {
    debugger;
    const email = record.email || formData.email;
    if (!email) {
      message.error(
        "Email is required. Enter it above and use Get Data before canceling.",
      );
      return;
    }
    try {
      setCancellingSerial(record.deviceSerial);
      await cancelSubscription({ email, deviceSerial: record.deviceSerial });
      const patch = { ...record, subscriptionStatus: "CANCEL_PENDING" };
      const merge = (rows) =>
        rows.map((row) =>
          row.deviceSerial === record.deviceSerial ? { ...row, ...patch } : row,
        );
      setData(merge(data));
      setFilteredData(merge(filteredData));
      setDuplicateData((prev) => merge(prev));
      message.success("Subscription canceled");
    } catch (err) {
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      message.error(apiMsg || "Failed to cancel subscription");
    } finally {
      setCancellingSerial(null);
    }
  };

  //table columns
  const columns = [
    {
      title: "Serial",
      dataIndex: "deviceSerial",
      key: "deviceSerial",
      clickable: true,
      className: "link-column text-xs md:text-md",

      render: (text, record) => {
        return (
          <a
            onClick={() => {
              //setting form data
              const _formData = data.find((d) => d.deviceSerial == text);

              // Create a copy to avoid modifying the original data
              const formDataCopy = { ..._formData };

              // If freeTrialEndDate exists, convert it to dayjs for DatePicker
              if (formDataCopy.freeTrialEndDate) {
                formDataCopy.freeTrialEndDate = dayjs(
                  Number(formDataCopy.freeTrialEndDate) * 1000,
                );
              }

              setFormData(formDataCopy);
              formRef?.current?.setFieldsValue(formDataCopy);

              //expand panel
              onExpandPanel(text);
            }}
          >
            {text}
          </a>
        );
      },
    },
    {
      title: "Car Name",
      dataIndex: "carName",
      key: "carName",
      clickable: true,
      className: "text-xs md:text-md",
    },
    {
      title: "Status",
      dataIndex: "subscriptionStatus",
      key: "subscriptionStatus",
      className: "text-xs md:text-md",
    },
    {
      title: "Free Trial Expiry",
      dataIndex: "freeTrialEndDate",
      key: "freeTrialEndDate",
      className: "text-xs md:text-md",
      render: (text) => formatDate(text),
    },
    {
      title: "Billing Date",
      dataIndex: "billingDate",
      key: "billingDate",
      className: "text-xs md:text-md",
      render: (text) => formatDate(text),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      className: "text-xs md:text-md",
      render: (_, record) => {
        const disabled = subscriptionLooksCancelled(record.subscriptionStatus);
        const loading = cancellingSerial === record.deviceSerial;
        const undoLoading = undoingSerial === record.deviceSerial;
        const showUndoCancel = canShowUndoCancel(record.subscriptionStatus);

        return (
          <div className="flex flex-wrap items-center gap-1">
            {disabled ? (
              <Button type="link" danger size="small" disabled>
                Cancel
              </Button>
            ) : (
              <Popconfirm
                title="Cancel subscription?"
                description="This will cancel the subscription for this vehicle."
                okText="Yes, cancel"
                cancelText="No"
                onConfirm={() => handleCancelSubscription(record)}
              >
                <Button type="link" danger size="small" loading={loading}>
                  Cancel
                </Button>
              </Popconfirm>
            )}
            {showUndoCancel && (
              <Popconfirm
                title="Undo cancellation?"
                description="This will restore the subscription for this vehicle."
                okText="Yes, undo"
                cancelText="No"
                onConfirm={() => handleUndoCancelSubscription(record)}
              >
                <Button type="link" size="small" loading={undoLoading}>
                  Undo Cancel
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  const onExpandPanel = (key) => {
    if (expandPanel.length == 1) {
      //setExpandPanel([]);
    } else {
      setExpandPanel([1]);
    }
  };

  const getData = (email) => {
    if (!formData.email) {
      message.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    getDataByEmail(email).then((res) => {
      setIsLoading(false);

      if (res?.vehicles?.length == 0) {
        message.error("No data found for this email address");
        return;
      }
      setData(res.vehicles);
      setFilteredData(res.vehicles);
    });
  };

  //search
  const onFilterData = (text) => {
    text = text.toLowerCase();
    if (text == "") {
      setFilteredData(data);
    } else {
      const newData = data?.filter((d) => {
        return (
          d?.deviceSerial?.toLowerCase().includes(text) ||
          d?.carName?.toLowerCase().includes(text)
        );
      });

      setFilteredData(newData);
    }
  };

  // Handle form submission
  const onFinish = async (values) => {
    try {
      // Set the saving state to true to show the loading indicator
      setIsSaving(true);

      console.log(values, "values");
      // Convert the DatePicker value to Unix timestamp if it exists
      if (values.freeTrialEndDate) {
        values.freeTrialEndDate = Math.floor(
          values.freeTrialEndDate.valueOf() / 1000,
        );
      }

      values.billingDate = values.freeTrialEndDate;
      values.subscriptionStatus = "FREE_TRIAL";

      // Here you would typically make an API call to save the data
      let body = {
        email: values.email,
        deviceSerial: values.deviceSerial,
        vehicle: values,
      };

      let _result = await updateFreeTrialStatus(body);
      console.log(_result, "result");
      console.log(body, "body");

      // Update the data in the local state
      const updatedData = data.map((item) => {
        if (item.deviceSerial === formData.deviceSerial) {
          return { ...item, ...values };
        }
        return item;
      });

      setData(updatedData);
      setFilteredData(updatedData);

      message.success("Data saved successfully");
    } catch (error) {
      console.error("Error saving data:", error);
      message.error("Failed to save data. Please try again.");
    } finally {
      // Set the saving state back to false whether the operation succeeds or fails
      setIsSaving(false);
    }
  };

  // Handle DatePicker onChange separately
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      freeTrialEndDate: date,
    });
  };

  //useEffect for page load
  useEffect(() => {}, []);

  return (
    <div>
      {isLoading && <LoadingSpinner message="Loading data..." />}
      {!isLoading && (
        <div className=" bg-gray-100 flex flex-col items-center justify-center ">
          <div className="bg-white rounded-lg shadow-lg p-8 m-4 w-full max-w-[calc(100vw-32px)] h-[calc(100vh-100px)] flex flex-col">
            <h2 className="text-xl font-semibold mb-4">
              Free Trial Management
            </h2>
            <Collapse
              className="bg-indigo-50 mb-3 sm:min-h-[30px] overflow-auto"
              size="small"
              activeKey={expandPanel}
              onChange={() => {
                if (expandPanel.length == 1) {
                  setExpandPanel([]);
                } else {
                  setExpandPanel([1]);
                }
              }}
              collapsible="icon"
              items={[
                {
                  key: "1",
                  label: "Vehicle Details",
                  children: (
                    <>
                      <Form
                        row
                        size="medium"
                        ref={formRef}
                        layout="vertical"
                        onFinish={onFinish}
                        initialValues={formData}
                        className="text-xs md:text-sm"
                      >
                        <Row gutter={[16, 4]}>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item label="Email" name="email">
                              <Input
                                type="email"
                                placeholder="Enter Email"
                                style={{ marginBottom: 2 }}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    email: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              label="Device Serial"
                              name="deviceSerial"
                            >
                              <Input
                                type="text"
                                placeholder="Enter Device Serial"
                                readOnly
                                style={{ marginBottom: 2 }}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    email: e.target.value,
                                  });
                                }}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item
                              label="Free Trial Expiry"
                              name="freeTrialEndDate"
                            >
                              <DatePicker
                                style={{ width: "100%", marginBottom: 2 }}
                                format="MM/DD/YYYY"
                                onChange={handleDateChange}
                                disabledDate={(current) =>
                                  current && current < dayjs().startOf("day")
                                }
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row>
                          <Col>
                            <Button
                              type="primary"
                              onClick={() => {
                                getData(formData.email);
                              }}
                              className="mr-3 bg-indigo-600 hover:bg-indigo-700"
                            >
                              Get Data
                            </Button>
                            <Button
                              type="primary"
                              htmlType="submit"
                              loading={isSaving}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                          </Col>
                        </Row>
                      </Form>
                    </>
                  ),
                },
              ]}
            />
            {/* Duplicate Devices */}
            {duplicateData.length > 0 && (
              <Collapse
                className="ant-collapse ant-collapse-icon-position-start ant-collapse-small bg-indigo-50 mb-3 min-h-[40px] overflow-hidden"
                size="small"
                collapsible="icon"
                items={[
                  {
                    key: "1",
                    label: `Duplicate Devices (${duplicateData.length})`,
                    children: (
                      <>
                        <Table
                          size="small"
                          dataSource={duplicateData}
                          columns={columns}
                          pagination={false}
                          scroll={{ y: 180 }}
                        />
                      </>
                    ),
                  },
                ]}
              ></Collapse>
            )}

            {/* Table Container - Ensure it grows and doesn't overflow */}
            <div className="flex-grow min-h-0 overflow-auto">
              <hr className="border-indigo-200" />
              <Search
                className="mt-3"
                placeholder="input search text"
                onSearch={(value) => onFilterData(value)}
              />
              <Table
                size="small"
                dataSource={filteredData}
                columns={columns}
                pagination={false}
                scroll={{ y: 350 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Management;
