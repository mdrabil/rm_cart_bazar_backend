// import nodemailer from "nodemailer";
// import { config } from "../config/config.js";

// const EMAIL_SEND_TIMEOUT_MS = Number(process.env.EMAIL_SEND_TIMEOUT_MS) || 15000;

// const normalizePass = (pass = "") => String(pass).replace(/\s+/g, "").trim();

// /**
//  * Build a production-safe Nodemailer transport.
//  * - Explicit SMTP (not only service:"gmail") for reliable VPS behaviour
//  * - Hard timeouts so HTTP requests never hang forever
//  * - Force IPv4 (family:4) — IPv6 SMTP hangs are a common live-server failure
//  */
// const createTransporter = () => {
//   const user = config.emailUser;
//   const pass = normalizePass(config.emailPass);

//   if (!user || !pass) {
//     return null;
//   }

//   const host = config.smtpHost || "smtp.gmail.com";
//   const port = Number(config.smtpPort) || 587;
//   const secure = config.smtpSecure === true || port === 465;

//   return nodemailer.createTransport({
//     host,
//     port,
//     secure,
//     auth: { user, pass },
//     // Prefer STARTTLS on 587
//     requireTLS: !secure && port === 587,
//     tls: {
//       // Keep verification on in production; allow override only if needed
//       rejectUnauthorized: config.smtpTlsRejectUnauthorized !== false,
//       minVersion: "TLSv1.2",
//     },
//     // Critical on many cloud VPS: IPv6 AAAA records cause indefinite hangs
//     family: 4,
//     connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS) || 10000,
//     greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS) || 10000,
//     socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS) || 20000,
//     pool: true,
//     maxConnections: 3,
//     maxMessages: 50,
//     rateDelta: 1000,
//     rateLimit: 5,
//   });
// };

// let transporter = createTransporter();

// const withTimeout = (promise, ms, label = "Email send") =>
//   new Promise((resolve, reject) => {
//     const timer = setTimeout(() => {
//       const err = new Error(
//         `${label} timed out after ${ms}ms. Check SMTP credentials, outbound ports 587/465, and firewall.`
//       );
//       err.code = "EMAIL_TIMEOUT";
//       reject(err);
//     }, ms);

//     promise
//       .then((value) => {
//         clearTimeout(timer);
//         resolve(value);
//       })
//       .catch((err) => {
//         clearTimeout(timer);
//         reject(err);
//       });
//   });

// /**
//  * Verify SMTP connectivity (non-blocking helper for startup / health checks).
//  */
// export const verifyEmailTransport = async () => {
//   if (!transporter) {
//     console.warn("[Email] Transport not configured (EMAIL_USER / EMAIL_PASS missing)");
//     return false;
//   }

//   try {
//     await withTimeout(
//       transporter.verify(),
//       Number(process.env.SMTP_VERIFY_TIMEOUT_MS) || 10000,
//       "SMTP verify"
//     );
//     console.log(
//       `[Email] SMTP ready → ${config.smtpHost || "smtp.gmail.com"}:${config.smtpPort || 587} as ${config.emailUser}`
//     );
//     return true;
//   } catch (error) {
//     console.error("[Email] SMTP verify failed:", error.code || "", error.message);
//     return false;
//   }
// };

// /**
//  * Send email. Supports legacy `(to, subject, text, html?)` and object payloads.
//  * Always applies a hard timeout so API requests cannot hang on production SMTP.
//  */
// export const sendEmail = async (to, subject, text, html) => {
//   let mailOptions;

//   if (typeof to === "object" && to !== null && !Array.isArray(to)) {
//     mailOptions = {
//       from: to.from || `"MR Crafted" <${config.emailUser}>`,
//       ...to,
//     };
//   } else {
//     mailOptions = {
//       from: `"MR Crafted" <${config.emailUser}>`,
//       to,
//       subject,
//       text,
//       ...(html ? { html } : {}),
//     };
//   }

//   if (!mailOptions.to || !mailOptions.subject) {
//     throw Object.assign(new Error("Email recipient and subject are required"), {
//       code: "EMAIL_VALIDATION",
//     });
//   }

//   if (!config.emailUser || !normalizePass(config.emailPass)) {
//     throw Object.assign(new Error("Email service is not configured"), {
//       code: "EMAIL_NOT_CONFIGURED",
//     });
//   }

//   // Recreate transporter if credentials were loaded late / previously missing
//   if (!transporter) {
//     transporter = createTransporter();
//   }

//   if (!transporter) {
//     throw Object.assign(new Error("Email transport could not be created"), {
//       code: "EMAIL_TRANSPORT",
//     });
//   }

//   const startedAt = Date.now();
//   const toList = Array.isArray(mailOptions.to)
//     ? mailOptions.to.join(",")
//     : String(mailOptions.to);

//   try {
//     const info = await withTimeout(
//       transporter.sendMail(mailOptions),
//       EMAIL_SEND_TIMEOUT_MS,
//       "Email send"
//     );

//     console.log(
//       `[Email] Sent OK → ${toList} | ${mailOptions.subject} | ${Date.now() - startedAt}ms | id=${info.messageId || "n/a"}`
//     );
//     return info;
//   } catch (error) {
//     console.error(
//       `[Email] FAILED → ${toList} | ${mailOptions.subject} | ${Date.now() - startedAt}ms | code=${error.code || "UNKNOWN"} | ${error.message}`
//     );

//     // Surface actionable messages for clients / logs
//     if (error.code === "EAUTH") {
//       throw Object.assign(
//         new Error(
//           "Email authentication failed. Check EMAIL_USER and EMAIL_PASS (Gmail App Password, no spaces)."
//         ),
//         { code: "EMAIL_AUTH", cause: error }
//       );
//     }

//     if (
//       error.code === "ESOCKET" ||
//       error.code === "ECONNECTION" ||
//       error.code === "ETIMEDOUT" ||
//       error.code === "EMAIL_TIMEOUT"
//     ) {
//       throw Object.assign(
//         new Error(
//           "Unable to reach the email server. Ensure the VPS allows outbound SMTP on ports 587/465 (firewall / security group)."
//         ),
//         { code: error.code || "EMAIL_TIMEOUT", cause: error }
//       );
//     }

//     throw error;
//   }
// };

// /**
//  * Fire-and-forget send — never blocks the HTTP response.
//  */
// export const sendEmailAsync = (payload) => {
//   setImmediate(() => {
//     sendEmail(payload).catch((err) => {
//       console.error("[Email] Async send failed:", err.code || "", err.message);
//     });
//   });
// };

// export default sendEmail;



import nodemailer from "nodemailer";
import { config } from "../config/config.js";


const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {
    user: config.emailUser,
    pass: String(config.emailPass).replace(/\s+/g, "")
  }

});



// SMTP CHECK
export const verifyEmailTransport = async () => {

  try {

    console.log("📧 Checking Gmail SMTP...");

    await transporter.verify();


    console.log(
      "✅ Gmail SMTP Connected Successfully",
      {
        user: config.emailUser
      }
    );


    return true;


  } catch (error) {


    console.error(
      "❌ Gmail SMTP Connection Failed",
      {
        code: error.code,
        message: error.message
      }
    );


    return false;

  }

};




// SEND EMAIL
export const sendEmail = async ({
  to,
  subject,
  html,
  text = ""
}) => {


  try {


    console.log(
      "📨 Sending Email...",
      {
        from: config.emailUser,
        to,
        subject
      }
    );


    const info = await transporter.sendMail({

      from: `"MR Crafted" <${config.emailUser}>`,

      to,

      subject,

      html,

      text

    });



    console.log(
      "✅ Email Sent Successfully",
      {
        messageId: info.messageId,
        response: info.response
      }
    );



    return info;



  } catch(error){


    console.error(
      "❌ Email Sending Failed",
      {
        code:error.code,
        message:error.message,
        command:error.command
      }
    );


    throw error;


  }

};




// ASYNC EMAIL (OPTIONAL)
export const sendEmailAsync = (payload)=>{


  setImmediate(async()=>{


    try{


      await sendEmail(payload);


      console.log(
        "✅ Async Email Completed"
      );


    }catch(error){


      console.error(
        "❌ Async Email Failed",
        error.message
      );


    }


  });


};



export default sendEmail;