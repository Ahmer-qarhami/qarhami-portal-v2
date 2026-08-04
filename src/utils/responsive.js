/** Shared Ant Design table scroll config for horizontal overflow on small screens. */
export const tableScrollX = { x: "max-content" };

export const tableScrollY = {
  y: "calc(100dvh - 22rem)",
};

export const tableScroll = {
  ...tableScrollX,
  ...tableScrollY,
};
