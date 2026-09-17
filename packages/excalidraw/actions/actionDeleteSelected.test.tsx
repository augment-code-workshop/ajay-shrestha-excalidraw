import React from "react";

import { activeConfirmDialogAtom } from "../components/ActiveConfirmDialog";
import { editorJotaiStore } from "../editor-jotai";
import { Excalidraw } from "../index";
import { API } from "../tests/helpers/api";
import {
  act,
  assertElements,
  fireEvent,
  render,
  waitFor,
} from "../tests/test-utils";

import { actionDeleteSelected } from "./actionDeleteSelected";

const { h } = window;

const deleteSelection = () => {
  act(() => {
    h.app.actionManager.executeAction(actionDeleteSelected, "api", {
      confirmed: true,
    });
  });
};

describe("deleting selected elements when frame selected should keep children + select them", () => {
  beforeEach(async () => {
    await render(<Excalidraw />);
  });

  it("frame only", async () => {
    const f1 = API.createElement({
      type: "frame",
    });

    const r1 = API.createElement({
      type: "rectangle",
      frameId: f1.id,
    });

    API.setElements([f1, r1]);

    API.setSelectedElements([f1]);

    deleteSelection();

    assertElements(h.elements, [
      { id: f1.id, isDeleted: true },
      { id: r1.id, isDeleted: false, selected: true },
    ]);
  });

  it("frame + text container (text's frameId set)", async () => {
    const f1 = API.createElement({
      type: "frame",
    });

    const r1 = API.createElement({
      type: "rectangle",
      frameId: f1.id,
    });

    const t1 = API.createElement({
      type: "text",
      width: 200,
      height: 100,
      fontSize: 20,
      containerId: r1.id,
      frameId: f1.id,
    });

    h.app.scene.mutateElement(r1, {
      boundElements: [{ type: "text", id: t1.id }],
    });

    API.setElements([f1, r1, t1]);

    API.setSelectedElements([f1]);

    deleteSelection();

    assertElements(h.elements, [
      { id: f1.id, isDeleted: true },
      { id: r1.id, isDeleted: false, selected: true },
      { id: t1.id, isDeleted: false },
    ]);
  });

  it("frame + text container (text's frameId not set)", async () => {
    const f1 = API.createElement({
      type: "frame",
    });

    const r1 = API.createElement({
      type: "rectangle",
      frameId: f1.id,
    });

    const t1 = API.createElement({
      type: "text",
      width: 200,
      height: 100,
      fontSize: 20,
      containerId: r1.id,
      frameId: null,
    });

    h.app.scene.mutateElement(r1, {
      boundElements: [{ type: "text", id: t1.id }],
    });

    API.setElements([f1, r1, t1]);

    API.setSelectedElements([f1]);

    deleteSelection();

    assertElements(h.elements, [
      { id: f1.id, isDeleted: true },
      { id: r1.id, isDeleted: false, selected: true },
      { id: t1.id, isDeleted: false },
    ]);
  });

  it("frame + text container (text selected too)", async () => {
    const f1 = API.createElement({
      type: "frame",
    });

    const r1 = API.createElement({
      type: "rectangle",
      frameId: f1.id,
    });

    const t1 = API.createElement({
      type: "text",
      width: 200,
      height: 100,
      fontSize: 20,
      containerId: r1.id,
      frameId: null,
    });

    h.app.scene.mutateElement(r1, {
      boundElements: [{ type: "text", id: t1.id }],
    });

    API.setElements([f1, r1, t1]);

    API.setSelectedElements([f1, t1]);

    deleteSelection();

    assertElements(h.elements, [
      { id: f1.id, isDeleted: true },
      { id: r1.id, isDeleted: false, selected: true },
      { id: t1.id, isDeleted: false },
    ]);
  });

  it("frame + labeled arrow", async () => {
    const f1 = API.createElement({
      type: "frame",
    });

    const a1 = API.createElement({
      type: "arrow",
      frameId: f1.id,
    });

    const t1 = API.createElement({
      type: "text",
      width: 200,
      height: 100,
      fontSize: 20,
      containerId: a1.id,
      frameId: null,
    });

    h.app.scene.mutateElement(a1, {
      boundElements: [{ type: "text", id: t1.id }],
    });

    API.setElements([f1, a1, t1]);

    API.setSelectedElements([f1, t1]);

    deleteSelection();

    assertElements(h.elements, [
      { id: f1.id, isDeleted: true },
      { id: a1.id, isDeleted: false, selected: true },
      { id: t1.id, isDeleted: false },
    ]);
  });

  it("frame + children selected", async () => {
    const f1 = API.createElement({
      type: "frame",
    });
    const r1 = API.createElement({
      type: "rectangle",
      frameId: f1.id,
    });
    API.setElements([f1, r1]);

    API.setSelectedElements([f1, r1]);

    deleteSelection();

    assertElements(h.elements, [
      { id: f1.id, isDeleted: true },
      { id: r1.id, isDeleted: false, selected: true },
    ]);
  });
});

describe("delete selection confirmation", () => {
  beforeEach(async () => {
    await render(<Excalidraw />);
  });

  it("deletes one selected element without confirmation", () => {
    const rectangle = API.createElement({ type: "rectangle" });
    API.setElements([rectangle]);
    API.setSelectedElements([rectangle]);

    act(() => {
      h.app.actionManager.executeAction(actionDeleteSelected);
    });

    expect(h.elements[0].isDeleted).toBe(true);
    expect(document.querySelector(".confirm-dialog")).toBeNull();
  });

  it("keeps a multi-element selection when confirmation is cancelled", async () => {
    const rectangles = [
      API.createElement({ type: "rectangle" }),
      API.createElement({ type: "rectangle" }),
    ];
    API.setElements(rectangles);
    API.setSelectedElements(rectangles);

    if (!actionDeleteSelected.trackEvent) {
      throw new Error("delete action tracking must be configured");
    }
    const { predicate: shouldTrackDelete } = actionDeleteSelected.trackEvent;
    expect(shouldTrackDelete?.(h.state, h.elements, null)).toBe(false);
    const shouldTrackConfirmedDelete = shouldTrackDelete?.(
      h.state,
      h.elements,
      { confirmed: true },
    );
    expect(shouldTrackConfirmedDelete).toBe(true);

    act(() => {
      h.app.actionManager.executeAction(actionDeleteSelected);
    });

    const confirmDialog = document.querySelector(".confirm-dialog")!;
    expect(confirmDialog).not.toBeNull();
    expect(h.elements.every((element) => !element.isDeleted)).toBe(true);
    expect(editorJotaiStore.get(activeConfirmDialogAtom)).toEqual({
      type: "deleteSelection",
      app: h.app,
      selectedElementIds: h.state.selectedElementIds,
    });

    fireEvent.click(confirmDialog.querySelector('[aria-label="Cancel"]')!);

    await waitFor(() => {
      expect(document.querySelector(".confirm-dialog")).toBeNull();
    });
    expect(h.elements.every((element) => !element.isDeleted)).toBe(true);
    expect(h.state.selectedElementIds).toEqual({
      [rectangles[0].id]: true,
      [rectangles[1].id]: true,
    });
  });

  it("deletes only the selection that was confirmed", async () => {
    const rectangles = [
      API.createElement({ type: "rectangle" }),
      API.createElement({ type: "rectangle" }),
      API.createElement({ type: "rectangle" }),
    ];
    API.setElements(rectangles);
    API.setSelectedElements(rectangles.slice(0, 2));

    act(() => {
      h.app.actionManager.executeAction(actionDeleteSelected);
    });

    const confirmDialog = document.querySelector(".confirm-dialog")!;
    API.setSelectedElements(rectangles);
    fireEvent.click(confirmDialog.querySelector('[aria-label="Confirm"]')!);

    await waitFor(() => {
      expect(h.elements[0].isDeleted).toBe(true);
      expect(h.elements[1].isDeleted).toBe(true);
    });
    expect(h.elements[2].isDeleted).toBe(false);
  });

  it("requires confirmation before deleting a frame", async () => {
    const frame = API.createElement({ type: "frame" });
    API.setElements([frame]);
    API.setSelectedElements([frame]);

    act(() => {
      h.app.actionManager.executeAction(actionDeleteSelected);
    });

    const confirmDialog = document.querySelector(".confirm-dialog")!;
    expect(confirmDialog).not.toBeNull();
    expect(h.elements[0].isDeleted).toBe(false);

    fireEvent.click(confirmDialog.querySelector('[aria-label="Confirm"]')!);

    await waitFor(() => {
      expect(h.elements[0].isDeleted).toBe(true);
    });
  });
});
