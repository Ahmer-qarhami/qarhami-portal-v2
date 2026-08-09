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
  Modal,
  Select,
  Skeleton,
} from "antd";
const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;
import { ExcelToJson } from "../utils/ExcelReader";
import "../App.css";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageContainer from "../components/PageContainer.jsx";
import ResponsiveDataCard from "../components/ResponsiveDataCard.jsx";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { tableScroll } from "../utils/responsive";
import {
  uploadData,
  getAllDevices,
  assignEmailToDevices,
  deactivateDeviceSIM,
  reactivateDeviceSIM,
} from "../api/Devices";

/** Pure filter used for table rows; keeps behavior consistent with useEffect + handlers. */
function filterDevices(items, text, selectedStatus) {
  const normalizedText = (text || "").toLowerCase();
  return (items || []).filter((d) => {
    const matchesSearch =
      normalizedText === "" ||
      d?.deviceSerial?.toLowerCase().includes(normalizedText) ||
      d?.imei?.toLowerCase().includes(normalizedText) ||
      d?.iccid?.toLowerCase().includes(normalizedText) ||
      d?.status?.toLowerCase().includes(normalizedText) ||
      d?.email?.toLowerCase().includes(normalizedText) ||
      d?.fullName?.toLowerCase().includes(normalizedText) ||
      d?.vin?.toLowerCase().includes(normalizedText) ||
      d?.carName?.toLowerCase().includes(normalizedText);

    const deviceStatus = d?.simStatus || d?.status;
    const matchesStatus =
      selectedStatus === "ALL" || deviceStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });
}

const Home = () => {
  const isDesktop = useIsDesktop();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [expandPanel, setExpandPanel] = useState([]);
  const [duplicateData, setDuplicateData] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const formRef = React.createRef();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [assignEmail, setAssignEmail] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  //table columns
  const columns = [
    {
      title: "Serial",
      dataIndex: "deviceSerial",
      key: "deviceSerial",
      clickable: true,
      className: "link-column text-xs md:text-md",
      sorter: (a, b) => (a.deviceSerial || "").localeCompare(b.deviceSerial || ""),

      render: (text, record) => {
        return (
          <a
            onClick={() => {
              //setting form data
              const _formData = data.find((d) => d.deviceSerial == text);
              setFormData(_formData);
              formRef?.current?.setFieldsValue(_formData);

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
      title: "Email",
      dataIndex: "email",
      key: "email",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: "IMEI",
      dataIndex: "imei",
      key: "imei",
      clickable: true,
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.imei || "").localeCompare(b.imei || ""),
    },
    {
      title: "ICCID",
      dataIndex: "iccid",
      key: "iccid",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.iccid || "").localeCompare(b.iccid || ""),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Action",
      key: "action",
      className: "text-xs md:text-md",
      render: (_, record) => {
        const isDeactivated =
          record?.simStatus === "DEACTIVATED" ||
          record?.status === "DEACTIVATED";

        if (isDeactivated) {
          return (
            <Button
              size="small"
              type="primary"
              onClick={() => handleReactivateDeviceSIM(record?.deviceSerial)}
            >
              Reactivate
            </Button>
          );
        }

        return (
          <Button
            size="small"
            danger
            onClick={() => handleDeactivateDeviceSIM(record?.deviceSerial)}
          >
            Deactivate
          </Button>
        );
      },
    },
  ];

  const uploadSuccessful = () => {
    message.success("Data Uploaded Successfully");
  };

  const onExpandPanel = (key) => {
    if (expandPanel.length == 1) {
      //setExpandPanel([]);
    } else {
      setExpandPanel([1]);
    }
  };

  const onFilterData = (text) => {
    setSearchText(text || "");
  };

  const onStatusFilterChange = (value) => {
    setStatusFilter(value);
  };

  const onFinish = (values) => {};

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSelectedDevices([]);
    setAssignEmail("");
  };

  const handleAssignDevices = () => {
    if (!assignEmail || selectedDevices.length === 0) {
      message.error("Please select devices and enter an email address");
      return;
    }

    assignEmailToDevices({
      email: assignEmail,
      devices: selectedDevices,
      status: "INSTALLATION_PENDING",
    }).then((res) => {
      let _data = data.filter((d) => {
        return !selectedDevices.includes(d.deviceSerial);
      });

      let _selectedDevices = selectedDevices.map((d) => {
        let _device = data.find((i) => i.deviceSerial == d);
        return {
          ..._device,
          email: assignEmail,
          status: "INSTALLATION_PENDING",
        };
      });

      _data = [..._selectedDevices, ..._data];

      setData(_data);
      setFilteredData(_data);

      console.log(res);
    });

    // For now, just show a success message
    message.success(
      `Assigned ${selectedDevices.length} devices to ${assignEmail}`
    );
    handleCancel();
  };

  const resolveDeviceSerial = (serialCandidate) => {
    if (typeof serialCandidate === "string") {
      const trimmed = serialCandidate.trim();
      if (trimmed) return trimmed;
    }
    return formData?.deviceSerial?.trim?.() || "";
  };

  const handleDeactivateDeviceSIM = async (serialFromRow) => {
    const selectedSerial = resolveDeviceSerial(serialFromRow);

    if (!selectedSerial) {
      message.error("Please select a device serial first");
      return;
    }

    confirm({
      title: "Are you sure?",
      content: `Do you want to deactivate SIM for device ${selectedSerial}?`,
      okText: "Yes, Deactivate",
      cancelText: "Cancel",
      okType: "danger",
      onOk: async () => {
        try {
          setIsLoading(true);
          const result = await deactivateDeviceSIM([selectedSerial]);
          if (!result?.success) {
            message.error(
              result?.message ||
                result?.warning ||
                `Failed to deactivate SIM for ${selectedSerial}`
            );
            return;
          }
          message.success(
            result.message || `SIM deactivated for ${selectedSerial}`
          );

          const raw = await getAllDevices();
          const list = Array.isArray(raw) ? raw : [];
          const refreshedData = list.map((d) => ({
            ...d,
            key: d.deviceSerial,
          }));

          // Narrow filters (e.g. INSTALLATION_PENDING) would hide the newly deactivated row.
          setSearchText("");
          setStatusFilter("ALL");
          setData(refreshedData);
          setFormData((prev) => {
            if (prev?.deviceSerial !== selectedSerial) return prev;
            const row = refreshedData.find(
              (d) => d.deviceSerial === selectedSerial
            );
            return row ? { ...prev, ...row } : prev;
          });
        } catch (error) {
          if (
            error?.response?.status === 401 ||
            error?.message?.includes("missing JWT token")
          ) {
            message.error("Unauthorized. Please login again.");
          } else {
            message.error(
              error?.response?.data?.message ||
                error?.response?.data?.warning ||
                "Failed to deactivate device SIM"
            );
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleReactivateDeviceSIM = async (serialFromRow) => {
    const selectedSerial = resolveDeviceSerial(serialFromRow);

    if (!selectedSerial) {
      message.error("Please select a device serial first");
      return;
    }

    confirm({
      title: "Reactivate device?",
      content: `Do you want to reactivate SIM for device ${selectedSerial}?`,
      okText: "Yes, Reactivate",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          setIsLoading(true);
          const result = await reactivateDeviceSIM([selectedSerial]);
          if (!result?.success) {
            message.error(
              result?.message ||
                result?.warning ||
                `Failed to reactivate SIM for ${selectedSerial}`
            );
            return;
          }
          message.success(
            result.message || `SIM reactivated for ${selectedSerial}`
          );

          const raw = await getAllDevices();
          const list = Array.isArray(raw) ? raw : [];
          const refreshedData = list.map((d) => ({
            ...d,
            key: d.deviceSerial,
          }));

          // Reactivated rows leave statuses like DEACTIVATED; prior status filter would hide them
          // and the table looked "empty" or a single row. Show the full list again.
          setSearchText("");
          setStatusFilter("ALL");
          setData(refreshedData);
          setFormData((prev) => {
            if (prev?.deviceSerial !== selectedSerial) return prev;
            const row = refreshedData.find(
              (d) => d.deviceSerial === selectedSerial
            );
            return row ? { ...prev, ...row } : prev;
          });
        } catch (error) {
          if (
            error?.response?.status === 401 ||
            error?.message?.includes("missing JWT token")
          ) {
            message.error("Unauthorized. Please login again.");
          } else {
            message.error(
              error?.response?.data?.message ||
                error?.response?.data?.warning ||
                "Failed to reactivate device SIM"
            );
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleFileUpload = async (e) => {
    try {
      setIsLoading(true);

      const result = ExcelToJson(e.target.files[0], async (excelData) => {
        const body = excelData.map((item) => {
          if (item.SERIAL != null && item.SERIAL != "SERIAL") {
            return {
              createdBy: "ADMIN",
              createdAt: Date.now(),
              updatedBy: "ADMIN",
              updatedAt: Date.now(),
              deviceSerial: item?.SERIAL,
              imei: String(item?.IMEI),
              iccid: String(item?.ICCID),
              email: item?.EMAIL,
              fullName: item?.FULLNAME,
              vin: item?.VIN,
              carName: item?.CARNAME,
              year: item?.YEAR,
              make: item?.MAKE,
              model: item?.MODEL,
              manufacturer: "Geometris",
              status: item?.EMAIL ? "INSTALLATION_PENDING" : "INVENTORY",
            };
          }
        });

        uploadData(body).then((res) => {
          const newData = res?.map((d) => {
            return {
              ...d,
              key: d.deviceSerial,
            };
          });

          let _item = body[0];
          _item = {
            ..._item,
            key: _item.deviceSerial,
          };

          let _newData = data.filter(
            (i) => i.deviceSerial != _item.deviceSerial
          );

          _newData = [_item, ..._newData];

          uploadSuccessful();
          setData(_newData);
          setFilteredData(_newData);

          // getAllDevices().then((allData) => {

          //   uploadSuccessful();
          //   setData(allData);
          //   setFilteredData(allData);
          // });
          // setDuplicateData(newDuplicateData);
        });
        setIsLoading(false);
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  //useEffect for page load
  useEffect(() => {
    const fetchData = async () => {
      setInitialLoading(true);
      try {
        const res = await getAllDevices();
        const newData = res?.map((d) => {
          return {
            ...d,
            key: d.deviceSerial,
          };
        });
        setData(newData);
        setFilteredData(newData);
        setFormData({
          deviceSerial: "",
          imei: "",
          iccid: "",
          status: "",
        });
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setFilteredData(filterDevices(data, searchText, statusFilter));
  }, [data, searchText, statusFilter]);

  const totalDeviceCount = data?.length || 0;
  const visibleDeviceCount = filteredData?.length || 0;
  const availableStatuses = [
    "ALL",
    ...new Set(
      (data || [])
        .map((d) => d?.simStatus || d?.status)
        .filter((status) => !!status)
    ),
  ];

  const renderDeviceCards = (items) => (
    <div className="grid grid-cols-1 gap-4">
      {items.map((record) => {
        const isDeactivated =
          record?.simStatus === "DEACTIVATED" ||
          record?.status === "DEACTIVATED";

        return (
          <ResponsiveDataCard
            key={record.key || record.deviceSerial}
            title={record.deviceSerial || "Unknown Serial"}
            subtitle={record.carName || record.email || "No linked account"}
            status={record.simStatus || record.status || "Unknown"}
            statusColor={isDeactivated ? "red" : "blue"}
            onClick={() => {
              setFormData(record);
              formRef?.current?.setFieldsValue(record);
              onExpandPanel(record.deviceSerial);
            }}
            rows={[
              { label: "Email", value: record.email || "-" },
              { label: "IMEI", value: record.imei || "-" },
              { label: "ICCID", value: record.iccid || "-" },
              { label: "VIN", value: record.vin || "-" },
            ]}
            actions={
              <>
                {isDeactivated ? (
                  <Button
                    type="primary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReactivateDeviceSIM(record?.deviceSerial);
                    }}
                  >
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    danger
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeactivateDeviceSIM(record?.deviceSerial);
                    }}
                  >
                    Deactivate
                  </Button>
                )}
              </>
            }
          />
        );
      })}
    </div>
  );

  return (
    <div>
      {isLoading && <LoadingSpinner message="Loading devices..." />}
      {!isLoading && (
        <PageContainer title={`Device Table (${visibleDeviceCount}/${totalDeviceCount})`}>
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
                  label: "Device Details",
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
                          {[
                            { label: "Serial", name: "deviceSerial" },
                            { label: "IMEI", name: "imei" },
                            { label: "ICCID", name: "iccid" },
                            { label: "Status", name: "status" },
                            { label: "Email", name: "email" },
                            // { label: "Full Name", name: "fullName" },
                            { label: "Car Name", name: "carName" },
                            { label: "VIN", name: "vin" },
                          ].map((field) => (
                            <Col key={field.name} xs={24} sm={12} md={8} lg={6}>
                              <Form.Item label={field.label} name={field.name}>
                                <Input
                                  placeholder={`Enter ${field.label}`}
                                  style={{ marginBottom: 2 }}
                                  readOnly
                                />
                              </Form.Item>
                            </Col>
                          ))}
                        </Row>
                      </Form>

                      {/* Add the Assign Devices button */}
                      <div className="flex flex-wrap gap-2 mb-3">
                      <Button
                        type="primary"
                        onClick={showModal}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Assign Devices to Email
                      </Button>
                      {formData?.simStatus === "DEACTIVATED" ||
                      formData?.status === "DEACTIVATED" ? (
                        <Button
                          type="primary"
                          onClick={() => handleReactivateDeviceSIM()}
                        >
                          Reactivate Device SIM
                        </Button>
                      ) : (
                        <Button
                          type="primary"
                          danger
                          onClick={() =>
                            handleDeactivateDeviceSIM(formData?.deviceSerial)
                          }
                        >
                          Deactivate Device SIM
                        </Button>
                      )}
                      <label
                        htmlFor="uploadFile"
                        className="inline-flex items-center text-sm cursor-pointer"
                      >
                        <span className="mr-2">Upload Excel File</span>
                      <input
                        className="max-w-full text-sm"
                        id="uploadFile"
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        onChange={handleFileUpload}
                        title="Upload Excel File"
                      />
                      </label>
                      </div>
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
                        {isDesktop ? (
                          <Table
                            size="small"
                            dataSource={duplicateData}
                            columns={columns}
                            pagination={false}
                            scroll={{ y: 180, x: "max-content" }}
                          />
                        ) : (
                          renderDeviceCards(duplicateData)
                        )}
                      </>
                    ),
                  },
                ]}
              ></Collapse>
            )}

            {/* Table Container - Ensure it grows and doesn't overflow */}
            <div className="flex-grow min-h-0 overflow-auto">
              <hr className="border-indigo-200" />
              <div className="mt-3 mb-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Search
                  className="w-full"
                  placeholder="input search text"
                  onSearch={(value) => onFilterData(value)}
                  allowClear
                  onChange={(e) => onFilterData(e.target.value)}
                />
                <Select
                  value={statusFilter}
                  onChange={onStatusFilterChange}
                  className="w-full sm:w-auto sm:min-w-[12rem]"
                >
                  {availableStatuses.map((status) => (
                    <Option key={status} value={status}>
                      {status}
                    </Option>
                  ))}
                </Select>
              </div>
              {initialLoading ? (
                <Skeleton active />
              ) : filteredData.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No devices found.
                </div>
              ) : isDesktop ? (
                <Table
                  size="small"
                  dataSource={filteredData}
                  columns={columns}
                  pagination={false}
                  scroll={tableScroll}
                />
              ) : (
                renderDeviceCards(filteredData)
              )}

              {/* <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-indigo-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Serial #
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      IMEI
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      ICCID
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.deviceSerial}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.imei}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.iccid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table> */}
            </div>

            {/* Modal for device assignment */}
            <Modal
              title="Assign Devices to Email"
              open={isModalVisible}
              onCancel={handleCancel}
              width="min(100%, 32rem)"
              footer={[
                <Button key="cancel" onClick={handleCancel}>
                  Cancel
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  onClick={handleAssignDevices}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Assign
                </Button>,
              ]}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Devices
                </label>
                <Select
                  mode="multiple"
                  placeholder="Select devices to assign"
                  value={selectedDevices}
                  onChange={setSelectedDevices}
                  style={{ width: "100%" }}
                  optionFilterProp="children"
                >
                  {data.map((device) => (
                    <Option
                      key={device.deviceSerial}
                      value={device.deviceSerial}
                    >
                      {device.deviceSerial}
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  placeholder="Enter email address"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                />
              </div>
            </Modal>
        </PageContainer>
      )}
    </div>
  );
};

export default Home;
