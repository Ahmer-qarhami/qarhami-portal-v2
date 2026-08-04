import React, { useMemo, useRef, useState } from "react";
import { Button, Input, Select, Table, message } from "antd";
import { ExcelToJson } from "../utils/ExcelReader";
import { getAllActiveDevices } from "../api/Devices";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import PageContainer from "../components/PageContainer.jsx";
import ResponsiveDataCard from "../components/ResponsiveDataCard.jsx";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { tableScroll } from "../utils/responsive";

const { Option } = Select;

const SUBSCRIBED_RECON_STATUSES = new Set(["SUBSCRIBED", "SUBSCRIBED_ACK"]);

const parseExpectedQty = (value) => {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => {
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .trim();
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
  const isDesktop = useIsDesktop();
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

      const raw = await getAllActiveDevices();
      const list = Array.isArray(raw) ? raw : [];
      // Qarhami counts: only vehicles Stripe-eligible (subscribed or ack), not trial/cancelled/etc.
      const subscribedRows = list.filter((d) =>
        SUBSCRIBED_RECON_STATUSES.has(d?.subscriptionStatus),
      );

      // De-dupe by deviceSerial to avoid inflated counts when user vehicles
      // contain duplicates (or multiple records resolve to the same device).
      const deviceData = Array.from(
        new Map(
          subscribedRows
            .filter((d) => d?.deviceSerial)
            .map((d) => [String(d.deviceSerial).trim(), d]),
        ).values(),
      );

      // //include only ftype666@gmail.com
      // const emailData = list.filter(
      //   (d) => d.email.toLowerCase() === "ftype666@gmail.com",
      // );

      const statusCountMap = deviceData.reduce((acc, device) => {
        const key = normalizeKey(device?.subscriptionStatus || "");
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      const emailCountMap = deviceData.reduce((acc, device) => {
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
          (item) => item.result === "MATCHED",
        ).length;
        if (parsedRows.length > 0 && matchedRows === 0) {
          message.warning(
            "No matched rows found. Keys should match Qarhami data for vehicles with SUBSCRIBED or SUBSCRIBED_ACK only (email or subscription status).",
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
        normalizedEmail === "" ||
        normalizeKey(item.reconcileKey).includes(normalizedEmail);
      return matchesResult && matchesEmail;
    });
  }, [rows, resultFilter, emailFilter]);

  const matchedCount = rows.filter((item) => item.result === "MATCHED").length;
  const unmatchedCount = rows.filter(
    (item) => item.result === "UNMATCHED",
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
        String(a?.reconcileKey || "").localeCompare(
          String(b?.reconcileKey || ""),
        ),
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
      sorter: (a, b) =>
        String(a?.result || "").localeCompare(String(b?.result || "")),
    },
    {
      title: "Amount (USD)",
      dataIndex: "remarks",
      key: "remarks",
      className: "text-xs md:text-md",
      render: (value) => formatCurrency(value),
      sorter: (a, b) => {
        const left = Number(
          String(a?.remarks ?? "")
            .replace(/,/g, "")
            .trim(),
        );
        const right = Number(
          String(b?.remarks ?? "")
            .replace(/,/g, "")
            .trim(),
        );
        const normalizedLeft = Number.isFinite(left) ? left : 0;
        const normalizedRight = Number.isFinite(right) ? right : 0;
        return normalizedLeft - normalizedRight;
      },
    },
  ];

  const renderCards = () => (
    <div className="grid grid-cols-1 gap-4">
      {filteredRows.map((record) => (
        <ResponsiveDataCard
          key={record.id}
          title={record.reconcileKey || "Unknown Key"}
          status={record.result}
          statusColor={record.result === "MATCHED" ? "green" : "red"}
          rows={[
            { label: "Stripe", value: record.expectedQty },
            { label: "Qarhami", value: record.actualQty },
            { label: "Amount (USD)", value: formatCurrency(record.remarks) },
          ]}
          className={
            record.result === "MATCHED" ? "bg-green-50" : "bg-red-50"
          }
        />
      ))}
    </div>
  );

  return (
    <>
      {isLoading && (
        <LoadingSpinner message="Reconciling with Qarhami (SUBSCRIBED / SUBSCRIBED_ACK only)..." />
      )}
      <PageContainer
        title="Stripe Reconciliation"
        actions={
          <>
            <Input
              placeholder="Filter by email"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              allowClear
              className="w-full sm:w-auto sm:min-w-[12rem]"
            />
            <Select
              value={resultFilter}
              onChange={setResultFilter}
              className="w-full sm:w-auto sm:min-w-[10rem]"
            >
              <Option value="ALL">All</Option>
              <Option value="MATCHED">Matched</Option>
              <Option value="UNMATCHED">Unmatched</Option>
            </Select>
            <Button
              type="primary"
              onClick={openFilePicker}
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              Upload Excel/CSV
            </Button>
            <input
              id="recon-upload"
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        }
      >
        <div className="mb-3 text-sm shrink-0">
          <span className="mr-4 block sm:inline">
            Matched: <strong className="text-green-700">{matchedCount}</strong>
          </span>
          <span className="block sm:inline">
            Unmatched:{" "}
            <strong className="text-red-700">{unmatchedCount}</strong>
          </span>
        </div>

        <div className="flex-grow min-h-0 overflow-auto">
          {filteredRows.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No reconciliation rows to display.
            </div>
          ) : isDesktop ? (
            <Table
              size="small"
              dataSource={filteredRows}
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={tableScroll}
              rowClassName={(record) =>
                record.result === "MATCHED"
                  ? "bg-green-50"
                  : record.result === "UNMATCHED"
                    ? "bg-red-50"
                    : ""
              }
            />
          ) : (
            renderCards()
          )}
        </div>
      </PageContainer>
    </>
  );
};

export default Reconciliation;
