/**
 * Preserve raw request body for webhook signature verification.
 */
export function paymentWebhookRawBody(req, res, next) {
  const chunks = [];

  req.on("data", (chunk) => {
    chunks.push(chunk);
  });

  req.on("end", () => {
    const rawBody = Buffer.concat(chunks);
    req.rawBody = rawBody.toString("utf8");

    try {
      req.body = rawBody.length ? JSON.parse(req.rawBody) : {};
    } catch {
      req.body = {};
    }

    next();
  });

  req.on("error", (error) => next(error));
}
