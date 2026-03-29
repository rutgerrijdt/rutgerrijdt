'use client';

import { useRef, useState } from 'react';
import type { UploadedDocument, DocumentCategory } from '@/lib/types';

interface Props {
  documents: UploadedDocument[];
  onChange: (docs: UploadedDocument[]) => void;
}

const CATEGORIES: { value: DocumentCategory; label: string; description: string }[] = [
  { value: 'inkomen', label: 'Inkomen', description: 'Loonstroken, jaaropgave, aangifte IB, jaarrekening' },
  { value: 'identiteit', label: 'Identiteit', description: 'Paspoort, rijbewijs, verblijfsvergunning' },
  { value: 'woning', label: 'Woning', description: 'Koopakte, taxatierapport, bouwkundig rapport' },
  { value: 'belasting', label: 'Belasting', description: 'Belastingaangifte, aanslagen, IB-60' },
  { value: 'overig', label: 'Overig', description: 'Bankafschriften, scheidingsconvenant, etc.' },
];

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const MAX_FILE_MB = 10;

export function DocumentUpload({ documents, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>('inkomen');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const processFiles = async (files: FileList) => {
    setUploading(true);
    const { v4: uuidv4 } = await import('uuid');
    const newDocs: UploadedDocument[] = [];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_MB * 1024 * 1024) {
        alert(`Bestand "${file.name}" is groter dan ${MAX_FILE_MB} MB en wordt overgeslagen.`);
        continue;
      }

      const dataUrl = await readFileAsDataUrl(file);
      newDocs.push({
        id: uuidv4(),
        name: file.name,
        fileType: file.type,
        fileSize: file.size,
        category: selectedCategory,
        uploadedAt: new Date().toISOString(),
        dataUrl,
      });
    }

    onChange([...documents, ...newDocs]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const removeDoc = (id: string) => onChange(documents.filter((d) => d.id !== id));

  const updateDoc = (id: string, updates: Partial<UploadedDocument>) => {
    onChange(documents.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    setEditingId(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    docs: documents.filter((d) => d.category === cat.value),
  }));

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-800">Documenten uploaden</h3>

      {/* Category selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categorie document</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition ${
                selectedCategory === cat.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {CATEGORIES.find((c) => c.value === selectedCategory)?.description}
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
          dragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        {uploading ? (
          <p className="text-sm text-blue-600 font-medium">Bezig met uploaden...</p>
        ) : (
          <>
            <div className="text-4xl mb-2">📎</div>
            <p className="text-sm font-medium text-gray-700">
              Klik om bestanden te selecteren of sleep ze hiernaartoe
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC — max. {MAX_FILE_MB} MB per bestand</p>
          </>
        )}
      </div>

      {/* Required documents checklist */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">Benodigde documenten</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-blue-700">
          {[
            'Geldig legitimatiebewijs',
            'Laatste 3 loonstroken',
            'Jaaropgave (laatste 2 jaar)',
            'Werkgeversverklaring',
            'Voorlopige koopakte / koopovereenkomst',
            'Taxatierapport',
            'Bankafschriften (laatste 3 maanden)',
            'Belastingaangiften (IZP: laatste 3 jaar)',
            'Jaarrekeningen (ondernemer: 3 jaar)',
          ].map((item) => {
            const uploaded = documents.length > 0;
            return (
              <div key={item} className="flex items-center gap-1.5">
                <span>{uploaded ? '□' : '□'}</span>
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document list grouped by category */}
      {documents.length > 0 && (
        <div className="space-y-4">
          {grouped
            .filter((g) => g.docs.length > 0)
            .map((group) => (
              <div key={group.value}>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  {group.label} ({group.docs.length})
                </h4>
                <div className="space-y-2">
                  {group.docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2"
                    >
                      {editingId === doc.id ? (
                        <EditDocRow
                          doc={doc}
                          onSave={(updates) => updateDoc(doc.id, updates)}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl">{getFileIcon(doc.fileType)}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                              <p className="text-xs text-gray-400">
                                {formatSize(doc.fileSize)} &middot;{' '}
                                {new Date(doc.uploadedAt).toLocaleDateString('nl-NL')}
                                {doc.description && ` · ${doc.description}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <a
                              href={doc.dataUrl}
                              download={doc.name}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Download
                            </a>
                            <button
                              onClick={() => setEditingId(doc.id)}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Bewerken
                            </button>
                            <button
                              onClick={() => removeDoc(doc.id)}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Verwijderen
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function EditDocRow({
  doc,
  onSave,
  onCancel,
}: {
  doc: UploadedDocument;
  onSave: (updates: Partial<UploadedDocument>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(doc.name);
  const [category, setCategory] = useState<DocumentCategory>(doc.category);
  const [description, setDescription] = useState(doc.description ?? '');

  return (
    <div className="flex flex-wrap items-center gap-2 w-full">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-0"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as DocumentCategory)}
        className="border border-gray-300 rounded px-2 py-1 text-sm bg-white"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Omschrijving"
        className="border border-gray-300 rounded px-2 py-1 text-sm w-32"
      />
      <button
        onClick={() => onSave({ name, category, description })}
        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
      >
        Opslaan
      </button>
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">
        Annuleren
      </button>
    </div>
  );
}

function getFileIcon(fileType: string): string {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word') || fileType.includes('doc')) return '📝';
  return '📎';
}
