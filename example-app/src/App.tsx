import { useMemo, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUploadThing } from "./uploadthing";

export default function App() {
  const [userId, setUserId] = useState("user_demo");
  const [tag, setTag] = useState("");
  const [folder, setFolder] = useState("profile");
  const [uploadTags, setUploadTags] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [batchSize, setBatchSize] = useState("50");
  const [dryRun, setDryRun] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const [cleanupResult, setCleanupResult] = useState<
    | {
        deletedCount: number;
        keys: string[];
        hasMore: boolean;
      }
    | undefined
  >(undefined);

  const queryArgs = useMemo(() => {
    if (!userId.trim()) return "skip" as const;
    return {
      userId: userId.trim(),
      tag: tag.trim() || undefined,
      mimeType: mimeType.trim() || undefined,
    };
  }, [userId, tag, mimeType]);

  const listArgs = useMemo(() => {
    if (!userId.trim()) return "skip" as const;
    return {
      userId: userId.trim(),
      tag: tag.trim() || undefined,
      mimeType: mimeType.trim() || undefined,
    };
  }, [userId, tag, mimeType]);

  const files = useQuery(api.uploadthing.listMyFiles, listArgs);
  const stats = useQuery(api.uploadthing.getMyUsage, queryArgs);
  const cleanupExpiredFiles = useAction(api.uploadthing.cleanupExpiredFiles);

  const { startUpload, isUploading } = useUploadThing("fileUploader", {
    headers: () => ({
      "x-user-id": userId.trim(),
      "x-folder": folder.trim(),
      "x-tags": uploadTags.trim(),
    }),
    onClientUploadComplete: (uploaded) => {
      const keys = uploaded.map((item) => item.key).join(", ");
      setUploadResult(keys.length ? `Uploaded: ${keys}` : "Upload complete.");
      setSelectedFiles([]);
    },
    onUploadError: (error) => {
      setUploadResult(`Upload error: ${error.message}`);
    },
  });

  const handleCleanup = async () => {
    if (!userId.trim()) return;
    const parsedBatch = Number(batchSize);
    const result = await cleanupExpiredFiles({
      batchSize: Number.isFinite(parsedBatch) ? parsedBatch : undefined,
      dryRun,
    });
    setCleanupResult(result);
  };

  const handleUpload = async () => {
    setUploadResult(null);
    if (!userId.trim()) {
      setUploadResult("Enter a user id before uploading.");
      return;
    }
    if (selectedFiles.length === 0) {
      setUploadResult("Choose at least one file.");
      return;
    }
    await startUpload(selectedFiles);
  };

  return (
    <div className="app">
      <header>
        <h1>UploadThing File Tracker</h1>
        <p>
          This demo app uses the UploadThing File Tracker component via Convex.
          It runs an UploadThing server locally and forwards callbacks to Convex.
        </p>
      </header>

      <section className="card">
        <h2>Viewer</h2>
        <div className="row">
          <label>
            User ID
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="user_123"
            />
          </label>
          <label>
            Default folder
            <input
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              placeholder="profile"
            />
          </label>
          <label>
            Tag filter
            <input
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="avatar"
            />
          </label>
          <label>
            Upload tags
            <input
              value={uploadTags}
              onChange={(event) => setUploadTags(event.target.value)}
              placeholder="avatar, profile"
            />
          </label>
          <label>
            MIME type filter
            <input
              value={mimeType}
              onChange={(event) => setMimeType(event.target.value)}
              placeholder="image/png"
            />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Upload</h2>
        <p className="muted">
          Select files to upload. Metadata is passed via headers and stored by the
          component when UploadThing calls the Convex webhook.
        </p>
        <div className="row">
          <input
            className="file-input"
            type="file"
            multiple
            onChange={(event) =>
              setSelectedFiles(Array.from(event.target.files ?? []))
            }
          />
          <button className="primary" disabled={isUploading} onClick={handleUpload}>
            {isUploading ? "Uploading..." : "Upload"}
          </button>
        </div>
        {uploadResult && <p className="result">{uploadResult}</p>}
      </section>

      <section className="card">
        <h2>Usage</h2>
        {!userId.trim() ? (
          <p className="muted">Enter a user id to see usage stats.</p>
        ) : stats ? (
          <div className="stats">
            <div>
              <span className="label">Total files</span>
              <span className="value">{stats.totalFiles}</span>
            </div>
            <div>
              <span className="label">Total bytes</span>
              <span className="value">{stats.totalBytes}</span>
            </div>
          </div>
        ) : (
          <p className="muted">Loading stats…</p>
        )}
      </section>

      <section className="card">
        <h2>Files</h2>
        {!userId.trim() ? (
          <p className="muted">Enter a user id to list files.</p>
        ) : !files ? (
          <p className="muted">Loading files…</p>
        ) : files.length === 0 ? (
          <p className="muted">No files yet.</p>
        ) : (
          <div className="table">
            <div className="table-header">
              <span>Key</span>
              <span>Name</span>
              <span>Type</span>
              <span>Size</span>
              <span>Folder</span>
              <span>Tags</span>
            </div>
            {files.map((file: (typeof files)[number]) => (
              <div className="table-row" key={file._id}>
                <span className="mono">{file.key}</span>
                <span>{file.name}</span>
                <span>{file.mimeType}</span>
                <span>{file.size}</span>
                <span>{file.folder ?? "-"}</span>
                <span>{file.tags?.join(", ") ?? "-"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>Cleanup</h2>
        <div className="row">
          <label>
            Batch size
            <input
              value={batchSize}
              onChange={(event) => setBatchSize(event.target.value)}
              placeholder="50"
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
            />
            Dry run
          </label>
          <button className="primary" onClick={handleCleanup}>
            Run cleanup
          </button>
        </div>
        {cleanupResult && (
          <div className="result">
            <div>
              Deleted: <strong>{cleanupResult.deletedCount}</strong>
            </div>
            <div>
              Keys: {cleanupResult.keys.length ? cleanupResult.keys.join(", ") : "-"}
            </div>
            <div>Has more: {cleanupResult.hasMore ? "yes" : "no"}</div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>UploadThing Webhook</h2>
        <p className="muted">
          Configure the UploadThing callback URL to point at the Convex HTTP
          action <code>/webhooks/uploadthing</code>.
        </p>
      </section>
    </div>
  );
}
