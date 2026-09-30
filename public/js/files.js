// Offering files to the person (export) and reading files they pick (import).

/**
 * Saves a text file.
 * - In a normal browser: a regular download.
 * - Inside a claude.ai artifact: through the viewer's download capability.
 * - Otherwise: copies the content to the clipboard as a last resort.
 * @returns {Promise<"downloaded"|"saved"|"declined"|"busy"|"copied"|"unavailable">}
 */
export async function saveTextFile(filename, content) {
  const host = globalThis.claude;
  if (!host) return browserDownload(filename, content);

  let downloads = null;
  try {
    downloads = await host.use?.("downloads");
  } catch {
    downloads = null;
  }
  if (downloads) {
    try {
      await downloads.save({ filename, data: content });
      return "saved";
    } catch (error) {
      if (error?.code === "declined") return "declined";
      if (error?.code === "rate_limited") return "busy";
    }
  }
  try {
    await navigator.clipboard.writeText(content);
    return "copied";
  } catch {
    return "unavailable";
  }
}

function browserDownload(filename, content) {
  const type = filename.endsWith(".csv") ? "text/csv;charset=utf-8" : "application/json";
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}

/** Reads a file chosen in an <input type="file"> and parses it as JSON. */
export async function readJsonFile(file) {
  return JSON.parse(await file.text());
}
