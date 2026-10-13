import { createInstance } from "i18next";
import en from "./locales/en.json";
import zh from "./locales/zh.json";

vi.mock("./api/modules/branding", () => ({
  getBrandingSettings: vi.fn().mockResolvedValue({ app_name: "公司办公助手" }),
}));

describe("runtime branding", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.head.innerHTML = "";
  });

  it("loads the name before login and remembers it for offline startup", async () => {
    const branding = await import("./branding");
    await branding.initBranding();
    expect(branding.appName).toBe("公司办公助手");
    expect(document.title).toBe("公司办公助手");
    expect(localStorage.getItem("octop:app-name")).toBe("公司办公助手");
  });

  it("uses the server-rendered name without another request", async () => {
    document.head.innerHTML = '<meta name="application-name" content="新品牌">';
    const branding = await import("./branding");
    await branding.initBranding();
    expect(branding.appName).toBe("新品牌");
  });

  it("interpolates both languages without changing commands or supplied values", async () => {
    const i18n = createInstance();
    await i18n.init({
      resources: { en: { translation: en }, zh: { translation: zh } },
      lng: "zh",
      interpolation: {
        escapeValue: false,
        defaultVariables: { appName: "新品牌" },
      },
    });
    expect(i18n.t("setupWizard.subtitle")).toBe("欢迎使用 新品牌");
    expect(i18n.t("login.forgotPasswordCommand")).toContain(
      "octop user passwd",
    );
    await i18n.changeLanguage("en");
    expect(i18n.t("setupWizard.subtitle")).toBe("Welcome to 新品牌");
    expect(i18n.t("{{appName}}: {{name}}", { name: "Octop" })).toBe(
      "新品牌: Octop",
    );
  });

  it("brands server messages while preserving upstream URLs and CLI names", async () => {
    const branding = await import("./branding");
    await branding.initBranding();
    expect(branding.brandText("Octop / OCTOP / octop run / OCTOP_PORT")).toBe(
      "公司办公助手 / 公司办公助手 / octop run / OCTOP_PORT",
    );
    expect(branding.brandText("https://github.com/TencentCloud/Octop")).toBe(
      "https://github.com/TencentCloud/Octop",
    );
  });

  it("uses the cached name when the server is unavailable", async () => {
    const { getBrandingSettings } = await import("./api/modules/branding");
    vi.mocked(getBrandingSettings).mockRejectedValueOnce(new Error("offline"));
    localStorage.setItem("octop:app-name", "上次使用的品牌");
    const branding = await import("./branding");
    await branding.initBranding();
    expect(branding.appName).toBe("上次使用的品牌");
  });
});
