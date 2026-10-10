import { StudioProject } from "./types";

let database: Promise<IDBDatabase> | undefined;
function open() {
  if (!database)
    database = new Promise((resolve, reject) => {
      const request = indexedDB.open("videogaga-recovery-v1", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("drafts");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        database = undefined;
        reject(new Error("本地恢复草稿无法保存，请先导出备份再离开"));
      };
    });
  return database;
}
export async function readDraft(
  key: string,
): Promise<StudioProject | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db.transaction("drafts").objectStore("drafts").get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("恢复草稿读取失败"));
  });
}
export async function writeDraft(
  key: string,
  project?: StudioProject,
  clearIf?: StudioProject,
) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("drafts", "readwrite");
    const store = tx.objectStore("drafts");
    if (project) store.put(project, key);
    else if (clearIf) {
      const read = store.get(key);
      read.onsuccess = () => {
        const draft = read.result as StudioProject | undefined;
        if (
          draft &&
          draft.revision === clearIf.revision &&
          draft.name === clearIf.name &&
          JSON.stringify(draft.data) === JSON.stringify(clearIf.data)
        )
          store.delete(key);
      };
    } else store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () =>
      reject(new Error("本地恢复草稿无法保存，请先导出备份再离开"));
  });
}
