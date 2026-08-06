/** Read dropped files/folders from a DataTransfer (preserves folder structure). */
export async function getFilesFromDataTransfer(
  items: DataTransferItemList,
): Promise<Array<{ file: File; relativePath: string }>> {
  const result: Array<{ file: File; relativePath: string }> = [];

  async function readEntry(entry: FileSystemEntry, path = "") {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
      const relativePath = path ? `${path}/${file.name}` : file.name;
      result.push({ file, relativePath });
    } else if (entry.isDirectory) {
      const dirReader = (entry as FileSystemDirectoryEntry).createReader();
      let entries: FileSystemEntry[] = [];
      let readChunk: FileSystemEntry[] = [];
      do {
        readChunk = await new Promise<FileSystemEntry[]>((resolve, reject) => {
          dirReader.readEntries(resolve, reject);
        });
        entries = entries.concat(readChunk);
      } while (readChunk.length > 0);

      for (const childEntry of entries) {
        await readEntry(childEntry, path ? `${path}/${entry.name}` : entry.name);
      }
    }
  }

  const promises: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file") {
      const entry = typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null;
      if (entry) {
        promises.push(readEntry(entry));
      } else {
        const file = item.getAsFile();
        if (file) result.push({ file, relativePath: file.name });
      }
    }
  }

  await Promise.all(promises);
  return result;
}

/** Resolve the R2 relative directory for a file under a base folder (handles webkit paths). */
export function resolveFileRelativeDir(
  baseFolderPath: string,
  file: File,
  customRelativePath?: string,
): string {
  let fileRelativeDir = baseFolderPath.trim().replace(/^\/+|\/+$/g, "");
  const pathSource =
    customRelativePath ??
    ("webkitRelativePath" in file && file.webkitRelativePath ? file.webkitRelativePath : undefined);

  if (pathSource) {
    const parts = pathSource.replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.length > 1) {
      const subDir = parts.slice(0, -1).join("/");
      fileRelativeDir = fileRelativeDir ? `${fileRelativeDir}/${subDir}` : subDir;
    }
  }

  return fileRelativeDir.replace(/\/+$/, "");
}
