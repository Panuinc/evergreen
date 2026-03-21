"use client";

import { useState } from "react";

export function useMenuBadges() {
  const [badges] = useState({});
  return badges;
}
