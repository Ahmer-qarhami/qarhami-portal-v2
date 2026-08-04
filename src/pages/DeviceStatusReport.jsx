import React, { useState } from "react";
import { Button, Table, message, Input } from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageContainer from "../components/PageContainer.jsx";
import ResponsiveDataCard from "../components/ResponsiveDataCard.jsx";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { getAllActiveDevices } from "../api/Devices";
import { tableScroll } from "../utils/responsive";
import * as XLSX from "xlsx";

const DeviceStatusReport = () => {
  const isDesktop = useIsDesktop();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(Number(timestamp * 1000));
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

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

  const exportToExcel = (dataToExport, filename) => {
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

  const countLabel =
    data.length > 0 ? (
      <span className="text-sm text-gray-600">
        {filteredData.length !== data.length
          ? `Filtered Devices: ${filteredData.length} / ${data.length}`
          : `All Devices: ${data.length}`}
      </span>
    ) : null;

  const renderCards = () => (
    <div className="grid grid-cols-1 gap-4">
      {filteredData.map((record, index) => (
        <ResponsiveDataCard
          key={record.deviceSerial || record.vin || index}
          title={record.carName || record.deviceSerial || "Vehicle"}
          subtitle={record.email || "No email"}
          status={record.deviceStatus || "Unknown"}
          statusColor="blue"
          rows={[
            { label: "VIN", value: record.vin || "-" },
            { label: "Plate Number", value: record.plateNumber || "-" },
            { label: "Device Serial", value: record.deviceSerial || "-" },
            {
              label: "Subscription Status",
              value: record.subscriptionStatus || "-",
            },
            {
              label: "Free Trial End Date",
              value: formatDate(record.freeTrialEndDate),
            },
          ]}
        />
      ))}
    </div>
  );

  return (
  <>
    {isLoading && <LoadingSpinner message="Running report..." />}
    <PageContainer
      title="Device Status Report"
      actions={
        <>
          {countLabel}
          <Button
            type="primary"
            onClick={runReport}
            loading={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
          >
            {isLoading ? "Running Report..." : "RUN REPORT"}
          </Button>
          {data.length > 0 && (
            <Button
              type="default"
              onClick={exportAllRecords}
              icon={<DownloadOutlined />}
              className="border-indigo-600 text-indigo-600 hover:border-indigo-700 hover:text-indigo-700 w-full sm:w-auto"
            >
              Export All
            </Button>
          )}
          {filteredData.length > 0 && filteredData.length !== data.length && (
            <Button
              type="default"
              onClick={exportFilteredRecords}
              icon={<DownloadOutlined />}
              className="border-green-600 text-green-600 hover:border-green-700 hover:text-green-700 w-full sm:w-auto"
            >
              Export Filtered
            </Button>
          )}
        </>
      }
    >
      <div className="flex-grow min-h-0 overflow-auto">
        <Input
          placeholder="Search all columns..."
          prefix={<SearchOutlined />}
          onChange={(e) => onFilterData(e.target.value)}
          className="mb-3 w-full"
          allowClear
        />
        {filteredData.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No report data available.
          </div>
        ) : isDesktop ? (
          <Table
            size="small"
            dataSource={filteredData}
            columns={columns}
            pagination={false}
            scroll={tableScroll}
            loading={isLoading}
          />
        ) : (
          renderCards()
        )}
      </div>
    </PageContainer>
  </>
  );
};

export default DeviceStatusReport;
