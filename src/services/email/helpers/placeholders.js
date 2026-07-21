/**
 * Default placeholder data for previews and documentation.
 * Replace all values with real data at send time.
 */
export const PLACEHOLDERS = Object.freeze({
  customerName: "{{customerName}}",
  email: "{{email}}",
  username: "{{username}}",
  temporaryPassword: "{{temporaryPassword}}",
  otp: "{{otp}}",
  otpExpiryMinutes: 10,
  orderNumber: "{{orderNumber}}",
  orderDate: "{{orderDate}}",
  paymentStatus: "{{paymentStatus}}",
  paymentMethod: "{{paymentMethod}}",
  orderStatus: "{{orderStatus}}",
  subject: "{{subject}}",
  message: "{{message}}",
  phone: "{{phone}}",
  trackingNumber: "{{trackingNumber}}",
  courierName: "{{courierName}}",
  estimatedDeliveryDate: "{{estimatedDeliveryDate}}",
  invoiceNumber: "{{invoiceNumber}}",
  refundAmount: "{{refundAmount}}",
  productName: "{{productName}}",
  currentStock: "{{currentStock}}",
  threshold: "{{threshold}}",
});

export const SAMPLE_ORDER = Object.freeze({
  customerName: "Rahul Sharma",
  orderNumber: "MRC-2026-00142",
  orderDate: new Date().toISOString(),
  paymentStatus: "Paid",
  paymentMethod: "UPI",
  orderStatus: "Confirmed",
  items: [
    {
      productImage: "https://mrcrafted.in/assets/email/sample-product.png",
      productName: "Custom Printed T-Shirt",
      customizationPreview:
        "https://mrcrafted.in/assets/email/sample-customization.png",
      quantity: 2,
      price: 899,
    },
    {
      productImage: "https://mrcrafted.in/assets/email/sample-mug.png",
      productName: "Personalized Ceramic Mug",
      customizationPreview: null,
      quantity: 1,
      price: 499,
    },
  ],
  subtotal: 2297,
  shipping: 99,
  tax: 207,
  grandTotal: 2603,
  shippingAddress: {
    fullName: "Rahul Sharma",
    line1: "42, MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
    phone: "+91 98765 43210",
  },
  billingAddress: {
    fullName: "Rahul Sharma",
    line1: "42, MG Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001",
  },
  estimatedDeliveryDate: new Date(Date.now() + 5 * 86400000).toISOString(),
  courierName: "BlueDart",
  trackingNumber: "BD123456789IN",
  trackOrderUrl: "https://mrcrafted.in/orders/track/MRC-2026-00142",
});
