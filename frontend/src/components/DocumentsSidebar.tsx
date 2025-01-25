import { FiFile, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Document } from '../types/document';

interface DocumentsSidebarProps {
  documents: Document[];
  currentDocument: Document | null;
  onDeleteDocument: (id: string) => void;
  onSelectDocument: (doc: Document) => void;
}

export function DocumentsSidebar({
  documents,
  currentDocument,
  onDeleteDocument,
  onSelectDocument
}: DocumentsSidebarProps) {
  return (
    <div className="flex flex-col gap-2">
      {documents.length === 0 ? (
        <div className="text-gray-400 text-sm">
          No documents yet
        </div>
      ) : (
        documents.map(doc => (
          <div 
            key={doc.id}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
              currentDocument?.id === doc.id ? 'bg-gray-800' : 'hover:bg-gray-800'
            }`}
            onClick={() => onSelectDocument(doc)}
          >
            <div className="text-sm text-white truncate">
              {doc.title || 'Untitled Document'}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteDocument(doc.id);
              }}
              className="p-1 rounded hover:bg-gray-700"
            >
              <FiTrash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
            </button>
          </div>
        ))
      )}
    </div>
  );
} 