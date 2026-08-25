import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom は HTMLDialogElement.showModal/close を実装しないため、controlled な Modal を
// テストできるよう最小実装で補う。open 属性を反映し、close 時に close イベントを発火する。
function showModal(this: HTMLDialogElement) {
  this.open = true;
}
function close(this: HTMLDialogElement) {
  this.open = false;
  this.dispatchEvent(new Event("close"));
}
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal = showModal;
  HTMLDialogElement.prototype.close = close;
}

afterEach(() => {
  cleanup();
});
