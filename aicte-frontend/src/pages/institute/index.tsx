import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CollapsibleSidebar } from "@/components/CollapisbleSidebar";
import { motion } from "framer-motion";

const Institute: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex bg-background min-h-screen">
      {pathname !== "/institute/login" && (
        <CollapsibleSidebar onCollapse={setIsCollapsed} />
      )}
      <motion.main
        className="flex-1 p-8"
        animate={{
          marginLeft:
            pathname == "/institute/login" ? 0 : isCollapsed ? "2rem" : "16rem",
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
};

export default Institute;
