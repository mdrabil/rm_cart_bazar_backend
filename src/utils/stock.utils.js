export const getVariantStockQty = (variant) => {
  if (!variant) return 0;
  return Math.max(0, Number(variant.stockQty) || 0);
};

export const isVariantInStock = (variant) => getVariantStockQty(variant) > 0;

export const validateVariantStock = (variant, requestedQty, existingQty = 0) => {
  if (!variant) {
    return { ok: false, message: "Invalid variant" };
  }

  if (variant.isActive === false) {
    return { ok: false, message: "This variant is not available" };
  }

  const stockQty = getVariantStockQty(variant);
  const totalQty = Number(existingQty || 0) + Number(requestedQty || 0);

  if (stockQty <= 0) {
    return { ok: false, message: "Product is out of stock" };
  }

  if (totalQty > stockQty) {
    return {
      ok: false,
      message: `Only ${stockQty} item(s) available in stock`,
      stockQty,
    };
  }

  return { ok: true, stockQty };
};
