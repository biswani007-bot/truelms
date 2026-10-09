"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import React, { useEffect, useState } from "react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);
  
  useEffect(() => {
    fetch('/api/docs-json')
      .then(res => res.json())
      .then(data => setSpec(data))
      .catch(console.error);
  }, []);

  if (!spec) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading API Documentation...</div>;

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
