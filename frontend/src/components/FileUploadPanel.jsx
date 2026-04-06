import { useState } from "react";
import { UploadCloud, FolderUp, FileArchive, Files } from "lucide-react";

export function FileUploadPanel({ onUpload, uploading }) {
  const [archiveFile, setArchiveFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [directoryFiles, setDirectoryFiles] = useState([]);

  function handleArchiveChange(event) {
    setArchiveFile(event.target.files?.[0] || null);
  }

  function handleFilesChange(event) {
    setSelectedFiles(Array.from(event.target.files || []));
  }

  function handleDirectoryChange(event) {
    setDirectoryFiles(Array.from(event.target.files || []));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onUpload({
      archiveFile,
      selectedFiles: [...selectedFiles, ...directoryFiles]
    });
    setArchiveFile(null);
    setSelectedFiles([]);
    setDirectoryFiles([]);
    event.target.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-3">
        <label className="rounded-[1.6rem] border border-dashed border-[#304765] bg-[#0a1321] p-5 transition hover:border-sky-500/40">
          <div className="flex items-center gap-3 text-sky-200">
            <FileArchive size={20} />
            <span className="text-sm font-medium">Upload ZIP / RAR</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Wgraj archiwum projektu. Backend obsluguje ZIP i RAR oraz usuwa zbedny wspolny folder nadrzedny, jesli archiwum go ma.
          </p>
          <input
            type="file"
            accept=".zip,.rar"
            onChange={handleArchiveChange}
            className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-2xl file:border-0 file:bg-sky-500/15 file:px-4 file:py-2 file:text-sky-200"
          />
          {archiveFile ? (
            <p className="mt-3 font-mono text-xs text-slate-500">{archiveFile.name}</p>
          ) : null}
        </label>

        <label className="rounded-[1.6rem] border border-dashed border-[#304765] bg-[#0a1321] p-5 transition hover:border-emerald-400/40">
          <div className="flex items-center gap-3 text-emerald-200">
            <Files size={20} />
            <span className="text-sm font-medium">Pojedyncze pliki</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Wgraj wiele plikow na raz, jesli nie chcesz pakowac projektu do ZIP-a.
          </p>
          <input
            type="file"
            multiple
            onChange={handleFilesChange}
            className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-2xl file:border-0 file:bg-emerald-400/15 file:px-4 file:py-2 file:text-emerald-200"
          />
          <p className="mt-3 font-mono text-xs text-slate-500">
            {selectedFiles.length ? `${selectedFiles.length} plikow gotowych do wyslania` : "Brak wybranych plikow"}
          </p>
        </label>

        <label className="rounded-[1.6rem] border border-dashed border-[#304765] bg-[#0a1321] p-5 transition hover:border-emerald-400/40">
          <div className="flex items-center gap-3 text-emerald-200">
            <FolderUp size={20} />
            <span className="text-sm font-medium">Caly folder</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Wybierz katalog projektu, aby zachowac strukture podfolderow podczas uploadu.
          </p>
          <input
            type="file"
            multiple
            webkitdirectory=""
            directory=""
            onChange={handleDirectoryChange}
            className="mt-4 block w-full text-sm text-slate-300 file:mr-4 file:rounded-2xl file:border-0 file:bg-emerald-400/15 file:px-4 file:py-2 file:text-emerald-200"
          />
          <p className="mt-3 font-mono text-xs text-slate-500">
            {directoryFiles.length ? `${directoryFiles.length} plikow katalogu gotowych do wyslania` : "Brak wybranego folderu"}
          </p>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            uploading ||
            (!archiveFile && selectedFiles.length === 0 && directoryFiles.length === 0)
          }
          className="button-base border-sky-500/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20"
        >
          <UploadCloud size={16} className="mr-2" />
          {uploading ? "Wgrywanie..." : "Wgraj projekt"}
        </button>
      </div>
    </form>
  );
}
