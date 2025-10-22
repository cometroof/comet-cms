# FileSelectorDialog Component

This component provides a dialog for selecting files from the R2 bucket's `/files/` directory. It allows users to upload new files, paste URLs, or select from existing files in the library.

## Features

- Upload files to the R2 bucket's `/files/` directory
- View all files stored in the `/files/` directory
- Delete files from the library
- Select files by URL
- Preview images
- Display file information (size, type)
- File type icons for different file categories (documents, images, audio, video)

## Usage

```tsx
import { useState } from "react";
import FileSelectorDialog from "@/components/FileSelectorDialog/FileSelectorDialog";
import { Button } from "@/components/ui/button";

export default function FileSelectorExample() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");

  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)}>Select File</Button>
      
      {selectedFile && (
        <div className="p-4 border rounded">
          <p>Selected File: {selectedFile}</p>
        </div>
      )}

      <FileSelectorDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={(fileUrl) => setSelectedFile(fileUrl)}
        title="Choose a File"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | boolean | required | Controls the visibility of the dialog |
| `onOpenChange` | (open: boolean) => void | required | Callback when dialog open state changes |
| `onSelect` | (fileUrl: string) => void | required | Callback when a file is selected |
| `title` | string | "Select File" | Custom title for the dialog |
| `acceptedFileTypes` | string | "*/*" | Comma-separated list of file types to accept |
| `maxFileSize` | number | 10 | Maximum file size in MB |

## Implementation Notes

1. This component uses the same R2 storage service that's used for image storage, but it targets files in the `/files/` directory.

2. When uploading a file, the component treats it as a general file and categorizes it based on file extension.

3. The component displays appropriate icons for different file types (document, image, audio, video).

4. File sizes are formatted to be human-readable (bytes, KB, MB, GB).

## Example: Replacing the FileUploadDialog

```tsx
// Before
<FileUploadDialog
  open={uploadDialogOpen}
  onOpenChange={setUploadDialogOpen}
  onUpload={handleUploadCompanyProfile}
  acceptedTypes=".pdf"
  maxSize={10}
  title="Upload Company Profile"
/>

// After
<FileSelectorDialog
  open={fileSelectorOpen}
  onOpenChange={setFileSelectorOpen}
  onSelect={handleSelectCompanyProfile}
  title="Select Company Profile"
  acceptedFileTypes=".pdf"
  maxFileSize={10}
/>
```

## Future Improvements

- Add multi-file selection support
- Implement file sorting and filtering in the library
- Add file search functionality
- Add file preview for additional file types (PDF, audio, video)