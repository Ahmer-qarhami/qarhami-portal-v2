import React from "react";
import { Card, Tag } from "antd";

const ResponsiveDataCard = ({
  title,
  subtitle,
  status,
  statusColor = "default",
  rows = [],
  actions,
  onClick,
  className = "",
}) => {
  return (
    <Card
      hoverable={!!onClick}
      className={`border border-gray-200 shadow-sm ${className}`}
      bodyStyle={{ padding: 16 }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 break-words">
              {title || "-"}
            </h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-gray-500 break-words">
                {subtitle}
              </p>
            ) : null}
          </div>
          {status ? <Tag color={statusColor}>{status}</Tag> : null}
        </div>

        {rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {row.label}
                </span>
                <div className="text-sm text-gray-800 break-all sm:max-w-[60%] sm:text-right">
                  {row.value ?? "-"}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {actions ? (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {actions}
          </div>
        ) : null}
      </div>
    </Card>
  );
};

export default ResponsiveDataCard;
