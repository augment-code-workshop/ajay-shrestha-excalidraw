import { actionClearCanvas, actionDeleteSelected } from "../actions";
import { atom, useAtom } from "../editor-jotai";
import { t } from "../i18n";

import { useExcalidrawActionManager } from "./App";
import ConfirmDialog from "./ConfirmDialog";

import type { AppClassProperties, AppState } from "../types";

export const activeConfirmDialogAtom = atom<
  | "clearCanvas"
  | {
      type: "deleteSelection";
      app: AppClassProperties;
      selectedElementIds: AppState["selectedElementIds"];
    }
  | null
>(null);

export const ActiveConfirmDialog = () => {
  const [activeConfirmDialog, setActiveConfirmDialog] = useAtom(
    activeConfirmDialogAtom,
  );
  const actionManager = useExcalidrawActionManager();

  if (!activeConfirmDialog) {
    return null;
  }

  if (activeConfirmDialog === "clearCanvas") {
    return (
      <ConfirmDialog
        onConfirm={() => {
          actionManager.executeAction(actionClearCanvas);
          setActiveConfirmDialog(null);
        }}
        onCancel={() => setActiveConfirmDialog(null)}
        title={t("clearCanvasDialog.title")}
      >
        <p className="clear-canvas__content"> {t("alerts.clearReset")}</p>
      </ConfirmDialog>
    );
  }

  if (activeConfirmDialog.app === actionManager.app) {
    return (
      <ConfirmDialog
        onConfirm={() => {
          actionManager.executeAction(actionDeleteSelected, "ui", {
            confirmed: true,
            selectedElementIds: activeConfirmDialog.selectedElementIds,
          });
          setActiveConfirmDialog(null);
        }}
        onCancel={() => setActiveConfirmDialog(null)}
        title={t("deleteSelectionDialog.title")}
      >
        <p>{t("deleteSelectionDialog.description")}</p>
      </ConfirmDialog>
    );
  }

  return null;
};
