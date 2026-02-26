import * as marketing from "@/actions/marketing";
import * as apiClient from "@/lib/apiClient";

jest.mock("@/lib/apiClient");

describe("Marketing Actions", () => {
  afterEach(() => jest.clearAllMocks());

  // ==================== Conversations ====================

  describe("getConversations", () => {
    it("calls GET without params", async () => {
      apiClient.get.mockResolvedValue([]);
      await marketing.getConversations();
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/conversations"
      );
    });

    it("calls GET with query params", async () => {
      apiClient.get.mockResolvedValue([]);
      await marketing.getConversations({ channel: "line", status: "open" });
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/conversations?channel=line&status=open"
      );
    });
  });

  describe("getConversation", () => {
    it("calls GET with conversation ID", async () => {
      apiClient.get.mockResolvedValue({});
      await marketing.getConversation("c1");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/conversations/c1"
      );
    });
  });

  describe("updateConversation", () => {
    it("calls PUT with data", async () => {
      apiClient.put.mockResolvedValue({});
      await marketing.updateConversation("c1", { status: "closed" });
      expect(apiClient.put).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/conversations/c1",
        { status: "closed" }
      );
    });
  });

  describe("deleteConversation", () => {
    it("calls DELETE", async () => {
      apiClient.del.mockResolvedValue({});
      await marketing.deleteConversation("c1");
      expect(apiClient.del).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/conversations/c1"
      );
    });
  });

  // ==================== Messages ====================

  describe("getMessages", () => {
    it("calls GET with conversation ID", async () => {
      apiClient.get.mockResolvedValue([]);
      await marketing.getMessages("c1");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/conversations/c1/messages"
      );
    });
  });

  describe("sendMessage", () => {
    it("calls POST /api/marketing/omnichannel/send", async () => {
      apiClient.post.mockResolvedValue({});
      await marketing.sendMessage("c1", "Hello!");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/send",
        { conversationId: "c1", content: "Hello!" }
      );
    });
  });

  // ==================== AI Agent ====================

  describe("suggestReply", () => {
    it("calls POST /api/marketing/omnichannel/ai/suggest", async () => {
      apiClient.post.mockResolvedValue({ reply: "Hi there" });
      await marketing.suggestReply("c1");
      expect(apiClient.post).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/ai/suggest",
        { conversationId: "c1" }
      );
    });
  });

  describe("getAiSettings", () => {
    it("calls GET", async () => {
      apiClient.get.mockResolvedValue({});
      await marketing.getAiSettings();
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/omnichannel/ai/settings"
      );
    });
  });

  // ==================== Analytics ====================

  describe("getMarketingAnalytics", () => {
    it("calls GET without params by default", async () => {
      apiClient.get.mockResolvedValue({});
      await marketing.getMarketingAnalytics();
      expect(apiClient.get).toHaveBeenCalledWith("/api/marketing/analytics");
    });

    it("calls GET with refresh param", async () => {
      apiClient.get.mockResolvedValue({});
      await marketing.getMarketingAnalytics(true);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/analytics?refresh=1"
      );
    });

    it("calls GET with period param", async () => {
      apiClient.get.mockResolvedValue({});
      await marketing.getMarketingAnalytics(false, "monthly");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/analytics?period=monthly"
      );
    });
  });

  // ==================== Sales Orders ====================

  describe("getSalesOrders", () => {
    it("calls GET /api/marketing/salesOrders", async () => {
      apiClient.get.mockResolvedValue([]);
      await marketing.getSalesOrders();
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/salesOrders"
      );
    });
  });

  describe("getSalesOrder", () => {
    it("calls GET with encoded order number", async () => {
      apiClient.get.mockResolvedValue({});
      await marketing.getSalesOrder("SO-001");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/api/marketing/salesOrders/SO-001"
      );
    });
  });
});
