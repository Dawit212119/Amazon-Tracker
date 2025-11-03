import { useState, useEffect } from "react";
import { productService } from "../services/api";

const RefreshButton = ({ onRefresh, defaultKeywords = "" }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [keywords, setKeywords] = useState(defaultKeywords);

  const handleRefresh = async () => {
    // Always require keywords from user - no defaults
    if (!showInput) {
      setShowInput(true);
      setMessage("Please enter keywords to search");
      return;
    }

    if (!keywords.trim()) {
      setMessage("Please enter at least one keyword (comma-separated)");
      return;
    }

    await handleRefreshWithKeywords(keywords.trim());
  };

  const handleRefreshWithKeywords = async (customKeywords) => {
    setLoading(true);
    setMessage("");
    let pollInterval = null;

    try {
      const result = await productService.triggerRefresh(customKeywords);
      setMessage(result.message || "Refresh started!");
      setShowInput(false);

      // Start polling for progress if jobId is returned
      if (result.jobId) {
        pollInterval = setInterval(async () => {
          try {
            const progress = await productService.getProgress(result.jobId);

            // Update message with progress
            if (progress.currentKeyword) {
              const statusMsg = `Scraping "${progress.currentKeyword}" - Page ${
                progress.currentPage || 1
              }... (${progress.productsProcessed || 0} products)`;
              setMessage(statusMsg);
            }

            // Auto-refresh products list as they come in
            if (progress.productsProcessed > 0 && onRefresh) {
              onRefresh();
            }

            // Stop polling if job is complete
            if (progress.completed) {
              if (pollInterval) clearInterval(pollInterval);
              setLoading(false);
              setMessage(
                progress.status === "completed"
                  ? `✅ Completed! ${
                      progress.productsProcessed || 0
                    } products processed.`
                  : `❌ Failed: ${progress.error || "Unknown error"}`
              );
              if (onRefresh) {
                onRefresh();
              }
              setTimeout(() => setMessage(""), 5000);
            }
          } catch (error) {
            // Job might not exist or expired
            if (error.response?.status === 404) {
              if (pollInterval) clearInterval(pollInterval);
              setLoading(false);
              setMessage("Job completed");
              if (onRefresh) {
                onRefresh();
              }
            }
          }
        }, 2000); // Poll every 2 seconds
      } else if (onRefresh) {
        // Fallback: refresh after delay if no jobId
        setTimeout(() => {
          onRefresh();
          setMessage("");
        }, 5000);
      }
    } catch (error) {
      if (pollInterval) clearInterval(pollInterval);
      setMessage(
        error.response?.data?.error ||
          "Failed to trigger refresh. Please try again."
      );
      setLoading(false);
    }

    // Cleanup function
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            if (!showInput) {
              setShowInput(true);
              setMessage("Please enter keywords to search");
            } else {
              handleRefresh();
            }
          }}
          disabled={loading}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {loading
            ? "Refreshing..."
            : showInput
            ? "🔄 Start Search"
            : "🔄 Search Products"}
        </button>
        {showInput && (
          <button
            onClick={() => {
              setShowInput(false);
              setKeywords("");
              setMessage("");
            }}
            className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        {message && (
          <span className="text-sm text-green-600 font-medium">{message}</span>
        )}
      </div>
      {showInput && (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter search keywords (comma-separated):{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="e.g., iPhone 15, Samsung Galaxy, MacBook Pro"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyPress={(e) => {
              if (e.key === "Enter" && !loading && keywords.trim()) {
                handleRefresh();
              }
            }}
            autoFocus
          />
          <p className="mt-2 text-xs text-gray-500">
            Separate multiple keywords with commas. Specific product names work
            best.
          </p>
        </div>
      )}
    </div>
  );
};

export default RefreshButton;
