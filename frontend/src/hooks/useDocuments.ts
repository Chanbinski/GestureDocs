import { useState, useEffect } from 'react';
import { Document } from '../types/document';

const STORAGE_KEY = 'gesture_docs_documents';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load documents from localStorage on initial mount
  useEffect(() => {
    const savedDocs = localStorage.getItem(STORAGE_KEY);
    if (savedDocs) {
      const parsedDocs = JSON.parse(savedDocs).map((doc: any) => ({
        ...doc,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt)
      }));
      setDocuments(parsedDocs);
      // If there are documents but none selected, select the first one
      if (parsedDocs.length > 0 && !currentDocument) {
        setCurrentDocument(parsedDocs[0]);
        setDocumentTitle(parsedDocs[0].title);
      } else {
        createNewDocument();
      }
    }
  }, []);

  const createNewDocument = () => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: '',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setDocuments(prevDocs => [newDoc, ...prevDocs]);
    setCurrentDocument(newDoc);
    setDocumentTitle('');
    setUnsavedChanges(false);
  };

  const updateCurrentDocument = (updates: Partial<Document>) => {
    if (currentDocument) {
      const updatedDoc = {
        ...currentDocument,
        ...updates,
      };
      setCurrentDocument(updatedDoc);
      setUnsavedChanges(true);
    }
  };

  const saveDocument = () => {
    if (currentDocument) {
      const updatedDocs = documents.map(doc => {
        if (doc.id === currentDocument.id) {
          return {
            ...currentDocument,
            title: documentTitle,
            content: currentDocument.content,
            updatedAt: new Date()
          };
        }
        return doc;
      });
      setDocuments(updatedDocs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDocs));
      setUnsavedChanges(false);
    }
  };

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    localStorage.setItem(
      STORAGE_KEY, 
      JSON.stringify(documents.filter(doc => doc.id !== id))
    );
    if (currentDocument?.id === id) {
      setCurrentDocument(null);
      setDocumentTitle('');
      setUnsavedChanges(false);
    }
  };

  const selectDocument = (doc: Document) => {
    if (unsavedChanges) {
      if (window.confirm('You have unsaved changes. Do you want to continue?')) {
        setCurrentDocument(doc);
        setDocumentTitle(doc.title);
        setUnsavedChanges(false);
      }
    } else {
      setCurrentDocument(doc);
      setDocumentTitle(doc.title);
    }
  };

  return {
    documents,
    currentDocument,
    documentTitle,
    setDocumentTitle,
    createNewDocument,
    deleteDocument,
    selectDocument,
    updateCurrentDocument,
    saveDocument,
    unsavedChanges
  };
} 