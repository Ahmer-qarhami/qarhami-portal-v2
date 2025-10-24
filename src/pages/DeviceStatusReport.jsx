import React, { useEffect, useState } from "react";
import { Button, Table, message, Input } from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import { getAllActiveDevices } from "../api/Devices";
import * as XLSX from "xlsx";

const DeviceStatusReport = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to format Unix timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(Number(timestamp * 1000));
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Table columns
  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.email || "").localeCompare(b.email || ""),
    },
    {
      title: "VIN",
      dataIndex: "vin",
      key: "vin",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.vin || "").localeCompare(b.vin || ""),
    },
    {
      title: "Car Name",
      dataIndex: "carName",
      key: "carName",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a.carName || "").localeCompare(b.carName || ""),
    },
    {
      title: "Plate Number",
      dataIndex: "plateNumber",
      key: "plateNumber",
      className: "text-xs md:text-md",
      sorter: (a, b) =>
        (a.plateNumber || "").localeCompare(b.plateNumber || ""),
    },
    {
      title: "Device Serial",
      dataIndex: "deviceSerial",
      key: "deviceSerial",
      className: "text-xs md:text-md",
      sorter: (a, b) =>
        (a.deviceSerial || "").localeCompare(b.deviceSerial || ""),
    },
    {
      title: "Device Status",
      dataIndex: "deviceStatus",
      key: "deviceStatus",
      className: "text-xs md:text-md",
      sorter: (a, b) =>
        (a.deviceStatus || "").localeCompare(b.deviceStatus || ""),
    },
    {
      title: "Subscription Status",
      dataIndex: "subscriptionStatus",
      key: "subscriptionStatus",
      className: "text-xs md:text-md",
      sorter: (a, b) =>
        (a.subscriptionStatus || "").localeCompare(b.subscriptionStatus || ""),
    },
    {
      title: "Free Trial End Date",
      dataIndex: "freeTrialEndDate",
      key: "freeTrialEndDate",
      className: "text-xs md:text-md",
      render: (text) => formatDate(text),
      sorter: (a, b) => (a.freeTrialEndDate || 0) - (b.freeTrialEndDate || 0),
    },
  ];

  const runReport = async () => {
    setIsLoading(true);
    try {
      const response = await getAllActiveDevices();
      if (response && Array.isArray(response)) {
        setData(response);
        setFilteredData(response);
      } else {
        message.error("Failed to fetch device data");
      }
    } catch (error) {
      console.error("Error fetching device data:", error);
      message.error("Failed to fetch device data");
    } finally {
      setIsLoading(false);
    }
  };

  // Search function
  const onFilterData = (text) => {
    text = text.toLowerCase();
    if (text === "") {
      setFilteredData(data);
    } else {
      const newData = data?.filter((d) => {
        return (
          d?.email?.toLowerCase().includes(text) ||
          d?.vin?.toLowerCase().includes(text) ||
          d?.carName?.toLowerCase().includes(text) ||
          d?.plateNumber?.toLowerCase().includes(text) ||
          d?.deviceSerial?.toLowerCase().includes(text) ||
          d?.deviceStatus?.toLowerCase().includes(text) ||
          d?.subscriptionStatus?.toLowerCase().includes(text) ||
          formatDate(d?.freeTrialEndDate)?.toLowerCase().includes(text)
        );
      });
      setFilteredData(newData);
    }
  };

  // Export functions
  const exportToExcel = (dataToExport, filename) => {
    // Prepare data for export with formatted dates
    const exportData = dataToExport.map((item) => ({
      Email: item.email,
      VIN: item.vin,
      "Car Name": item.carName,
      "Plate Number": item.plateNumber,
      "Device Serial": item.deviceSerial,
      "Device Status": item.deviceStatus,
      "Subscription Status": item.subscriptionStatus,
      "Free Trial End Date": formatDate(item.freeTrialEndDate),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Device Status Report");
    XLSX.writeFile(workbook, filename);
  };

  const exportAllRecords = () => {
    if (data.length === 0) {
      message.warning("No data to export");
      return;
    }
    exportToExcel(data, "device_status_report_all.xlsx");
    message.success("All records exported successfully");
  };

  const exportFilteredRecords = () => {
    if (filteredData.length === 0) {
      message.warning("No filtered data to export");
      return;
    }
    exportToExcel(filteredData, "device_status_report_filtered.xlsx");
    message.success("Filtered records exported successfully");
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8 m-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Device Status Report</h2>
          {data.length > 0 && (
            <div className="text-sm text-gray-600">
              {filteredData.length !== data.length ? (
                <span>
                  Filtered Devices: {filteredData.length} / {data.length}
                </span>
              ) : (
                <span>All Devices: {data.length}</span>
              )}
            </div>
          )}
        </div>

        {/* Upper div with buttons */}
        <div className="mb-4 flex gap-2">
          <Button
            type="primary"
            onClick={runReport}
            loading={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? "Running Report..." : "RUN REPORT"}
          </Button>
          {data.length > 0 && (
            <Button
              type="default"
              onClick={exportAllRecords}
              icon={<DownloadOutlined />}
              className="border-indigo-600 text-indigo-600 hover:border-indigo-700 hover:text-indigo-700"
            >
              Export All
            </Button>
          )}
          {filteredData.length > 0 && filteredData.length !== data.length && (
            <Button
              type="default"
              onClick={exportFilteredRecords}
              icon={<DownloadOutlined />}
              className="border-green-600 text-green-600 hover:border-green-700 hover:text-green-700"
            >
              Export Filtered
            </Button>
          )}
        </div>

        {/* Table for data */}
        <div className="flex-grow min-h-0 overflow-auto">
          <Input
            placeholder="Search all columns..."
            prefix={<SearchOutlined />}
            onChange={(e) => onFilterData(e.target.value)}
            className="mb-3"
            allowClear
          />
          <Table
            size="small"
            dataSource={filteredData}
            columns={columns}
            pagination={false}
            scroll={{ y: 500 }}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default DeviceStatusReport;
