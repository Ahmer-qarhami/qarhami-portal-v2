import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Checkbox,
  Pagination,
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
import {
  uploadData,
  getAllDevices,
  assignEmailToDevices,
  deactivateDeviceSIM,
  reactivateDeviceSIM,
} from "../api/Devices";

const SEARCH_DEBOUNCE_MS = 250;
const MOBILE_PAGE_SIZE = 30;
const SELECTION_COL_WIDTH = 48;
const TABLE_X = 1120;

function buildSearchIndex(device) {
  return [
    device?.deviceSerial,
    device?.imei,
    device?.iccid,
    device?.status,
    device?.simStatus,
    device?.email,
    device?.fullName,
    device?.vin,
    device?.carName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function indexDevices(items) {
  return (items || []).map((d) => ({
    ...d,
    key: d.deviceSerial,
    _searchText: buildSearchIndex(d),
  }));
}

/** Pure filter used for table rows; keeps behavior consistent with useEffect + handlers. */
function filterDevices(items, text, selectedStatus) {
  const normalizedText = (text || "").trim().toLowerCase();
  return (items || []).filter((d) => {
    const matchesSearch =
      normalizedText === "" ||
      (d._searchText || buildSearchIndex(d)).includes(normalizedText);

    const deviceStatus = d?.simStatus || d?.status;
    const matchesStatus =
      selectedStatus === "ALL" || deviceStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });
}

const isDeviceDeactivated = (record) =>
  record?.simStatus === "DEACTIVATED" || record?.status === "DEACTIVATED";

const Home = () => {
  const isDesktop = useIsDesktop();
  const [data, setData] = useState([]);
  const [expandPanel, setExpandPanel] = useState([]);
  const [duplicateData, setDuplicateData] = useState([]);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const formRef = useRef(null);
  const tableWrapRef = useRef(null);
  const dataRef = useRef([]);
  const simActionRef = useRef({ deactivate: () => {}, reactivate: () => {} });
  const [tableY, setTableY] = useState(480);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [assignEmail, setAssignEmail] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedSerials, setSelectedSerials] = useState([]);
  const [mobilePage, setMobilePage] = useState(1);

  // Stable column defs so virtualized rows are not remounted on each keystroke.
  const columns = useMemo(
    () => [
      {
        title: "Serial",
        dataIndex: "deviceSerial",
        key: "deviceSerial",
        width: 128,
        clickable: true,
        className: "link-column text-xs md:text-md",
        sorter: (a, b) =>
          (a.deviceSerial || "").localeCompare(b.deviceSerial || ""),
        render: (text) => (
          <a
            onClick={() => {
              const _formData = dataRef.current.find(
                (d) => d.deviceSerial == text
              );
              setFormData(_formData);
              formRef.current?.setFieldsValue(_formData);
              setExpandPanel((prev) => (prev.length === 1 ? prev : [1]));
            }}
          >
            {text}
          </a>
        ),
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        ellipsis: true,
        className: "text-xs md:text-md",
        sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
      },
      {
        title: "IMEI",
        dataIndex: "imei",
        key: "imei",
        width: 148,
        clickable: true,
        className: "text-xs md:text-md",
        sorter: (a, b) => (a.imei || "").localeCompare(b.imei || ""),
      },
      {
        title: "ICCID",
        dataIndex: "iccid",
        key: "iccid",
        width: 188,
        className: "text-xs md:text-md",
        sorter: (a, b) => (a.iccid || "").localeCompare(b.iccid || ""),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 168,
        className: "text-xs md:text-md",
        sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      },
      {
        title: "Action",
        key: "action",
        width: 118,
        className: "text-xs md:text-md",
        render: (_, record) => {
          const isDeactivated = isDeviceDeactivated(record);

          if (isDeactivated) {
            return (
              <Button
                size="small"
                type="primary"
                onClick={() =>
                  simActionRef.current.reactivate(record?.deviceSerial)
                }
              >
                Reactivate
              </Button>
            );
          }

          return (
            <Button
              size="small"
              danger
              onClick={() =>
                simActionRef.current.deactivate(record?.deviceSerial)
              }
            >
              Deactivate
            </Button>
          );
        },
      },
    ],
    []
  );

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
    setSearchInput(text || "");
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

      _data = indexDevices([..._selectedDevices, ..._data]);

      setData(_data);

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

  const toggleSelectedSerial = (serial, checked) => {
    if (!serial) return;
    setSelectedSerials((prev) => {
      if (checked) {
        return prev.includes(serial) ? prev : [...prev, serial];
      }
      return prev.filter((item) => item !== serial);
    });
  };

  const refreshDevicesAfterSimAction = async (touchedSerials = []) => {
    const raw = await getAllDevices();
    const list = Array.isArray(raw) ? raw : [];
    const refreshedData = indexDevices(list);

    setSearchInput("");
    setSearchText("");
    setStatusFilter("ALL");
    setData(refreshedData);
    setSelectedSerials([]);
    setFormData((prev) => {
      if (!prev?.deviceSerial || !touchedSerials.includes(prev.deviceSerial)) {
        return prev;
      }
      const row = refreshedData.find((d) => d.deviceSerial === prev.deviceSerial);
      return row ? { ...prev, ...row } : prev;
    });
  };

  const runBulkSimAction = async (serials, mode) => {
    const uniqueSerials = [...new Set((serials || []).map((s) => String(s || "").trim()).filter(Boolean))];
    if (uniqueSerials.length === 0) {
      message.error("Please select at least one device");
      return;
    }

    const isDeactivate = mode === "deactivate";
    const preview =
      uniqueSerials.length <= 8
        ? uniqueSerials.join(", ")
        : `${uniqueSerials.slice(0, 8).join(", ")} … (+${uniqueSerials.length - 8} more)`;

    confirm({
      title: isDeactivate ? "Deactivate device SIMs?" : "Reactivate device SIMs?",
      content: `Do you want to ${isDeactivate ? "deactivate" : "reactivate"} ${uniqueSerials.length} device(s)? ${preview}`,
      okText: isDeactivate ? "Yes, Deactivate" : "Yes, Reactivate",
      cancelText: "Cancel",
      okType: isDeactivate ? "danger" : "primary",
      onOk: async () => {
        try {
          setIsLoading(true);
          const result = isDeactivate
            ? await deactivateDeviceSIM(uniqueSerials)
            : await reactivateDeviceSIM(uniqueSerials);
          if (!result?.success) {
            message.error(
              result?.message ||
                result?.warning ||
                `Failed to ${isDeactivate ? "deactivate" : "reactivate"} selected SIMs`
            );
            return;
          }
          message.success(
            result.message ||
              `SIM ${isDeactivate ? "deactivated" : "reactivated"} for ${uniqueSerials.length} device(s)`
          );
          await refreshDevicesAfterSimAction(uniqueSerials);
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
                `Failed to ${isDeactivate ? "deactivate" : "reactivate"} device SIM`
            );
          }
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  const handleDeactivateDeviceSIM = async (serialFromRow) => {
    const selectedSerial = resolveDeviceSerial(serialFromRow);
    if (!selectedSerial) {
      message.error("Please select a device serial first");
      return;
    }
    await runBulkSimAction([selectedSerial], "deactivate");
  };

  const handleReactivateDeviceSIM = async (serialFromRow) => {
    const selectedSerial = resolveDeviceSerial(serialFromRow);
    if (!selectedSerial) {
      message.error("Please select a device serial first");
      return;
    }
    await runBulkSimAction([selectedSerial], "reactivate");
  };

  dataRef.current = data;
  simActionRef.current = {
    deactivate: handleDeactivateDeviceSIM,
    reactivate: handleReactivateDeviceSIM,
  };

  const handleBulkDeactivateSelected = () => {
    const targets = data.filter(
      (d) =>
        selectedSerials.includes(d.deviceSerial) && !isDeviceDeactivated(d)
    );
    if (targets.length === 0) {
      message.error("Select one or more active devices to deactivate");
      return;
    }
    runBulkSimAction(
      targets.map((d) => d.deviceSerial),
      "deactivate"
    );
  };

  const handleBulkReactivateSelected = () => {
    const targets = data.filter(
      (d) =>
        selectedSerials.includes(d.deviceSerial) && isDeviceDeactivated(d)
    );
    if (targets.length === 0) {
      message.error("Select one or more deactivated devices to reactivate");
      return;
    }
    runBulkSimAction(
      targets.map((d) => d.deviceSerial),
      "reactivate"
    );
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
          setData(indexDevices(_newData));

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
        setData(indexDevices(Array.isArray(res) ? res : []));
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
    const timer = setTimeout(() => {
      setSearchText(searchInput);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setMobilePage(1);
  }, [searchText, statusFilter]);

  const filteredData = useMemo(
    () => filterDevices(data, searchText, statusFilter),
    [data, searchText, statusFilter]
  );

  const deviceSelectOptions = useMemo(
    () =>
      (data || []).map((device) => ({
        value: device.deviceSerial,
        label: device.deviceSerial,
      })),
    [data]
  );

  const totalDeviceCount = data?.length || 0;
  const visibleDeviceCount = filteredData?.length || 0;
  const visibleSerials = useMemo(
    () => (filteredData || []).map((d) => d?.deviceSerial).filter(Boolean),
    [filteredData]
  );
  const selectedSerialSet = useMemo(
    () => new Set(selectedSerials),
    [selectedSerials]
  );
  const allVisibleSelected =
    visibleSerials.length > 0 &&
    visibleSerials.every((serial) => selectedSerialSet.has(serial));
  const { selectedActiveCount, selectedDeactivatedCount } = useMemo(() => {
    let active = 0;
    let deactivated = 0;
    for (const d of data || []) {
      if (!selectedSerialSet.has(d.deviceSerial)) continue;
      if (isDeviceDeactivated(d)) deactivated += 1;
      else active += 1;
    }
    return {
      selectedActiveCount: active,
      selectedDeactivatedCount: deactivated,
    };
  }, [data, selectedSerialSet]);
  const availableStatuses = useMemo(
    () => [
      "ALL",
      ...new Set(
        (data || [])
          .map((d) => d?.simStatus || d?.status)
          .filter((status) => !!status)
      ),
    ],
    [data]
  );
  const mobilePageItems = useMemo(() => {
    const start = (mobilePage - 1) * MOBILE_PAGE_SIZE;
    return filteredData.slice(start, start + MOBILE_PAGE_SIZE);
  }, [filteredData, mobilePage]);

  useEffect(() => {
    if (!isDesktop || initialLoading || filteredData.length === 0) return;
    const el = tableWrapRef.current;
    if (!el) return;

    const update = () => {
      const next = Math.floor(el.clientHeight);
      setTableY((prev) => (next >= 160 && next !== prev ? next : prev));
    };

    update();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [isDesktop, initialLoading, filteredData.length === 0]);

  const toggleSelectAllVisible = (checked) => {
    setSelectedSerials((prev) => {
      if (checked) {
        return [...new Set([...prev, ...visibleSerials])];
      }
      return prev.filter((serial) => !visibleSerials.includes(serial));
    });
  };

  const rowSelection = useMemo(
    () => ({
      columnWidth: SELECTION_COL_WIDTH,
      selectedRowKeys: selectedSerials,
      preserveSelectedRowKeys: true,
      onChange: (keys) =>
        setSelectedSerials((keys || []).map(String).filter(Boolean)),
    }),
    [selectedSerials]
  );

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
                <Checkbox
                  checked={selectedSerialSet.has(record.deviceSerial)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleSelectedSerial(record.deviceSerial, e.target.checked);
                  }}
                >
                  Select
                </Checkbox>
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
                            tableLayout="fixed"
                            className="device-table"
                            rowKey="deviceSerial"
                            rowSelection={rowSelection}
                            dataSource={duplicateData}
                            columns={columns}
                            pagination={false}
                            scroll={{ y: 180, x: TABLE_X }}
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
            <div className="flex flex-col flex-grow min-h-0">
              <hr className="border-indigo-200" />
              <div className="mt-3 mb-3 flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                <Search
                  className="w-full"
                  placeholder="Search serial, IMEI, ICCID, email, VIN..."
                  value={searchInput}
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
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center shrink-0">
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={
                    !allVisibleSelected &&
                    visibleSerials.some((serial) =>
                      selectedSerialSet.has(serial)
                    )
                  }
                  disabled={visibleSerials.length === 0}
                  onChange={(e) => toggleSelectAllVisible(e.target.checked)}
                >
                  Select visible ({visibleDeviceCount})
                </Checkbox>
                <span className="text-sm text-gray-600">
                  {selectedSerials.length} selected
                  {selectedSerials.length > 0
                    ? ` · ${selectedActiveCount} active · ${selectedDeactivatedCount} deactivated`
                    : ""}
                </span>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <Button
                    danger
                    disabled={selectedActiveCount === 0}
                    onClick={handleBulkDeactivateSelected}
                  >
                    Deactivate selected ({selectedActiveCount})
                  </Button>
                  <Button
                    type="primary"
                    disabled={selectedDeactivatedCount === 0}
                    onClick={handleBulkReactivateSelected}
                  >
                    Reactivate selected ({selectedDeactivatedCount})
                  </Button>
                  <Button
                    disabled={selectedSerials.length === 0}
                    onClick={() => setSelectedSerials([])}
                  >
                    Clear selection
                  </Button>
                </div>
              </div>
              {initialLoading ? (
                <Skeleton active />
              ) : filteredData.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                  No devices found.
                </div>
              ) : isDesktop ? (
                <div ref={tableWrapRef} className="flex-1 min-h-[20rem]">
                  <Table
                    size="small"
                    virtual
                    tableLayout="fixed"
                    className="device-table"
                    rowKey="deviceSerial"
                    rowSelection={rowSelection}
                    dataSource={filteredData}
                    columns={columns}
                    pagination={false}
                    scroll={{ x: TABLE_X, y: tableY }}
                  />
                </div>
              ) : (
                <>
                  {renderDeviceCards(mobilePageItems)}
                  {filteredData.length > MOBILE_PAGE_SIZE && (
                    <div className="mt-3 flex justify-center">
                      <Pagination
                        current={mobilePage}
                        pageSize={MOBILE_PAGE_SIZE}
                        total={filteredData.length}
                        onChange={setMobilePage}
                        showSizeChanger={false}
                        size="small"
                      />
                    </div>
                  )}
                </>
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
                  options={deviceSelectOptions}
                  optionFilterProp="label"
                  showSearch
                  maxTagCount="responsive"
                />
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
    </div>
  );
};

export default Home;
