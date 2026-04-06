import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  RefreshCcw,
  Save
} from "lucide-react";
import { PanelCard } from "./PanelCard";
import { api } from "../lib/api";

function findFirstFile(node) {
  if (!node) {
    return "";
  }

  if (node.type === "file") {
    return node.path;
  }

  for (const child of node.children || []) {
    const result = findFirstFile(child);
    if (result) {
      return result;
    }
  }

  return "";
}

function treeHasPath(node, targetPath) {
  if (!node) {
    return false;
  }

  if (node.path === targetPath) {
    return true;
  }

  return (node.children || []).some((child) => treeHasPath(child, targetPath));
}

function getParentPath(filePath) {
  if (!filePath || !filePath.includes("/")) {
    return "";
  }

  return filePath.slice(0, filePath.lastIndexOf("/"));
}

function getAncestorDirectories(targetPath) {
  if (!targetPath) {
    return [""];
  }

  const segments = targetPath.split("/").filter(Boolean);
  const ancestors = [""];
  let currentPath = "";

  for (let index = 0; index < segments.length - 1; index += 1) {
    currentPath = currentPath ? `${currentPath}/${segments[index]}` : segments[index];
    ancestors.push(currentPath);
  }

  return ancestors;
}

function composeTargetPath(basePath, rawPath) {
  const normalized = String(rawPath || "").trim().replace(/\\/g, "/");

  if (!normalized) {
    return "";
  }

  if (normalized.includes("/")) {
    return normalized;
  }

  return basePath ? `${basePath}/${normalized}` : normalized;
}

function TreeNode({
  node,
  level,
  expandedPaths,
  onToggleDirectory,
  onSelectFile,
  onSelectDirectory,
  selectedPath,
  selectedDirectory
}) {
  const isDirectory = node.type === "directory";
  const isExpanded = expandedPaths.has(node.path);
  const isSelectedFile = !isDirectory && selectedPath === node.path;
  const isSelectedDirectory = isDirectory && selectedDirectory === node.path;
  const paddingLeft = `${Math.max(level, 0) * 14}px`;

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (isDirectory) {
            onToggleDirectory(node.path);
            onSelectDirectory(node.path);
          } else {
            onSelectFile(node.path);
          }
        }}
        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
          isSelectedFile || isSelectedDirectory
            ? "bg-cyber/12 text-white ring-1 ring-cyber/30"
            : "text-slate-300 hover:bg-slate-900/80 hover:text-white"
        }`}
        style={{ paddingLeft }}
      >
        {isDirectory ? (
          isExpanded ? (
            <ChevronDown size={14} className="shrink-0 text-slate-500" />
          ) : (
            <ChevronRight size={14} className="shrink-0 text-slate-500" />
          )
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        {isDirectory ? (
          isExpanded ? (
            <FolderOpen size={16} className="shrink-0 text-neon" />
          ) : (
            <Folder size={16} className="shrink-0 text-neon" />
          )
        ) : (
          <FileCode2 size={16} className="shrink-0 text-cyber" />
        )}
        <span className="min-w-0 truncate">{node.name || "/"}</span>
      </button>

      {isDirectory && isExpanded && node.children?.length ? (
        <div className="mt-1 space-y-1">
          {node.children.map((child) => (
            <TreeNode
              key={child.path || child.name}
              node={child}
              level={level + 1}
              expandedPaths={expandedPaths}
              onToggleDirectory={onToggleDirectory}
              onSelectFile={onSelectFile}
              onSelectDirectory={onSelectDirectory}
              selectedPath={selectedPath}
              selectedDirectory={selectedDirectory}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectWorkspace({
  botId,
  token,
  refreshSignal,
  onFeedback,
  onError
}) {
  const [tree, setTree] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(new Set([""]));
  const [selectedPath, setSelectedPath] = useState("");
  const [selectedDirectory, setSelectedDirectory] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingFile, setLoadingFile] = useState(false);
  const [savingFile, setSavingFile] = useState(false);
  const [creatingFile, setCreatingFile] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [newFilePath, setNewFilePath] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");

  async function loadFile(filePath) {
    setLoadingFile(true);

    try {
      const data = await api.get(
        `/bots/${botId}/files/content?path=${encodeURIComponent(filePath)}`,
        token
      );
      setSelectedPath(data.path);
      setSelectedDirectory(getParentPath(data.path));
      setEditorContent(data.content || "");
      setDirty(false);
    } catch (error) {
      onError(error.message);
    } finally {
      setLoadingFile(false);
    }
  }

  async function loadTree(preferredPath = "") {
    setLoadingTree(true);

    try {
      const data = await api.get(`/bots/${botId}/files/tree`, token);
      const nextTree = data.tree;
      setTree(nextTree);

      const nextSelection =
        preferredPath && treeHasPath(nextTree, preferredPath)
          ? preferredPath
          : selectedPath && treeHasPath(nextTree, selectedPath)
            ? selectedPath
            : findFirstFile(nextTree);

      setExpandedPaths((current) => {
        const next = new Set(current);
        getAncestorDirectories(nextSelection).forEach((item) => next.add(item));
        next.add("");
        return next;
      });

      if (nextSelection) {
        await loadFile(nextSelection);
      } else {
        setSelectedPath("");
        setEditorContent("");
        setDirty(false);
      }
    } catch (error) {
      onError(error.message);
    } finally {
      setLoadingTree(false);
    }
  }

  useEffect(() => {
    loadTree().catch(() => null);
  }, [botId, token, refreshSignal]);

  function toggleDirectory(directoryPath) {
    setExpandedPaths((current) => {
      const next = new Set(current);

      if (next.has(directoryPath)) {
        next.delete(directoryPath);
      } else {
        next.add(directoryPath);
      }

      next.add("");
      return next;
    });
  }

  async function handleSaveFile() {
    if (!selectedPath) {
      return;
    }

    setSavingFile(true);

    try {
      await api.put(
        `/bots/${botId}/files/content`,
        {
          path: selectedPath,
          content: editorContent
        },
        token
      );
      setDirty(false);
      onFeedback(`Zapisano ${selectedPath}`);
      await loadTree(selectedPath);
    } catch (error) {
      onError(error.message);
    } finally {
      setSavingFile(false);
    }
  }

  async function handleCreateFolder(event) {
    event.preventDefault();
    const targetPath = composeTargetPath(selectedDirectory, newFolderPath);

    if (!targetPath) {
      onError("Podaj nazwe folderu albo pelna sciezke wzgledna.");
      return;
    }

    setCreatingFolder(true);

    try {
      await api.post(
        `/bots/${botId}/files/folder`,
        {
          path: targetPath
        },
        token
      );
      setNewFolderPath("");
      setSelectedDirectory(targetPath);
      setExpandedPaths((current) => new Set([...current, "", targetPath]));
      onFeedback(`Utworzono folder ${targetPath}`);
      await loadTree();
    } catch (error) {
      onError(error.message);
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleCreateFile(event) {
    event.preventDefault();
    const targetPath = composeTargetPath(selectedDirectory, newFilePath);

    if (!targetPath) {
      onError("Podaj nazwe pliku albo pelna sciezke wzgledna.");
      return;
    }

    setCreatingFile(true);

    try {
      const data = await api.post(
        `/bots/${botId}/files/file`,
        {
          path: targetPath,
          content: ""
        },
        token
      );
      setNewFilePath("");
      onFeedback(`Utworzono plik ${data.path}`);
      await loadTree(data.path);
    } catch (error) {
      onError(error.message);
    } finally {
      setCreatingFile(false);
    }
  }

  return (
    <PanelCard
      eyebrow="Pliki"
      title="Menedzer plikow"
      description="Uklad zblizony do zakladki plikow w hostingu: drzewo katalogow po lewej i edytor aktywnego pliku po prawej."
      actions={
        <button
          type="button"
          onClick={() => loadTree(selectedPath).catch(() => null)}
          className="button-base border-[#2e4669] bg-[#122033] text-slate-100 hover:border-sky-500/40 hover:text-sky-200"
        >
          <RefreshCcw size={16} className="mr-2" />
          Odswiez pliki
        </button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[#243448] bg-[#0a1321] p-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Aktywny katalog
            </p>
            <p className="mt-2 break-all font-mono text-xs text-slate-200">
              {selectedDirectory || "/"}
            </p>
          </div>

          <form
            onSubmit={handleCreateFolder}
            className="rounded-[1.5rem] border border-[#243448] bg-[#0a1321] p-4"
          >
            <label className="block text-sm font-medium text-white">Nowy folder</label>
            <input
              type="text"
              value={newFolderPath}
              onChange={(event) => setNewFolderPath(event.target.value)}
              placeholder="commands or src/events"
              className="input-base mt-3"
            />
            <button
              type="submit"
              disabled={creatingFolder}
              className="button-base mt-3 w-full border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
            >
              <FolderPlus size={16} className="mr-2" />
              {creatingFolder ? "Tworzenie..." : "Utworz folder"}
            </button>
          </form>

          <form
            onSubmit={handleCreateFile}
            className="rounded-[1.5rem] border border-[#243448] bg-[#0a1321] p-4"
          >
            <label className="block text-sm font-medium text-white">Nowy plik</label>
            <input
              type="text"
              value={newFilePath}
              onChange={(event) => setNewFilePath(event.target.value)}
              placeholder="index.js or commands/ping.js"
              className="input-base mt-3"
            />
            <button
              type="submit"
              disabled={creatingFile}
              className="button-base mt-3 w-full border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
            >
              <FilePlus2 size={16} className="mr-2" />
              {creatingFile ? "Tworzenie..." : "Utworz plik"}
            </button>
          </form>

          <div className="rounded-[1.5rem] border border-[#243448] bg-[#0a1321] p-3">
            <div className="mb-2 px-2 font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Drzewo plikow
            </div>
            <div className="max-h-[420px] overflow-auto pr-1">
              {loadingTree ? (
                <div className="px-2 py-3 text-sm text-slate-400">Ladowanie drzewa projektu...</div>
              ) : tree?.children?.length ? (
                <div className="space-y-1">
                  {tree.children.map((node) => (
                    <TreeNode
                      key={node.path || node.name}
                      node={node}
                      level={0}
                      expandedPaths={expandedPaths}
                      onToggleDirectory={toggleDirectory}
                      onSelectFile={(pathValue) => loadFile(pathValue).catch(() => null)}
                      onSelectDirectory={setSelectedDirectory}
                      selectedPath={selectedPath}
                      selectedDirectory={selectedDirectory}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-2 py-3 text-sm text-slate-400">
                  Projekt jest jeszcze pusty. Wgraj archiwum albo stworz pliki tutaj.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-[#243448] bg-[#0a1321] p-4">
          <div className="flex flex-col gap-3 border-b border-[#243448] pb-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Edytor
              </p>
              <p className="mt-2 break-all font-mono text-xs text-slate-200">
                {selectedPath || "Wybierz albo utworz plik, aby zaczac edycje."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveFile}
              disabled={!selectedPath || savingFile || !dirty}
              className="button-base border-emerald-400/25 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/20"
            >
              <Save size={16} className="mr-2" />
              {savingFile ? "Zapisywanie..." : dirty ? "Zapisz plik" : "Zapisane"}
            </button>
          </div>

          <textarea
            value={editorContent}
            onChange={(event) => {
              setEditorContent(event.target.value);
              setDirty(true);
            }}
            spellCheck="false"
            disabled={!selectedPath || loadingFile}
            className="mt-4 min-h-[620px] w-full resize-y rounded-[1.5rem] border border-line bg-[#050a12] p-4 font-mono text-[13px] leading-6 text-slate-100 outline-none transition focus:border-cyber focus:ring-2 focus:ring-cyber/20 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={
              loadingFile
                ? "Ladowanie pliku..."
                : "Wybierz plik z drzewa albo utworz nowy, aby zaczac pisac kod."
            }
          />
        </div>
      </div>
    </PanelCard>
  );
}
