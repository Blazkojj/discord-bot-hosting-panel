const fs = require("fs");
const path = require("path");
const {
  ensureDir,
  resolveInside,
  readTextFile,
  writeTextFile
} = require("./fileService");

const IGNORED_DIRECTORIES = new Set(["node_modules", ".runtime", ".git"]);
const MAX_TREE_ENTRIES = 1500;
const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;

function toRelativePosix(rootPath, targetPath) {
  const relativePath = path.relative(rootPath, targetPath);
  return relativePath ? relativePath.split(path.sep).join("/") : "";
}

async function buildTree(rootPath, currentPath, context) {
  const dirEntries = await fs.promises.readdir(currentPath, {
    withFileTypes: true
  });

  const visibleEntries = dirEntries
    .filter((entry) => !(entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)))
    .sort((left, right) => {
      if (left.isDirectory() && !right.isDirectory()) {
        return -1;
      }

      if (!left.isDirectory() && right.isDirectory()) {
        return 1;
      }

      return left.name.localeCompare(right.name);
    });

  const children = [];

  for (const entry of visibleEntries) {
    if (context.entryCount >= MAX_TREE_ENTRIES) {
      break;
    }

    context.entryCount += 1;

    const fullPath = path.join(currentPath, entry.name);
    const relativePath = toRelativePosix(rootPath, fullPath);

    if (entry.isDirectory()) {
      children.push({
        type: "directory",
        name: entry.name,
        path: relativePath,
        children: await buildTree(rootPath, fullPath, context)
      });
      continue;
    }

    const stats = await fs.promises.stat(fullPath);
    children.push({
      type: "file",
      name: entry.name,
      path: relativePath,
      size: stats.size
    });
  }

  return children;
}

async function listProjectTree(botPath) {
  const rootPath = path.resolve(botPath);
  const context = {
    entryCount: 0
  };

  return {
    type: "directory",
    name: path.basename(rootPath),
    path: "",
    children: await buildTree(rootPath, rootPath, context)
  };
}

async function ensureFileTarget(botPath, relativePath) {
  const targetPath = resolveInside(botPath, relativePath);
  const stats = await fs.promises.stat(targetPath).catch(() => null);

  if (!stats) {
    throw new Error("Nie znaleziono wskazanego pliku.");
  }

  if (!stats.isFile()) {
    throw new Error("Wskazana sciezka nie jest plikiem.");
  }

  if (stats.size > MAX_TEXT_FILE_BYTES) {
    throw new Error("Plik jest zbyt duzy do edycji w panelu.");
  }

  return targetPath;
}

async function readProjectFile(botPath, relativePath) {
  const targetPath = await ensureFileTarget(botPath, relativePath);
  return readTextFile(targetPath, "");
}

async function writeProjectFile(botPath, relativePath, contents) {
  const targetPath = resolveInside(botPath, relativePath);
  const stats = await fs.promises.stat(targetPath).catch(() => null);

  if (stats && stats.isDirectory()) {
    throw new Error("Nie mozna zapisac folderu jako pliku.");
  }

  await writeTextFile(targetPath, contents);
  return toRelativePosix(path.resolve(botPath), targetPath);
}

async function createProjectFolder(botPath, relativePath) {
  const targetPath = resolveInside(botPath, relativePath);
  const stats = await fs.promises.stat(targetPath).catch(() => null);

  if (stats && !stats.isDirectory()) {
    throw new Error("Pod ta sciezka istnieje juz plik.");
  }

  await ensureDir(targetPath);
  return toRelativePosix(path.resolve(botPath), targetPath);
}

async function createProjectFile(botPath, relativePath, contents = "") {
  const targetPath = resolveInside(botPath, relativePath);
  const stats = await fs.promises.stat(targetPath).catch(() => null);

  if (stats && stats.isDirectory()) {
    throw new Error("Pod ta sciezka istnieje juz folder.");
  }

  await writeTextFile(targetPath, contents);
  return toRelativePosix(path.resolve(botPath), targetPath);
}

module.exports = {
  listProjectTree,
  readProjectFile,
  writeProjectFile,
  createProjectFolder,
  createProjectFile
};
