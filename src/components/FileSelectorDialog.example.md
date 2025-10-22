# FileSelectorDialog Component

This component provides a dialog for selecting files from the R2 bucket's `/files/` directory. It allows users to upload new files, paste URLs, or select from existing files in the library.

## Basic Usage

```tsx
import { useState } from "react";
import FileSelectorDialog from "@/components/FileSelectorDialog";
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

## Advanced Usage

You can customize the dialog with additional props:

```tsx
<FileSelectorDialog
  open={open}
  onOpenChange={setOpen}
  onSelect={handleFileSelect}
  title="Select Document"
  acceptedFileTypes=".pdf,.doc,.docx,.txt" // Limit accepted file types
  maxFileSize={20} // Set maximum file size to 20MB (default is 10MB)
/>
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

## Features

- Upload files to the R2 bucket's `/files/` directory
- View all files stored in the `/files/` directory
- Delete files from the library
- Select files by URL
- Different preview displays based on file type
- File type icons for different file categories (documents, images, audio, video)