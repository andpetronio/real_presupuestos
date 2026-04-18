type SendWhatsAppParams = {
  to: string;
  message: string;
  from?: string | null;
};

type SendWhatsAppResult = {
  ok: true;
  transport: "simulated";
  providerMessageId: string;
};

export const sendWhatsAppMessage = async (
  _params: SendWhatsAppParams,
): Promise<SendWhatsAppResult> => {
  return {
    ok: true,
    transport: "simulated",
    providerMessageId: `sim-${Date.now()}`,
  };
};
