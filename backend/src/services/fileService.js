const fs = require("fs");
const path = require("path");

async function ensureDir(targetPath) {
  await fs.promises.mkdir(targetPath, { recursive: true });
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function normalizeRelativePath(rawPath) {
  const withoutDrive = String(rawPath || "")
    .replace(/\\/g, "/")
    .replace(/^[a-zA-Z]:/, "")
    .replace(/^\/+/, "");

  const normalized = path.posix.normalize(withoutDrive);

  if (!normalized || normalized === "." || normalized.startsWith("..")) {
    throw new Error("Nieprawidłowa ścieżka pliku w uploadzie.");
  }

  return normalized;
}

function resolveInside(baseDir, rawRelativePath) {
  const safeRelativePath = normalizeRelativePath(rawRelativePath);
  const resolvedBase = path.resolve(baseDir);
  const targetPath = path.resolve(baseDir, safeRelativePath);

  if (
    targetPath !== resolvedBase &&
    !targetPath.startsWith(`${resolvedBase}${path.sep}`)
  ) {
    throw new Error("Próba zapisu poza katalogiem bota została zablokowana.");
  }

  return targetPath;
}

async function removeFileIfExists(filePath) {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function removeDirectoryInside(baseDir, directoryPath) {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(directoryPath);

  if (
    resolvedTarget === resolvedBase ||
    !resolvedTarget.startsWith(`${resolvedBase}${path.sep}`)
  ) {
    throw new Error("Proba usuniecia katalogu poza dozwolonym obszarem zostala zablokowana.");
  }

  await fs.promises.rm(resolvedTarget, {
    recursive: true,
    force: true
  });
}

async function removeUploadedTempFiles(uploadMap = {}) {
  const allFiles = Object.values(uploadMap).flat();
  await Promise.all(allFiles.map((file) => removeFileIfExists(file.path)));
}

async function copyUploadedFiles(destinationRoot, files = []) {
  for (const file of files) {
    const destinationPath = resolveInside(
      destinationRoot,
      file.originalname || file.filename
    );

    await ensureDir(path.dirname(destinationPath));
    await fs.promises.copyFile(file.path, destinationPath);
    await removeFileIfExists(file.path);
  }
}

async function readTextFile(filePath, fallback = "") {
  try {
    return await fs.promises.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function writeTextFile(filePath, contents) {
  await ensureDir(path.dirname(filePath));
  await fs.promises.writeFile(filePath, contents, "utf8");
}

async function pathExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

function parseEnvToObject(rawEnv) {
  return rawEnv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .reduce((accumulator, line) => {
      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key) {
        accumulator[key] = value;
      }

      return accumulator;
    }, {});
}

async function readEnvAsObject(filePath) {
  const rawEnv = await readTextFile(filePath, "");
  return parseEnvToObject(rawEnv);
}

async function tailTextFile(filePath, limit = 200) {
  const content = await readTextFile(filePath, "");
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-limit);
}

module.exports = {
  ensureDir,
  slugify,
  normalizeRelativePath,
  resolveInside,
  removeFileIfExists,
  removeDirectoryInside,
  removeUploadedTempFiles,
  copyUploadedFiles,
  readTextFile,
  writeTextFile,
  pathExists,
  parseEnvToObject,
  readEnvAsObject,
  tailTextFile
};
