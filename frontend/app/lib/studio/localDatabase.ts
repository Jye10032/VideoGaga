import { StudioProject, ProjectSummary } from "./types";
let database: Promise<IDBDatabase> | undefined;
function open() {
  if (!database)
    database = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("videogaga-studio-v1", 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("projects", { keyPath: "id" });
        request.result.createObjectStore("summaries", { keyPath: "id" });
      };
      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          database = undefined;
        };
        resolve(db);
      };
      request.onerror = () => {
        database = undefined;
        reject(new Error("本地存储不可用，请检查浏览器设置"));
      };
    });
  return database;
}
export async function localGet(id: string) {
  const db = await open();
  return new Promise<StudioProject | undefined>((resolve, reject) => {
    const request = db.transaction("projects").objectStore("projects").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("本地项目读取失败"));
  });
}
export async function localList() {
  const db = await open();
  return new Promise<ProjectSummary[]>((resolve, reject) => {
    const request = db
      .transaction("summaries")
      .objectStore("summaries")
      .getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("本地项目列表读取失败"));
  });
}
export async function localPut(
  project: StudioProject,
  expectedRevision?: number,
) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["projects", "summaries"], "readwrite"),
      store = tx.objectStore("projects");
    let reason = "本地保存失败，可能是浏览器存储空间不足。可先导出项目备份。";
    const request = store.get(project.id);
    request.onsuccess = () => {
      if (
        expectedRevision !== undefined &&
        request.result?.revision !== expectedRevision
      ) {
        reason = "其他窗口已修改或删除此项目，请导出当前草稿后刷新";
        tx.abort();
        return;
      }
      store.put(project);
      tx.objectStore("summaries").put({
        id: project.id,
        name: project.name,
        mode: project.mode,
        updatedAt: project.updatedAt,
      });
    };
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(new Error(reason));
    tx.onerror = () => reject(new Error(reason));
  });
}
export async function localRemove(id: string) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(["projects", "summaries"], "readwrite");
    tx.objectStore("projects").delete(id);
    tx.objectStore("summaries").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("本地项目删除失败"));
  });
}
