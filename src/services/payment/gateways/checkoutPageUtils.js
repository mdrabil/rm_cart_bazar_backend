export const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const BASE_CSP = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "form-action 'self' https:",
];

const normalizeDirectiveEntries = (input, bucket = []) => {
  if (input == null) {
    return bucket;
  }

  if (Array.isArray(input)) {
    input.forEach((item) => normalizeDirectiveEntries(item, bucket));
    return bucket;
  }

  if (typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => {
      const directiveKey = String(key).trim();
      if (!directiveKey) return;

      if (value == null || value === "") {
        bucket.push(directiveKey);
        return;
      }

      const directiveValue = Array.isArray(value)
        ? value.map(String).join(" ").trim()
        : String(value).trim();

      bucket.push(
        directiveValue ? `${directiveKey} ${directiveValue}` : directiveKey
      );
    });
    return bucket;
  }

  const text = String(input).trim();
  if (text) {
    bucket.push(text);
  }

  return bucket;
};

export const mergeCspDirectives = (...groups) => {
  const merged = new Map();
  const directives = normalizeDirectiveEntries([BASE_CSP, ...groups]);

  directives.forEach((directive) => {
    const spaceIndex = directive.indexOf(" ");
    const key = spaceIndex === -1 ? directive : directive.slice(0, spaceIndex);
    const value =
      spaceIndex === -1 ? "" : directive.slice(spaceIndex + 1).trim();
    const existing = merged.get(key);
    merged.set(key, existing ? `${existing} ${value}`.trim() : value);
  });

  return Array.from(merged.entries())
    .map(([key, value]) => (value ? `${key} ${value}` : key))
    .join("; ");
};

export const setPaymentPageHeaders = (res, extraDirectives = []) => {
  try {
    res.setHeader(
      "Content-Security-Policy",
      mergeCspDirectives(extraDirectives)
    );
  } catch (error) {
    console.error("Payment page CSP merge failed, using base policy:", error);
    res.setHeader("Content-Security-Policy", mergeCspDirectives());
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
};

export const buildDeepLinkRedirectHtml = (targetUrl) => {
  const safeUrl = escapeHtml(targetUrl);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <title>Returning</title>
</head>
<body>
  <script>window.location.replace("${safeUrl}");</script>
</body>
</html>`;
};

export const buildReturnQuery = (fields = {}) => {
  const params = new URLSearchParams({ status: "success" });

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  return params;
};

export const appendQuery = (baseUrl, params) => {
  const joiner = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${joiner}${params.toString()}`;
};

export const shouldUseServerRedirect = (platform, apiBaseUrl) => {
  const normalized = String(platform || "").trim().toLowerCase();
  if (["android", "ios"].includes(normalized)) {
    return true;
  }
  return String(apiBaseUrl || "").startsWith("https:");
};

export const buildAutoSubmitFormHtml = ({
  action,
  fields,
  title = "Payment",
}) => {
  const inputs = Object.entries(fields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <form id="pgForm" method="post" action="${escapeHtml(action)}">
    ${inputs}
  </form>
  <script>document.getElementById("pgForm").submit();</script>
</body>
</html>`;
};

export const CLIENT_HELPERS = `
function redirectWithParams(baseUrl, params) {
  if (!baseUrl) return false;
  var joiner = baseUrl.indexOf("?") > -1 ? "&" : "?";
  window.location.href = baseUrl + joiner + params.toString();
  return true;
}
function fail(message) {
  console.error(message);
  document.body.textContent = message;
}
function loadScript(src, onload, onerror) {
  var script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.onload = onload;
  script.onerror = onerror || function () {
    fail("Failed to load payment gateway.");
  };
  document.head.appendChild(script);
}
`;
