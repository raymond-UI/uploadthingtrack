# UploadThing File Tracker — What It Does.

Think of this component as the **“memory and rules”** layer for your uploads.
UploadThing handles the actual file storage. This component makes sure your app
knows **who uploaded what**, **who is allowed to see it**, and **when it should expire**.

---

## 1) Keeps a clean record of every upload
For each file, it stores the important details:
- The file’s URL
- The UploadThing key
- The file name
- Size and file type
- When it was uploaded

That means you can always list files, show them in your UI, or run analytics.

---

## 2) Connects every file to a user
Each file is tied to a `userId` (passed from your app), so you can:
- Show a user only their own files
- Build user dashboards
- Enforce ownership

---

## 3) Access control built in
You can define who can access a file:
- **Public**: anyone can see it
- **Private**: only the owner can see it
- **Restricted**: only specific user IDs can see it

You can set rules **per file** or **per folder**.

---

## 4) Folders act like shared rules
If you want a whole group of files to share the same rules,
put them in the same folder and set rules once for the folder.

File‑level rules always override folder rules.

---

## 5) Supports replacements
If a user uploads a new file using the **same key**, the component:
- Updates the record
- Marks it as replaced

This is perfect for “replace avatar” or “update document” flows.

---

## 6) Tags and filters
You can tag files (e.g. `avatar`, `invoice`, `video`).
Then you can filter queries by:
- User
- File type
- Tag
- Folder

---

## 7) Expiration and cleanup
You can set files to expire automatically:
- Per file
- Per file type
- Per MIME type
- Or a default rule

Expired file records can be cleaned up on a schedule.

---

## 8) Secure webhook verification
When UploadThing notifies your backend that an upload is done,
this component verifies the signature so only real callbacks are accepted.

This prevents fake or malicious upload records.

---

## 9) Simple usage stats
You can query:
- Total files per user
- Total storage used per user

This makes it easy to build dashboards or quotas.

---

## In short
UploadThing gives you storage.
This component gives you:
- Ownership
- Permissions
- Lifecycle control
- Searchable records
- Safety checks

It’s the part that makes uploads behave like real data in your app.
