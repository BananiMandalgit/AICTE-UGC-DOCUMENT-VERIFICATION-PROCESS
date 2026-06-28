import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: JSX.Element;
}

export default function ProtectedAdminRoute({ children }: Props) {
  const token = localStorage.getItem('authToken');
  const mode = localStorage.getItem('authMode');

  if (!token || mode !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
