import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const visibilityOptions = ["public", "private", "restricted"] as const;

type Visibility = (typeof visibilityOptions)[number];

type AccessRule = {
  visibility: Visibility;
  allowUserIds?: string[];
  denyUserIds?: string[];
};

function parseList(value: string): string[] | undefined {
  const list = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length ? list : undefined;
}

export default function AccessControlPanel() {
  const [fileKey, setFileKey] = useState("");
  const [folder, setFolder] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [allow, setAllow] = useState("");
  const [deny, setDeny] = useState("");
  const [viewerId, setViewerId] = useState("");
  const [lookupKey, setLookupKey] = useState("");

  const setFileAccess = useMutation(api.admin.setFileAccess);
  const setFolderAccess = useMutation(api.admin.setFolderAccess);

  const lookupArgs = useMemo(() => {
    if (!lookupKey.trim()) return "skip" as const;
    return { key: lookupKey.trim(), viewerUserId: viewerId.trim() || undefined };
  }, [lookupKey, viewerId]);

  const lookedUp = useQuery(api.admin.getFile, lookupArgs);

  const rule: AccessRule = {
    visibility,
    allowUserIds: parseList(allow),
    denyUserIds: parseList(deny),
  };

  const handleSetFileAccess = async () => {
    if (!fileKey.trim()) return;
    await setFileAccess({ key: fileKey.trim(), access: rule });
  };

  const handleClearFileAccess = async () => {
    if (!fileKey.trim()) return;
    await setFileAccess({ key: fileKey.trim(), access: null });
  };

  const handleSetFolderAccess = async () => {
    if (!folder.trim()) return;
    await setFolderAccess({ folder: folder.trim(), access: rule });
  };

  const handleClearFolderAccess = async () => {
    if (!folder.trim()) return;
    await setFolderAccess({ folder: folder.trim(), access: null });
  };

  return (
    <div className="panel">
      <div className="panel-section">
        <h3>Set Access Rule</h3>
        <div className="row">
          <label>
            File key
            <input
              value={fileKey}
              onChange={(event) => setFileKey(event.target.value)}
              placeholder="file key"
            />
          </label>
          <label>
            Folder
            <input
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              placeholder="profiles"
            />
          </label>
          <label>
            Visibility
            <select
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as Visibility)
              }
            >
              {visibilityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Allow user IDs
            <input
              value={allow}
              onChange={(event) => setAllow(event.target.value)}
              placeholder="user_1,user_2"
            />
          </label>
          <label>
            Deny user IDs
            <input
              value={deny}
              onChange={(event) => setDeny(event.target.value)}
              placeholder="user_3"
            />
          </label>
        </div>
        <div className="row">
          <button className="primary" onClick={handleSetFileAccess}>
            Apply file rule
          </button>
          <button onClick={handleClearFileAccess}>Clear file rule</button>
          <button className="primary" onClick={handleSetFolderAccess}>
            Apply folder rule
          </button>
          <button onClick={handleClearFolderAccess}>Clear folder rule</button>
        </div>
      </div>

      <div className="panel-section">
        <h3>Lookup File (Access check)</h3>
        <div className="row">
          <label>
            File key
            <input
              value={lookupKey}
              onChange={(event) => setLookupKey(event.target.value)}
              placeholder="file key"
            />
          </label>
          <label>
            Viewer user ID
            <input
              value={viewerId}
              onChange={(event) => setViewerId(event.target.value)}
              placeholder="viewer user id"
            />
          </label>
        </div>
        <div className="result">
          <strong>Result:</strong>
          <pre>{lookedUp ? JSON.stringify(lookedUp, null, 2) : "null"}</pre>
        </div>
      </div>
    </div>
  );
}
