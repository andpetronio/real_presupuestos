import { browser } from "$app/environment";
import type { ActionResult } from "@sveltejs/kit";

type AlertKind = "success" | "error";

type ActionFeedback = {
  kind: AlertKind;
  message: string;
};

const fallbackErrorMessage =
  "Ocurrio un error inesperado. Reintenta en unos segundos.";

const getSwal = async () => {
  if (!browser) return null;
  const module = await import("sweetalert2");
  return module.default;
};

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};

const readString = (
  record: Record<string, unknown> | null,
  key: string,
): string | null => {
  if (!record) return null;
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

export const showBlockingLoader = async (title = "Procesando...") => {
  const Swal = await getSwal();
  if (!Swal) return;

  await Swal.fire({
    title,
    text: "Por favor espera un momento.",
    allowEscapeKey: false,
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export const closeBlockingLoader = async () => {
  const Swal = await getSwal();
  if (!Swal) return;
  Swal.close();
};

export const showSuccessAlert = async (message: string) => {
  const Swal = await getSwal();
  if (!Swal) return;

  await Swal.fire({
    icon: "success",
    title: "Listo",
    text: message,
    timer: 2200,
    timerProgressBar: true,
    showConfirmButton: false,
  });
};

export const showErrorAlert = async (message: string) => {
  const Swal = await getSwal();
  if (!Swal) return;

  await Swal.fire({
    icon: "error",
    title: "No se pudo completar",
    text: message,
    confirmButtonText: "Entendido",
  });
};

export const confirmAlert = async (params: {
  title: string;
  text: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}) => {
  const Swal = await getSwal();
  if (!Swal) return true;

  const result = await Swal.fire({
    icon: "warning",
    title: params.title,
    text: params.text,
    showCancelButton: true,
    confirmButtonText: params.confirmButtonText ?? "Confirmar",
    cancelButtonText: params.cancelButtonText ?? "Cancelar",
    reverseButtons: true,
    focusCancel: true,
  });

  return result.isConfirmed;
};

export const resolveActionFeedback = (
  result: ActionResult,
): ActionFeedback | null => {
  if (result.type === "redirect") return null;

  if (result.type === "error") {
    return { kind: "error", message: fallbackErrorMessage };
  }

  const data = toRecord(result.data);

  if (result.type === "failure") {
    const operatorError = readString(data, "operatorError");
    const rawError = readString(data, "error");
    const message = readString(data, "message");
    return {
      kind: "error",
      message: operatorError ?? rawError ?? message ?? fallbackErrorMessage,
    };
  }

  const operatorSuccess = readString(data, "operatorSuccess");
  const success = readString(data, "success");
  const message = readString(data, "message");
  if (operatorSuccess || success || message) {
    return {
      kind: "success",
      message:
        operatorSuccess ??
        success ??
        message ??
        "Operacion completada correctamente.",
    };
  }

  const rawError = readString(data, "error");
  if (rawError) {
    return {
      kind: "error",
      message: rawError,
    };
  }

  return null;
};

export const presentActionFeedbackAny = async (result: unknown) => {
  if (!result || typeof result !== 'object') return;
  const data = result as { type?: string; data?: unknown };
  if (data.type === 'redirect') return;
  await presentActionFeedback({ type: data.type || 'error', data: data.data } as ActionResult);
};

export const presentActionFeedback = async (result: ActionResult) => {
  const feedback = resolveActionFeedback(result);
  if (!feedback) return;

  if (feedback.kind === "error") {
    await showErrorAlert(feedback.message);
    return;
  }

  await showSuccessAlert(feedback.message);
};
