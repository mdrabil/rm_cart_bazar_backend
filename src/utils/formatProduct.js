


export const formatProduct = (product) => {
  if (!product) return null;
  return {
    _id: product._id,
    name: product.name,
    slug:product.slug,
    description: product.description,
    gstPercent: product.gstPercent,
    label: product.label,
    // 🔥 Only send image URLs
    images: product.images?.map((img) => img.url).filter(Boolean) || [],
    thumbnails: product.thumbnails?.map((img) => img.url).filter(Boolean) || [],

    variants: product.variants?.map(v => ({
      _id: v._id,
      value: v.value,
      mrp: v.mrp,
      sellingPrice: v.sellingPrice,
      stock: v.stock,
    })) || [],
  };
};



export const getPrimaryImage = (product) => {
  return product?.images?.[0]?.url || "";
};

// utils/cartFormatter.js

// export const formatCart = (cart) => {
//   if (!cart) return [];

//   return cart.items.map((item) => {
//     const product = item.productId;
//     const variant = product?.variants?.id(item.variantId);

//     return {
//       productId: product?._id,
//       variantId: item.variantId,
//       name: product?.name || "",
      
//       // 🔥 ONLY URL
//       image: product?.images?.[0]?.url || "",

//       variantValue: variant?.value || "",
//       sellingPrice: variant?.sellingPrice || 0,
//       mrp: variant?.mrp || 0,
//       gstPercent: product?.gstPercent || 0,
//       qty: item.qty,
//     };
//   });
// };


// export const formatCart = (cart) => {
//   return cart.items.map((item) => {
//     const product = item.productId;
//     const variant = product?.variants?.id(item.variantId);

//     return {
//       productId: product?._id?.toString(),
//       variantId: item.variantId?.toString(),
//       name: product?.name || "",
//       slug: product?.slug || "",
//       variantLabel: variant?.label || "",
//       variantValue: variant?.value || "",
//       mrp: variant?.mrp || 0,
//       sellingPrice: variant?.sellingPrice || 0,
//       gstPercent: product?.gstPercent || 0,
//       quantity: item.qty || 0,
//       images: product?.images?.map(i => i.url) || [], // 🔥 ONLY URL
//     };
//   });
// };


export const formatCart = (cart) => {
  return cart.items.map((item) => {
    const product = item.productId;

    // populated + non populated dono handle
    const variant = product?.variants?.find(
      (v) =>
        v._id.toString() ===
        item.variantId.toString()
    );

  const layer = item.layer || null;

    return {
      productId:
        product?._id?.toString() || "",

      variantId:
        item.variantId?.toString() || "",

      name: product?.name || "",

      slug: product?.slug || "",

      variantLabel:
        product?.label || "",

      variantValue:
        variant?.value || "",

      mrp: variant?.mrp || 0,

      sellingPrice:
        variant?.sellingPrice || 0,

      gstPercent:
        product?.gstPercent || 0,

      quantity: item.qty || 1,

      // 🔥 ONLY IMAGE URLS
      // images:
      //   product?.images?.map(
      //     (i) => i.url
      //   ) || [],

      images: product.images?.map((img) => ({
  url: img.url,
})) || [],

      // 🔥 CUSTOMIZATION
      layer: layer || null,
    };
  });
};