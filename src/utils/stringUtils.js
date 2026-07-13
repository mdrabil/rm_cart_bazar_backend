export const normalizeString = (str) => {
  if (!str) return "";
  return str.trim().toLowerCase(); // lowercase + trim
};

export const uppercaseString = (str) => {
  if (!str) return "";
  return str.trim().toUpperCase(); // uppercase + trim
};
