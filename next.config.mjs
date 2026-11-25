const exportingSite = process.env.REPAIR_SITE_EXPORT === "1";

export default {
  ...(exportingSite ? { output: "export", pageExtensions: ["jsx"] } : {}),
  trailingSlash: true,
  devIndicators: false,
  poweredByHeader: false,
};
