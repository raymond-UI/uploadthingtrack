import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

const defaultPayload = {
  key: "replace-demo-key",
  url: "https://example.com/file.png",
  name: "file.png",
  size: 1234,
  mimeType: "image/png",
  userId: "user_demo",
  folder: "profile",
  tags: "avatar, demo",
};

export default function ReplacementPanel() {
  const [payload, setPayload] = useState(defaultPayload);
  const [result, setResult] = useState<string | null>(null);

  const upsertFile = useMutation(api.admin.upsertFile);

  const handleChange = (key: keyof typeof payload, value: string) => {
    setPayload((prev) => ({
      ...prev,
      [key]: key === "size" ? Number(value) || 0 : value,
    }));
  };

  const handleUpsert = async () => {
    setResult(null);
    const tags = payload.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const fileId = await upsertFile({
      key: payload.key.trim(),
      url: payload.url.trim(),
      name: payload.name.trim(),
      size: payload.size,
      mimeType: payload.mimeType.trim(),
      userId: payload.userId.trim(),
      folder: payload.folder.trim() || undefined,
      tags: tags.length ? tags : undefined,
    });

    setResult(`Upserted file id: ${fileId}`);
  };

  return (
    <div className="panel">
      <div className="panel-section">
        <h3>Manual Upsert (Replacement)</h3>
        <p className="muted">
          Use the same key twice to verify replacement. Change the URL or name
          and re-submit to see `replacedAt` update.
        </p>
        <div className="row">
          <label>
            Key
            <input
              value={payload.key}
              onChange={(event) => handleChange("key", event.target.value)}
            />
          </label>
          <label>
            URL
            <input
              value={payload.url}
              onChange={(event) => handleChange("url", event.target.value)}
            />
          </label>
          <label>
            Name
            <input
              value={payload.name}
              onChange={(event) => handleChange("name", event.target.value)}
            />
          </label>
          <label>
            Size
            <input
              type="number"
              value={payload.size}
              onChange={(event) => handleChange("size", event.target.value)}
            />
          </label>
          <label>
            Mime type
            <input
              value={payload.mimeType}
              onChange={(event) => handleChange("mimeType", event.target.value)}
            />
          </label>
          <label>
            User ID
            <input
              value={payload.userId}
              onChange={(event) => handleChange("userId", event.target.value)}
            />
          </label>
          <label>
            Folder
            <input
              value={payload.folder}
              onChange={(event) => handleChange("folder", event.target.value)}
            />
          </label>
          <label>
            Tags
            <input
              value={payload.tags}
              onChange={(event) => handleChange("tags", event.target.value)}
            />
          </label>
        </div>
        <div className="row">
          <button className="primary" onClick={handleUpsert}>
            Upsert file
          </button>
        </div>
        {result && <p className="result">{result}</p>}
      </div>
    </div>
  );
}
