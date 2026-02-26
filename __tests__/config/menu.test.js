import { menuData, findActiveMenuByPathname } from "@/config/menu";

describe("menuData", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(menuData)).toBe(true);
    expect(menuData.length).toBeGreaterThan(0);
  });

  it("each menu item has required fields", () => {
    menuData.forEach((menu) => {
      expect(menu).toHaveProperty("id");
      expect(menu).toHaveProperty("name");
      expect(menu).toHaveProperty("icon");
      expect(menu).toHaveProperty("subMenus");
      expect(Array.isArray(menu.subMenus)).toBe(true);
    });
  });

  it("each submenu has name and icon", () => {
    menuData.forEach((menu) => {
      menu.subMenus.forEach((sub) => {
        expect(sub).toHaveProperty("name");
        expect(sub).toHaveProperty("icon");
      });
    });
  });

  it("contains expected module IDs", () => {
    const ids = menuData.map((m) => m.id);
    expect(ids).toContain("overview");
    expect(ids).toContain("hr");
    expect(ids).toContain("it");
    expect(ids).toContain("sales");
    expect(ids).toContain("marketing");
    expect(ids).toContain("rbac");
    expect(ids).toContain("settings");
  });
});

describe("findActiveMenuByPathname", () => {
  it("finds menu by direct href match", () => {
    const result = findActiveMenuByPathname("/hr/employees");
    expect(result.id).toBe("hr");
  });

  it("finds menu by submenu href", () => {
    const result = findActiveMenuByPathname("/sales/leads");
    expect(result.id).toBe("sales");
  });

  it("matches nested paths", () => {
    const result = findActiveMenuByPathname("/rbac/roles/123");
    expect(result.id).toBe("rbac");
  });

  it("matches overview dashboard", () => {
    const result = findActiveMenuByPathname("/overview/dashboard");
    expect(result.id).toBe("overview");
  });

  it("returns first menu (overview) when no match found", () => {
    const result = findActiveMenuByPathname("/unknown/page");
    expect(result.id).toBe(menuData[0].id);
  });

  it("finds TMS module", () => {
    const result = findActiveMenuByPathname("/tms/vehicles");
    expect(result.id).toBe("logistics");
  });

  it("finds warehouse module", () => {
    const result = findActiveMenuByPathname("/warehouse/inventory");
    expect(result.id).toBe("warehouse");
  });

  it("finds marketing omnichannel", () => {
    const result = findActiveMenuByPathname("/marketing/omnichannel");
    expect(result.id).toBe("marketing");
  });

  it("finds production module", () => {
    const result = findActiveMenuByPathname("/production/dashboard");
    expect(result.id).toBe("production");
  });

  it("finds settings module", () => {
    const result = findActiveMenuByPathname("/settings/configCheck");
    expect(result.id).toBe("settings");
  });
});
