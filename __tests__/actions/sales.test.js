import * as sales from "@/actions/sales";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("Sales Actions", () => {
  afterEach(() => jest.clearAllMocks());

  // ==================== Leads ====================

  describe("getLeads", () => {
    it("calls GET /api/sales/leads", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getLeads();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/leads");
    });
  });

  describe("createLead", () => {
    it("calls POST /api/sales/leads", async () => {
      const data = { leadName: "Prospect" };
      apiClient.post.mockResolvedValue(data);
      await sales.createLead(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/sales/leads", data);
    });
  });

  describe("updateLead", () => {
    it("calls PUT /api/sales/leads/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await sales.updateLead("l1", { leadName: "Updated" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/sales/leads/l1", {
        leadName: "Updated",
      });
    });
  });

  describe("deleteLead", () => {
    it("calls DELETE /api/sales/leads/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await sales.deleteLead("l1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/sales/leads/l1");
    });
  });

  describe("convertLead", () => {
    it("calls POST with convert action", async () => {
      apiClient.post.mockResolvedValue({});
      await sales.convertLead("l1");
      expect(apiClient.post).toHaveBeenCalledWith("/api/sales/leads/l1", {
        action: "convert",
      });
    });
  });

  // ==================== Contacts ====================

  describe("getContacts", () => {
    it("calls GET /api/sales/contacts", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getContacts();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/contacts");
    });
  });

  describe("createContact", () => {
    it("calls POST /api/sales/contacts", async () => {
      const data = { name: "John" };
      apiClient.post.mockResolvedValue(data);
      await sales.createContact(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/sales/contacts", data);
    });
  });

  describe("updateContact", () => {
    it("calls PUT /api/sales/contacts/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await sales.updateContact("c1", { name: "Jane" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/sales/contacts/c1", {
        name: "Jane",
      });
    });
  });

  describe("deleteContact", () => {
    it("calls DELETE /api/sales/contacts/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await sales.deleteContact("c1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/sales/contacts/c1");
    });
  });

  // ==================== Accounts ====================

  describe("getAccounts", () => {
    it("calls GET /api/sales/accounts", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getAccounts();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/accounts");
    });
  });

  describe("createAccount", () => {
    it("calls POST /api/sales/accounts", async () => {
      const data = { accountName: "Acme" };
      apiClient.post.mockResolvedValue(data);
      await sales.createAccount(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/sales/accounts", data);
    });
  });

  describe("deleteAccount", () => {
    it("calls DELETE /api/sales/accounts/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await sales.deleteAccount("a1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/sales/accounts/a1");
    });
  });

  // ==================== Opportunities ====================

  describe("getOpportunities", () => {
    it("calls GET /api/sales/opportunities", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getOpportunities();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/opportunities");
    });
  });

  describe("createOpportunity", () => {
    it("calls POST /api/sales/opportunities", async () => {
      const data = { name: "Deal" };
      apiClient.post.mockResolvedValue(data);
      await sales.createOpportunity(data);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/sales/opportunities",
        data
      );
    });
  });

  describe("deleteOpportunity", () => {
    it("calls DELETE /api/sales/opportunities/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await sales.deleteOpportunity("o1");
      expect(apiClient.del).toHaveBeenCalledWith(
        "/api/sales/opportunities/o1"
      );
    });
  });

  // ==================== Quotations ====================

  describe("getQuotationsList", () => {
    it("calls GET /api/sales/quotations", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getQuotationsList();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/quotations");
    });
  });

  describe("getQuotation", () => {
    it("calls GET /api/sales/quotations/:id", async () => {
      apiClient.get.mockResolvedValue({});
      await sales.getQuotation("q1");
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/quotations/q1");
    });
  });

  describe("createQuotation", () => {
    it("calls POST /api/sales/quotations", async () => {
      const data = { items: [] };
      apiClient.post.mockResolvedValue(data);
      await sales.createQuotation(data);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/sales/quotations",
        data
      );
    });
  });

  describe("updateQuotation", () => {
    it("calls PUT /api/sales/quotations/:id", async () => {
      apiClient.put.mockResolvedValue({});
      await sales.updateQuotation("q1", { status: "approved" });
      expect(apiClient.put).toHaveBeenCalledWith("/api/sales/quotations/q1", {
        status: "approved",
      });
    });
  });

  describe("deleteQuotation", () => {
    it("calls DELETE /api/sales/quotations/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await sales.deleteQuotation("q1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/sales/quotations/q1");
    });
  });

  describe("quotationAction", () => {
    it("calls POST with action and note", async () => {
      apiClient.post.mockResolvedValue({});
      await sales.quotationAction("q1", "approve", "Looks good");
      expect(apiClient.post).toHaveBeenCalledWith("/api/sales/quotations/q1", {
        action: "approve",
        note: "Looks good",
      });
    });
  });

  // ==================== Orders ====================

  describe("getOrders", () => {
    it("calls GET /api/sales/orders", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getOrders();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/orders");
    });
  });

  describe("createOrder", () => {
    it("calls POST /api/sales/orders", async () => {
      const data = { items: [] };
      apiClient.post.mockResolvedValue(data);
      await sales.createOrder(data);
      expect(apiClient.post).toHaveBeenCalledWith("/api/sales/orders", data);
    });
  });

  describe("deleteOrder", () => {
    it("calls DELETE /api/sales/orders/:id", async () => {
      apiClient.del.mockResolvedValue({});
      await sales.deleteOrder("o1");
      expect(apiClient.del).toHaveBeenCalledWith("/api/sales/orders/o1");
    });
  });

  // ==================== Activities ====================

  describe("getActivities", () => {
    it("calls GET /api/sales/activities without params", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getActivities();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/activities");
    });

    it("calls GET with query params when provided", async () => {
      apiClient.get.mockResolvedValue([]);
      await sales.getActivities({ type: "call", leadId: "l1" });
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/sales/activities?type=call&leadId=l1"
      );
    });
  });

  describe("createActivity", () => {
    it("calls POST /api/sales/activities", async () => {
      const data = { type: "call", notes: "Called prospect" };
      apiClient.post.mockResolvedValue(data);
      await sales.createActivity(data);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/sales/activities",
        data
      );
    });
  });

  // ==================== Dashboard ====================

  describe("getCrmDashboard", () => {
    it("calls GET /api/sales/dashboard", async () => {
      apiClient.get.mockResolvedValue({});
      await sales.getCrmDashboard();
      expect(apiClient.get).toHaveBeenCalledWith("/api/sales/dashboard");
    });
  });
});
