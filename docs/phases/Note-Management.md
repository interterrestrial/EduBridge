# 📚 Note Management

This document defines the architecture, workflow, and implementation of the **Note Management System** in EduBridge. The Note Management module serves as the foundation of the platform, enabling students to upload, organize, manage, and process study materials for AI-powered learning.

Every AI feature—including AI Tutor, Quiz Generation, Flashcards, and Personalized Recommendations—depends on the notes uploaded through this module.

---

# 🎯 Objectives

The Note Management System is designed to:

- Allow students to upload study materials securely.
- Organize notes efficiently.
- Process documents for AI understanding.
- Maintain document metadata.
- Enable quick retrieval.
- Support future document management features.

---

# 🏗️ System Overview

```text
                    Student
                       │
                       ▼
                Upload Document
                       │
                       ▼
              Validate Document
                       │
                       ▼
              Store Original File
                       │
                       ▼
             Save Metadata in DB
                       │
                       ▼
            AI Processing Pipeline
                       │
                       ▼
                Ready for Learning
```

---

# 📄 Supported File Types

EduBridge currently supports:

- PDF (.pdf)
- Microsoft Word (.docx)

Future support:

- PPT / PPTX
- TXT
- Markdown
- EPUB
- Image-based Notes (OCR)
- Scanned Documents

---

# 📁 Upload Workflow

```text
Select File
      │
      ▼
Validate Type
      │
      ▼
Validate Size
      │
      ▼
Upload File
      │
      ▼
Store Metadata
      │
      ▼
AI Processing
      │
      ▼
Ready
```

---

# 📂 Folder Organization

Uploaded documents are stored in an organized structure.

```text
uploads/

├── student-001/
│   ├── OperatingSystems.pdf
│   ├── DBMS.pdf
│   └── CN.pdf
│
├── student-002/
│   ├── AI.docx
│   └── Java.pdf
```

> **Note:** In production, files may be stored in cloud object storage (such as AWS S3 or Cloudinary) instead of the local filesystem.

---

# 📋 Note Metadata

Each uploaded document stores metadata for efficient management.

| Field | Description |
|---------|-------------|
| Note ID | Unique identifier |
| Title | Document title |
| File Name | Original filename |
| File Type | PDF / DOCX |
| File Size | Size in bytes |
| Uploaded By | Student ID |
| Upload Date | Timestamp |
| Processing Status | Pending / Processing / Completed / Failed |
| Total Pages | Number of pages |
| Last Modified | Last update timestamp |

---

# 📑 Note Lifecycle

Every note passes through the following lifecycle.

```text
Created
   │
   ▼
Uploaded
   │
   ▼
Processing
   │
   ▼
AI Ready
   │
   ▼
Edited
   │
   ▼
Archived
   │
   ▼
Deleted
```

---

# 📥 Upload Validation

Before accepting a document, EduBridge validates:

- Supported file type
- Maximum file size
- File integrity
- User authentication
- Duplicate uploads (Future)

If validation fails:

```text
Upload

↓

Validation Failed

↓

Display Error

↓

Upload Cancelled
```

---

# 🧠 AI Processing Trigger

Once uploaded successfully, the document is automatically sent to the AI pipeline.

```text
Upload Complete

↓

Extract Text

↓

Split into Chunks

↓

Generate Embeddings

↓

Store in FAISS

↓

Ready for AI Chat
```

No manual processing is required from the student.

---

# 📂 My Notes Page

The **My Notes** section displays all uploaded study materials.

Each note card includes:

- Document Title
- File Type
- Upload Date
- Processing Status
- File Size
- Number of Pages (Future)

Example

```text
📘 Operating Systems.pdf

Uploaded: Today

Status: Ready

Size: 2.4 MB
```

---

# ⚙️ Available Actions

Students can perform the following actions on each note.

- View Details
- Rename Note
- Download Original File
- Delete Note
- Chat with AI
- Generate Quiz
- Generate Flashcards

Future actions:

- Share Notes
- Archive
- Duplicate
- Tag Notes

---

# 🔍 Search Notes

Students can quickly search documents.

Search parameters:

- Title
- Subject
- File Name
- Upload Date

Future enhancements:

- Full-text search
- Semantic search
- Tag filtering

---

# 🗂️ Organizing Notes

Future versions may support:

```text
My Notes

├── Data Structures
├── Operating Systems
├── DBMS
├── Computer Networks
└── Artificial Intelligence
```

Additional organization features:

- Subjects
- Tags
- Favorites
- Recently Viewed

---

# 🔄 Note Processing Status

Each document displays its current processing state.

Possible statuses:

```text
Uploading

↓

Processing

↓

Generating Embeddings

↓

Completed
```

If processing fails:

```text
Failed

↓

Retry Processing
```

---

# 🗑️ Delete Workflow

Deleting a note removes all associated AI resources.

```text
Delete Note

↓

Confirmation

↓

Delete Original File

↓

Delete Metadata

↓

Delete Document Chunks

↓

Delete Embeddings

↓

Update Dashboard
```

---

# 📊 Dashboard Integration

The dashboard displays note-related statistics.

Examples:

```text
Total Notes

18

Recently Uploaded

3

AI Ready

16

Processing

2
```

---

# 🌐 API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/notes/upload` | Upload a note |
| GET | `/api/notes` | Fetch all notes |
| GET | `/api/notes/:id` | Fetch note details |
| PUT | `/api/notes/:id` | Rename note |
| DELETE | `/api/notes/:id` | Delete note |
| GET | `/api/notes/search` | Search notes |

---

# 🗄️ Database Structure

## Notes Table

| Field | Type |
|------|------|
| id | UUID |
| title | String |
| fileName | String |
| filePath | String |
| fileType | String |
| fileSize | Integer |
| uploadedBy | UUID |
| status | Enum |
| createdAt | DateTime |
| updatedAt | DateTime |

---

# 📂 Backend Structure

```text
server/

src/

├── controllers/
│   └── notes.controller.ts
│
├── services/
│   └── notes.service.ts
│
├── routes/
│   └── notes.routes.ts
│
├── middleware/
│   └── upload.middleware.ts
│
├── utils/
│   └── fileValidation.ts
│
└── uploads/
```

---

# 🎨 Frontend Components

```text
components/

├── UploadButton
├── UploadModal
├── NoteCard
├── NotesGrid
├── NotesList
├── SearchBar
├── DeleteModal
├── RenameModal
└── StatusBadge
```

---

# 🔒 Security Considerations

The Note Management system follows these security practices:

- Authenticated uploads only.
- File type validation.
- File size restrictions.
- User ownership verification.
- Protected file downloads.
- Prevent unauthorized deletion.
- Virus scanning (Future).

---

# 🚀 Future Enhancements

Planned improvements include:

- Folder Management
- Subject Categories
- Tags & Labels
- OCR for Scanned Notes
- Cloud Storage Integration
- Version History
- Auto-Sync
- Collaborative Notes
- Bulk Upload
- Duplicate Detection

---

# 📋 Deliverables

- ✅ Note Upload Workflow
- ✅ Supported File Types
- ✅ Metadata Management
- ✅ Document Lifecycle
- ✅ AI Processing Integration
- ✅ Note Organization
- ✅ Search Functionality
- ✅ Delete Workflow
- ✅ API Endpoints
- ✅ Database Design
- ✅ Frontend Components
- ✅ Security Strategy
- ✅ Future Enhancements

---

## 📌 Document Status

**Status:** ✅ Completed

This document defines the complete Note Management module for EduBridge. It serves as the foundation for all AI-powered features by managing the upload, organization, processing, and lifecycle of study materials, ensuring a scalable and secure document management system.