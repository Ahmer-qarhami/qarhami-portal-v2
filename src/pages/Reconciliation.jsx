import React, { useMemo, useRef, useState } from "react";
import { Button, Input, Select, Table, message } from "antd";
import { ExcelToJson } from "../utils/ExcelReader";
import { getAllDevices } from "../api/Devices";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const { Option } = Select;

const parseExpectedQty = (value) => {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) return value || "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
};

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const isEmailLike = (value) => String(value || "").includes("@");

const isNumericLike = (value) => {
  if (value === null || value === undefined) return false;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (cleaned === "") return false;
  return !Number.isNaN(Number(cleaned));
};

const pickRowValues = (row = {}) => {
  const entries = Object.entries(row).filter(([_, value]) => {
    const normalized = String(value ?? "").trim();
    return normalized !== "";
  });

  let qtyValue = null;
  let keyValue = "";
  let remarksValue = "";

  for (const [_, value] of entries) {
    if (qtyValue === null && isNumericLike(value)) {
      qtyValue = value;
      continue;
    }
    if (!keyValue) {
      keyValue = value;
      continue;
    }
    if (!remarksValue) {
      remarksValue = value;
    }
  }

  return {
    keyValue,
    qtyValue,
    remarksValue,
  };
};

const Reconciliation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [resultFilter, setResultFilter] = useState("ALL");
  const [emailFilter, setEmailFilter] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      const deviceData = await getAllDevices();
      const statusCountMap = (deviceData || []).reduce((acc, device) => {
        const key = normalizeKey(device?.simStatus || device?.status || "");
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const emailCountMap = (deviceData || []).reduce((acc, device) => {
        const key = normalizeKey(device?.email || "");
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      ExcelToJson(file, (excelRows) => {
        const parsedRows = (excelRows || [])
          .map((row, index) => {
            const { keyValue, qtyValue, remarksValue } = pickRowValues(row);
            const reconcileKey = normalizeKey(keyValue);
            const expectedQty = parseExpectedQty(qtyValue);
            const remarks = String(remarksValue || "").trim();
            const actualQty = isEmailLike(reconcileKey)
              ? emailCountMap[reconcileKey] || 0
              : statusCountMap[reconcileKey] || 0;
            const isMatched = expectedQty === actualQty;

            return {
              id: `${reconcileKey}-${index}`,
              reconcileKey,
              expectedQty,
              actualQty,
              remarks,
              result: isMatched ? "MATCHED" : "UNMATCHED",
            };
          })
          .filter((item) => item.reconcileKey);

        const matchedRows = parsedRows.filter(
          (item) => item.result === "MATCHED"
        ).length;
        if (parsedRows.length > 0 && matchedRows === 0) {
          message.warning(
            "No matched rows found. Please confirm key column values (email/status) match Device Master data."
          );
        }

        setRows(parsedRows);
        message.success("Reconciliation completed");
        setIsLoading(false);
      });
    } catch (error) {
      setIsLoading(false);
      message.error("Failed to process reconciliation");
    } finally {
      event.target.value = "";
    }
  };

  const filteredRows = useMemo(() => {
    const normalizedEmail = normalizeKey(emailFilter);
    return rows.filter((item) => {
      const matchesResult =
        resultFilter === "ALL" || item.result === resultFilter;
      const matchesEmail =
        normalizedEmail === "" || normalizeKey(item.reconcileKey).includes(normalizedEmail);
      return matchesResult && matchesEmail;
    });
  }, [rows, resultFilter, emailFilter]);

  const matchedCount = rows.filter((item) => item.result === "MATCHED").length;
  const unmatchedCount = rows.filter(
    (item) => item.result === "UNMATCHED"
  ).length;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const columns = [
    {
      title: "Key",
      dataIndex: "reconcileKey",
      key: "reconcileKey",
      className: "text-xs md:text-md",
      sorter: (a, b) =>
        String(a?.reconcileKey || "").localeCompare(String(b?.reconcileKey || "")),
    },
    {
      title: "Stripe",
      dataIndex: "expectedQty",
      key: "expectedQty",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a?.expectedQty || 0) - (b?.expectedQty || 0),
    },
    {
      title: "Qarhami",
      dataIndex: "actualQty",
      key: "actualQty",
      className: "text-xs md:text-md",
      sorter: (a, b) => (a?.actualQty || 0) - (b?.actualQty || 0),
    },
    {
      title: "Result",
      dataIndex: "result",
      key: "result",
      className: "text-xs md:text-md",
      sorter: (a, b) => String(a?.result || "").localeCompare(String(b?.result || "")),
    },
    {
      title: "Amount (USD)",
      dataIndex: "remarks",
      key: "remarks",
      className: "text-xs md:text-md",
      render: (value) => formatCurrency(value),
      sorter: (a, b) => {
        const left = Number(String(a?.remarks ?? "").replace(/,/g, "").trim());
        const right = Number(String(b?.remarks ?? "").replace(/,/g, "").trim());
        const normalizedLeft = Number.isFinite(left) ? left : 0;
        const normalizedRight = Number.isFinite(right) ? right : 0;
        return normalizedLeft - normalizedRight;
      },
    },
  ];

  return (
    <div className="bg-gray-100 flex flex-col items-center justify-center">
      {isLoading && <LoadingSpinner message="Reconciling with Device Master..." />}
      <div className="bg-white rounded-lg shadow-lg p-8 m-4 w-full max-w-[calc(100vw-32px)] h-[calc(100vh-100px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Stripe Reconciliation</h2>
          <div className="flex gap-3 items-center">
            <Input
              placeholder="Filter by email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              allowClear
              style={{ minWidth: 220 }}
            />
            <Select
              value={resultFilter}
              onChange={setResultFilter}
              style={{ minWidth: 180 }}
            >
              <Option value="ALL">All</Option>
              <Option value="MATCHED">Matched</Option>
              <Option value="UNMATCHED">Unmatched</Option>
            </Select>
            <Button
              type="primary"
              onClick={openFilePicker}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Upload Excel/CSV
            </Button>
            <input
              id="recon-upload"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <div className="mb-3 text-sm">
          <span className="mr-4">
            Matched: <strong className="text-green-700">{matchedCount}</strong>
          </span>
          <span>
            Unmatched: <strong className="text-red-700">{unmatchedCount}</strong>
          </span>
        </div>

        <div className="flex-grow min-h-0 overflow-auto">
          <Table
            size="small"
            dataSource={filteredRows}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ y: 460 }}
            rowClassName={(record) =>
              record.result === "MATCHED"
                ? "bg-green-50"
                : record.result === "UNMATCHED"
                ? "bg-red-50"
                : ""
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;
