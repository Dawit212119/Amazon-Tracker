import PropTypes from "prop-types";

const ProductCard = ({ product, showChange = false }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const amazonUrl = `https://www.amazon.com/dp/${product.asin}`;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Product Image */}
      {product.image_url && (
        <div className="mb-4 flex justify-center bg-gray-50 rounded-lg p-2">
          <img
            src={product.image_url}
            alt={product.title}
            className="h-48 w-48 object-contain rounded-lg"
            loading="lazy"
            crossOrigin="anonymous"
            onError={(e) => {
              // Try alternative image format or hide
              const originalSrc = e.target.src;
              if (originalSrc && !originalSrc.includes("_AC_")) {
                // Try adding Amazon image format
                const newSrc = originalSrc.replace(/\.(jpg|png)$/i, "._AC_.$1");
                if (newSrc !== originalSrc) {
                  e.target.src = newSrc;
                } else {
                  e.target.style.display = "none";
                }
              } else {
                e.target.style.display = "none";
              }
            }}
          />
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
          <a
            href={amazonUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors"
          >
            {product.title}
          </a>
        </h3>
        {showChange && product.price_change && (
          <span
            className={`ml-2 px-2 py-1 rounded text-sm font-medium ${
              product.price_change < 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {product.price_change > 0 ? "↑" : "↓"}{" "}
            {Math.abs(product.price_change).toFixed(2)}%
          </span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Price:</span>
          <span className="text-xl font-bold text-indigo-600">
            {formatPrice(product.price)}
          </span>
        </div>

        {product.rating && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Rating:</span>
            <span className="text-lg font-semibold text-gray-700">
              ⭐ {parseFloat(product.rating).toFixed(1)} / 5.0
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">ASIN:</span>
          <span className="text-sm font-mono text-gray-600">
            {product.asin}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-gray-400">Last Updated:</span>
          <span className="text-xs text-gray-400">
            {formatDate(product.timestamp)}
          </span>
        </div>
      </div>

      <a
        href={amazonUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 block w-full text-center bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition-colors"
      >
        View on Amazon
      </a>
    </div>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    image_url: PropTypes.string,
    title: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    price_change: PropTypes.number,
    rating: PropTypes.number,
    asin: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
  }).isRequired,
  showChange: PropTypes.bool,
};

export default ProductCard;
