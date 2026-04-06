const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");
const { createExtractorFromFile } = require("node-unrar-js");
const {
  ensureDir,
  normalizeRelativePath,
  resolveInside,
  removeFileIfExists
} = require("./fileService");

const ARCHIVE_METADATA_ROOTS = new Set(["__MACOSX"]);
const ARCHIVE_METADATA_FILES = new Set([".DS_Store", "Thumbs.db"]);

function getArchiveExtension(filePath, originalName = "") {
  return path.extname(originalName || filePath || "").toLowerCase();
}

function splitArchivePath(relativePath) {
  return String(relativePath || "")
    .split("/")
    .filter(Boolean);
}

function shouldIgnoreArchivePath(relativePath) {
  const segments = splitArchivePath(relativePath);

  if (!segments.length) {
    return true;
  }

  if (ARCHIVE_METADATA_ROOTS.has(segments[0])) {
    return true;
  }

  return ARCHIVE_METADATA_FILES.has(segments[segments.length - 1]);
}

function toArchiveEntry(rawPath, isDirectory, payload) {
  const safePath = normalizeRelativePath(rawPath);

  if (shouldIgnoreArchivePath(safePath)) {
    return null;
  }

  return {
    path: safePath,
    isDirectory,
    payload
  };
}

function getDirectorySegments(entry) {
  const directoryPath = entry.isDirectory ? entry.path : path.posix.dirname(entry.path);

  if (!directoryPath || directoryPath === ".") {
    return [];
  }

  return splitArchivePath(directoryPath);
}

function getSharedDirectoryPrefix(entries) {
  if (!entries.length) {
    return "";
  }

  let sharedSegments = getDirectorySegments(entries[0]);

  for (const entry of entries.slice(1)) {
    const currentSegments = getDirectorySegments(entry);
    const maxLength = Math.min(sharedSegments.length, currentSegments.length);
    let sharedLength = 0;

    while (
      sharedLength < maxLength &&
      sharedSegments[sharedLength] === currentSegments[sharedLength]
    ) {
      sharedLength += 1;
    }

    sharedSegments = sharedSegments.slice(0, sharedLength);

    if (!sharedSegments.length) {
      break;
    }
  }

  return sharedSegments.join("/");
}

function stripSharedDirectoryPrefix(relativePath, sharedPrefix) {
  if (!sharedPrefix) {
    return relativePath;
  }

  if (relativePath === sharedPrefix) {
    return "";
  }

  const prefixWithSlash = `${sharedPrefix}/`;

  if (relativePath.startsWith(prefixWithSlash)) {
    return relativePath.slice(prefixWithSlash.length);
  }

  return relativePath;
}

async function extractZipSecure(zipFilePath, destinationRoot) {
  const directory = await unzipper.Open.file(zipFilePath);
  const entries = directory.files
    .map((entry) => toArchiveEntry(entry.path, entry.type === "Directory", entry))
    .filter(Boolean);
  const sharedPrefix = getSharedDirectoryPrefix(entries);

  for (const entry of entries) {
    const relativePath = stripSharedDirectoryPrefix(entry.path, sharedPrefix);

    if (!relativePath) {
      continue;
    }

    const targetPath = resolveInside(destinationRoot, relativePath);

    if (entry.isDirectory) {
      await ensureDir(targetPath);
      continue;
    }

    await ensureDir(path.dirname(targetPath));

    await new Promise((resolve, reject) => {
      entry.payload
        .stream()
        .pipe(fs.createWriteStream(targetPath))
        .on("finish", resolve)
        .on("error", reject);
    });
  }
}

async function extractRarSecure(rarFilePath, destinationRoot) {
  const previewExtractor = await createExtractorFromFile({
    filepath: rarFilePath
  });
  const list = previewExtractor.getFileList();
  const entries = [];

  for (const fileHeader of list.fileHeaders) {
    const entry = toArchiveEntry(
      fileHeader.name,
      Boolean(fileHeader.flags && fileHeader.flags.directory),
      fileHeader
    );

    if (entry) {
      entries.push(entry);
    }
  }

  const sharedPrefix = getSharedDirectoryPrefix(entries);

  for (const entry of entries) {
    if (!entry.isDirectory) {
      continue;
    }

    const relativePath = stripSharedDirectoryPrefix(entry.path, sharedPrefix);

    if (!relativePath) {
      continue;
    }

    const targetPath = resolveInside(destinationRoot, relativePath);
    await ensureDir(targetPath);
  }

  const extractor = await createExtractorFromFile({
    filepath: rarFilePath,
    targetPath: destinationRoot,
    filenameTransform: (filename) => {
      const safePath = normalizeRelativePath(filename);
      const relativePath = stripSharedDirectoryPrefix(safePath, sharedPrefix);

      if (!relativePath) {
        return path.basename(safePath);
      }

      resolveInside(destinationRoot, relativePath);
      return relativePath;
    }
  });
  const extracted = extractor.extract({
    files: (fileHeader) => {
      const entry = toArchiveEntry(
        fileHeader.name,
        Boolean(fileHeader.flags && fileHeader.flags.directory),
        fileHeader
      );

      return Boolean(entry && !entry.isDirectory);
    }
  });

  for (const _ of extracted.files) {
    // Exhaust the iterator so the underlying extractor can free memory.
  }
}

async function extractArchiveSecure(archiveFilePath, destinationRoot, originalName = "") {
  const extension = getArchiveExtension(archiveFilePath, originalName);

  try {
    if (extension === ".zip") {
      await extractZipSecure(archiveFilePath, destinationRoot);
      return;
    }

    if (extension === ".rar") {
      await extractRarSecure(archiveFilePath, destinationRoot);
      return;
    }

    throw new Error("Obslugiwane archiwa to tylko ZIP i RAR.");
  } finally {
    await removeFileIfExists(archiveFilePath);
  }
}

module.exports = {
  extractArchiveSecure,
  extractZipSecure,
  extractRarSecure
};
