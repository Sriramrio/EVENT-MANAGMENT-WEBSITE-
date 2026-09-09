import React, { useState, useRef, useEffect } from 'react';
import { 
  Paperclip, 
  UploadCloud, 
  Download, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  File, 
  Plus, 
  Check, 
  X,
  FileCheck2,
  StickyNote
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';

export interface MeetingAttachment {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  dataBase64: string;
  noteText?: string;
}

interface MeetingAttachmentsSectionProps {
  meetingId: string;
  storageKey: string;
  readOnly?: boolean;
  accentColor?: 'blue' | 'orange';
  onAttachmentsChange?: (attachments: MeetingAttachment[]) => void;
}

export function MeetingAttachmentsSection({
  meetingId,
  storageKey,
  readOnly = false,
  accentColor = 'blue',
  onAttachmentsChange
}: MeetingAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<MeetingAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Load from sessionStorage on mount or meetingId change
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as MeetingAttachment[];
        if (Array.isArray(parsed)) {
          setAttachments(parsed);
          onAttachmentsChange?.(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [meetingId, storageKey]);

  // Persist helper
  const saveAttachments = (updated: MeetingAttachment[]) => {
    setAttachments(updated);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist attachments to sessionStorage:', e);
    }
    onAttachmentsChange?.(updated);
  };

  const readFileAsBase64 = (file: globalThis.File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFiles = async (filesList: FileList | globalThis.File[]) => {
    const files = Array.from(filesList);
    if (!files.length) return;

    const newAttachments: MeetingAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      try {
        const base64 = await readFileAsBase64(f);
        const ext = f.name.split('.').pop()?.toUpperCase() || 'FILE';
        newAttachments.push({
          id: `att-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          name: f.name,
          size: formatFileSize(f.size),
          type: ext,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dataBase64: base64
        });
      } catch (err) {
        console.error('Failed to read file:', f.name, err);
        toast.error(`Could not attach ${f.name}`);
      }
    }

    if (newAttachments.length > 0) {
      const updated = [...attachments, ...newAttachments];
      saveAttachments(updated);
      toast.success(
        newAttachments.length === 1 
          ? `Attached ${newAttachments[0].name}` 
          : `Attached ${newAttachments.length} files successfully`
      );
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemove = (id: string, name: string) => {
    const updated = attachments.filter(a => a.id !== id);
    saveAttachments(updated);
    toast.success(`Removed ${name}`);
  };

  const handleSaveTextNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) return;

    const title = noteTitle.trim() || 'Meeting Quick Note';
    const content = noteContent.trim();
    // Create text data URL
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newNote: MeetingAttachment = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: `${title}.txt`,
        size: formatFileSize(blob.size),
        type: 'NOTE',
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dataBase64: base64,
        noteText: content
      };
      const updated = [...attachments, newNote];
      saveAttachments(updated);
      setNoteTitle('');
      setNoteContent('');
      setIsAddingNote(false);
      toast.success(`Note "${title}" attached`);
    };
    reader.readAsDataURL(blob);
  };

  const getFileIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'NOTE') return <StickyNote className="h-4 w-4 text-amber-500" />;
    if (['PDF'].includes(t)) return <FileText className="h-4 w-4 text-red-500" />;
    if (['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP', 'SVG'].includes(t)) return <ImageIcon className="h-4 w-4 text-purple-500" />;
    if (['XLS', 'XLSX', 'CSV'].includes(t)) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    return <File className="h-4 w-4 text-blue-500" />;
  };

  const isOrange = accentColor === 'orange';
  const badgeClasses = isOrange 
    ? 'bg-orange-50 text-orange-700 border-orange-200' 
    : 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <div className="mt-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className={`h-4 w-4 ${isOrange ? 'text-orange-600' : 'text-blue-600'}`} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Meeting Attachments & Documents
          </h3>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeClasses}`}>
            {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileInputChange} 
              multiple 
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.zip" 
              className="hidden" 
            />
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsAddingNote(v => !v)}
              className="px-2.5 py-1 text-xs font-semibold gap-1.5 h-8"
            >
              <Plus className="h-3.5 w-3.5" /> Quick Note
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 text-xs font-semibold gap-1.5 h-8"
            >
              <Paperclip className="h-3.5 w-3.5" /> Attach File
            </Button>
          </div>
        )}
      </div>

      {/* Quick Add Note Form */}
      {isAddingNote && !readOnly && (
        <form onSubmit={handleSaveTextNote} className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <StickyNote className="h-3.5 w-3.5 text-amber-600" /> Attach Quick Meeting Note
            </span>
            <button 
              type="button" 
              onClick={() => setIsAddingNote(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Note title (e.g. Specification agreement, Pricing remark)"
            value={noteTitle}
            onChange={e => setNoteTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none mb-2 bg-white"
          />
          <textarea
            rows={2}
            placeholder="Write note content to attach..."
            value={noteContent}
            onChange={e => setNoteContent(e.target.value)}
            className="w-full rounded-md border border-slate-300 p-2 text-xs focus:border-blue-500 focus:outline-none resize-none bg-white"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsAddingNote(false)} className="px-2.5 py-1 text-xs h-7">
              Cancel
            </Button>
            <Button type="submit" className="px-3 py-1 text-xs h-7">
              <Check className="h-3 w-3 mr-1" /> Attach Note
            </Button>
          </div>
        </form>
      )}

      {/* Drag & Drop Upload Zone (Interactive when not read-only) */}
      {!readOnly && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              await handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-3 cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
            isDragging 
              ? (isOrange ? 'border-orange-500 bg-orange-50/50' : 'border-blue-500 bg-blue-50/50') 
              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
          }`}
        >
          <UploadCloud className={`mx-auto h-7 w-7 ${isDragging ? (isOrange ? 'text-orange-600' : 'text-blue-600') : 'text-slate-400'}`} />
          <p className="mt-1 text-xs font-semibold text-slate-700">
            Click to upload or drag & drop files here
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            PDF, DOCX, XLSX, Images, CAD drawings, Quotation files, or Text (Max 15MB each)
          </p>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 ? (
        <div className="mt-3 space-y-2">
          {attachments.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded bg-white border border-slate-200 shadow-2xs">
                  {getFileIcon(file.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-semibold text-slate-800" title={file.name}>
                      {file.name}
                    </span>
                    <span className="shrink-0 rounded bg-slate-200/70 px-1.5 py-0.2 text-[9px] font-bold text-slate-600 uppercase">
                      {file.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>Uploaded {file.uploadedAt}</span>
                    {file.noteText && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-500 truncate max-w-[200px]">"{file.noteText}"</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a 
                  href={file.dataBase64} 
                  download={file.name}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-2xs"
                  title="Download / View document"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemove(file.id, file.name)}
                    className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-red-600 hover:border-red-200 shadow-2xs"
                    title="Remove attachment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-center py-2 text-slate-400 text-xs">
          {readOnly ? (
            <p className="italic text-[11px]">No documents were attached during this meeting.</p>
          ) : (
            <p className="text-[11px]">Attach drawings, specifications, quotations, or notes during your discussion.</p>
          )}
        </div>
      )}
    </div>
  );
}
