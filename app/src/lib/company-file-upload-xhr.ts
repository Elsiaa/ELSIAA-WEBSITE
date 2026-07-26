/** Same-origin POST with upload progress. */
export function xhrPostFormData(
  url: string,
  form: FormData,
  onProgress: (percent: number) => void,
  withCredentials = true
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = withCredentials;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      onProgress(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const j = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(j.error || xhr.statusText || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(xhr.statusText || `Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    xhr.send(form);
  });
}

/** Presigned PUT to R2 with progress. */
export function xhrPutFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      onProgress(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            xhr.responseText?.slice(0, 200) ||
              `Direct upload failed (${xhr.status}). Check R2 CORS for PUT from this origin.`
          )
        );
      }
    };
    xhr.onerror = () =>
      reject(
        new Error(
          'Network error uploading to storage. If this persists, the bucket CORS policy may need ' +
            'AllowedMethods: PUT and AllowedHeaders: * for your site origin.'
        )
      );
    xhr.send(file);
  });
}

export function normalizeContentTypeForUpload(browserType: string | undefined): string {
  const t = browserType?.trim() ?? '';
  if (!t) return 'application/octet-stream';
  if (
    t.startsWith('image/') ||
    t.startsWith('audio/') ||
    t.startsWith('video/') ||
    t.startsWith('text/') ||
    t === 'application/pdf' ||
    t === 'application/json' ||
    t === 'application/zip' ||
    t === 'application/gzip' ||
    t === 'application/x-tar' ||
    t === 'application/vnd.ms-excel' ||
    t === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    t === 'application/vnd.ms-powerpoint' ||
    t === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    t === 'application/msword' ||
    t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return t;
  }
  return 'application/octet-stream';
}

export function fileBasenameForUpload(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? name;
  return base.trim() || 'upload';
}
