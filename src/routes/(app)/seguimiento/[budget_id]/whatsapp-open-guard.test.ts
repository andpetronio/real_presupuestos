import { describe, expect, it } from "vitest";
import {
  readWhatsappUrl,
  shouldOpenWhatsappForResult,
} from "./whatsapp-open-guard";

describe("seguimiento WhatsApp open guard", () => {
  it("opens once for the same action result object", () => {
    const result = { data: { whatsappUrl: "https://web.whatsapp.com/send" } };

    expect(readWhatsappUrl(result)).toBe("https://web.whatsapp.com/send");
    expect(shouldOpenWhatsappForResult(result)).toBe(true);
    expect(shouldOpenWhatsappForResult(result)).toBe(false);
  });

  it("allows later distinct action results with the same URL", () => {
    const first = { data: { whatsappUrl: "https://web.whatsapp.com/send" } };
    const second = { data: { whatsappUrl: "https://web.whatsapp.com/send" } };

    expect(shouldOpenWhatsappForResult(first)).toBe(true);
    expect(shouldOpenWhatsappForResult(second)).toBe(true);
  });

  it("ignores results without a valid WhatsApp URL", () => {
    expect(shouldOpenWhatsappForResult({ data: {} })).toBe(false);
    expect(shouldOpenWhatsappForResult({ data: { whatsappUrl: "" } })).toBe(
      false,
    );
  });
});
