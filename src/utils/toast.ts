import { showToast } from "vant";

export function toastSuccess(message: string) {
  showToast({ message, className: "app-toast is-success" });
}

export function toastError(message: string) {
  showToast({ message, className: "app-toast is-error", duration: 2600 });
}
