export function EnvEditor({ value, onChange, onSave, saving }) {
  return (
    <div className="space-y-4">
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-base min-h-[260px] resize-y font-mono text-xs leading-6"
        spellCheck="false"
        placeholder={"TOKEN=\nCLIENT_ID=\n"}
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="button-base border-neon/40 bg-neon/10 text-neon hover:bg-neon/20"
        >
          {saving ? "Zapisywanie..." : "Zapisz .env"}
        </button>
      </div>
    </div>
  );
}
