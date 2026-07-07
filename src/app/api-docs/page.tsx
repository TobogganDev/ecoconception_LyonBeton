"use client";

import dynamic from "next/dynamic";
import React from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  const [spec, setSpec] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSpec = async () => {
      try {
        const response = await fetch("/api/docs");
        if (!response.ok) {
          throw new Error(`Failed to fetch API spec: ${response.status}`);
        }
        const data = await response.json();
        setSpec(data);
      } catch (err) {
        console.error("Error fetching API spec:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSpec();
  }, []);

  if (loading) {
    return (
      <div>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #3498db",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p>Loading API Documentation...</p>
        <style jsx>{`
          @keyframes spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Error Loading API Documentation</h1>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#3498db",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!spec) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <p>No API specification found</p>
      </div>
    );
  }

  return (
    <div>
      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={1}
        defaultModelExpandDepth={1}
        displayOperationId={false}
        displayRequestDuration={true}
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
        tryItOutEnabled={true}
        requestInterceptor={(request: any) => {
          // Add any custom headers or modifications here
          console.log("Request:", request);
          return request;
        }}
        responseInterceptor={(response: any) => {
          // Handle responses here
          console.log("Response:", response);
          return response;
        }}
        onComplete={() => {
          console.log("SwaggerUI loaded successfully");
        }}
        // Custom styling
        plugins={[]}
        layout="BaseLayout"
      />
    </div>
  );
}
