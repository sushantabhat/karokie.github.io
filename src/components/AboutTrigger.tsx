"use client";

import React, { useState } from "react";
import { AboutModal } from "@/components/AboutModal";

export default function AboutTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 text-sm text-gray-600 hover:text-gray-800"
        aria-label="About"
      >
        About
      </button>
      <AboutModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
