const reviews = await ReviewModel.find({ product: productId });

const total = reviews.length;
const avg =
  reviews.reduce((sum, r) => sum + r.rating, 0) / total;

await ProductModel.findByIdAndUpdate(productId, {
  averageRating: avg || 0,
  totalReviews: total
});