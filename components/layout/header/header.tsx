"use client";

import { motion } from "motion/react";
import { ActionIconsPill } from "./action-icons-pill";
import { CreditsPill } from "./credits-pill";
import { LogoPill } from "./logo-pill";
import { SearchBar } from "./search-bar";
import { StorePill } from "./store-pill";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="no-shadow relative z-40 flex h-[3.75rem] min-w-0 shrink-0 items-center rounded-md bg-surface px-3"
    >
      <LogoPill />
      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <SearchBar />
        <CreditsPill />
        <ActionIconsPill />
        <StorePill />
      </div>
    </motion.header>
  );
}
