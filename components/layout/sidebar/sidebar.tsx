"use client";

import { motion } from "motion/react";
import { SidebarNavContent } from "./sidebar-nav-content";

/** Desktop docked sidebar — hidden below md; mobile uses MobileSidebar drawer. */
export function Sidebar() {
  return (
    <motion.aside
      data-tour="sidebar"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="no-shadow hidden w-[15.5rem] shrink-0 flex-col rounded-md bg-surface md:flex"
    >
      <SidebarNavContent />
    </motion.aside>
  );
}
