import React from "react";

const PageContainer = ({
  title,
  icon: Icon,
  actions,
  children,
  className = "",
  contentClassName = "",
}) => {
  return (
    <div className="min-h-[calc(100dvh-3.5rem)] lg:min-h-screen bg-gray-100 p-2 sm:p-4">
      <div
        className={`bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-full flex flex-col min-h-[calc(100dvh-4.5rem)] lg:min-h-[calc(100dvh-2rem)] ${className}`}
      >
        {(title || actions) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 shrink-0">
            {title && (
              <div className="flex items-center gap-2 min-w-0">
                {Icon && (
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600 shrink-0" />
                )}
                <h2 className="text-lg sm:text-xl font-semibold truncate">
                  {title}
                </h2>
              </div>
            )}
            {actions && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {actions}
              </div>
            )}
          </div>
        )}
        <div className={`flex flex-col flex-1 min-h-0 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageContainer;
