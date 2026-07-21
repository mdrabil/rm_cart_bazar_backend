import { BRAND } from "../brand.js";
import { escapeHtml } from "../helpers/escape.js";
import { renderHeader, renderFooter } from "../components/index.js";

/**
 * Base email layout — table-based, inline CSS, mobile-friendly.
 *
 * @param {object} options
 * @param {string} options.title - Email document title
 * @param {string} options.preheader - Hidden preview text
 * @param {string} options.heroHtml - Hero section HTML
 * @param {string} options.bodyHtml - Main content HTML
 * @param {object} [options.header] - Header overrides
 * @param {object} [options.footer] - Footer overrides
 */
export const renderBaseLayout = ({
  title = BRAND.companyName,
  preheader = "",
  heroHtml = "",
  bodyHtml = "",
  header = {},
  footer = {},
} = {}) => {
  const { colors, typography, layout } = BRAND;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .mobile-padding { padding-left: 16px !important; padding-right: 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${colors.background};font-family:${typography.fontFamily};color:${colors.text};">
  ${
    preheader
      ? `<div style="display:none;font-size:1px;color:${colors.background};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>`
      : ""
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${colors.background};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="email-container" width="${layout.maxWidth}" cellpadding="0" cellspacing="0" border="0" style="max-width:${layout.maxWidth};width:100%;background-color:${colors.white};border-radius:${layout.borderRadius};overflow:hidden;box-shadow:0 4px 24px rgba(0,18,52,0.08);">
          <tr>
            <td>${renderHeader(header)}</td>
          </tr>
          ${heroHtml ? `<tr><td>${heroHtml}</td></tr>` : ""}
          <tr>
            <td class="mobile-padding" style="padding:${layout.padding};font-family:${typography.fontFamily};font-size:${typography.fontSizeBase};line-height:${typography.lineHeight};color:${colors.text};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td>${renderFooter(footer)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export { renderBaseLayout as default };
