import { useState, useCallback, useMemo } from "react";
import {
  createEditor,
  Descendant,
  Element as SlateElement,
  Transforms,
  Editor,
  Text,
  BaseEditor,
  Node,
} from "slate";
import {
  Slate,
  Editable,
  withReact,
  useSlate,
  RenderElementProps,
  RenderLeafProps,
  useSlateStatic,
  ReactEditor,
  useSelected,
  useFocused,
} from "slate-react";
import { withHistory } from "slate-history";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ImageSelectorDialog from "@/components/ImageSelectorDialog";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Helper functions
const isBlockActive = (editor: BaseEditor & ReactEditor, format: string): boolean => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        (n as any).type === format,
    })
  );

  return !!match;
};

const isMarkActive = (editor: BaseEditor & ReactEditor, format: string): boolean => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const toggleBlock = (editor: BaseEditor & ReactEditor, format: string): void => {
  const isActive = isBlockActive(editor, format);
  const isList = format === "bulleted-list" || format === "numbered-list";

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !Editor.isEditor(n) &&
      SlateElement.isElement(n) &&
      ((n as any).type === "bulleted-list" || 
       (n as any).type === "numbered-list"),
    split: true,
  });

  let newType: string;
  if (isActive) {
    newType = "paragraph";
  } else if (isList) {
    newType = "list-item";
  } else {
    newType = format;
  }

  Transforms.setNodes(
    editor,
    { type: newType } as any
  );

  if (!isActive && isList) {
    const block: any = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: BaseEditor & ReactEditor, format: string): void => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const toggleAlign = (editor: any, align: string): void => {
  Transforms.setNodes(
    editor,
    { align } as any,
    {
      match: (n) =>
        !Editor.isEditor(n) && SlateElement.isElement(n),
    }
  );
};

const insertLink = (editor: any, url: string): void => {
  const link: any = {
    type: "link",
    url,
    children: [{ text: url }],
  };
  Transforms.insertNodes(editor, link);
};

const insertImage = (editor: any, url: string): void => {
  const image: any = {
    type: "image",
    url,
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, image);
  const paragraph: any = {
    type: "paragraph",
    children: [{ text: "" }],
  };
  Transforms.insertNodes(editor, paragraph);
};

// Leaf renderer
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if ((leaf as any).bold) {
    children = <strong>{children}</strong>;
  }
  if ((leaf as any).italic) {
    children = <em>{children}</em>;
  }
  return <span {...attributes}>{children}</span>;
};

// Image component
const Image = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  const editor = useSlateStatic() as any;
  const selected = useSelected();
  const focused = useFocused();
  
  const handleDelete = () => {
    try {
      const path = (ReactEditor as any).findPath(editor, element);
      Transforms.removeNodes(editor, { at: path });
    } catch (e) {
      console.error("Error deleting image:", e);
    }
  };

  return (
    <div {...attributes}>
      {children}
      <div
        contentEditable={false}
        className="relative inline-block"
      >
        <img
          src={(element as any).url}
          className={cn(
            "block max-w-full max-h-80 rounded",
            selected && focused && "ring-2 ring-primary"
          )}
          alt=""
        />
        {selected && focused && (
          <Button
            onClick={handleDelete}
            variant="destructive"
            size="icon"
            className="absolute top-2 left-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

// Element renderer
const Element = (props: RenderElementProps) => {
  const { attributes, children, element } = props;
  const style = (element as any).align ? { textAlign: (element as any).align } : undefined;

  switch ((element as any).type) {
    case "paragraph":
      return <p style={style} {...attributes}>{children}</p>;
    case "heading-one":
      return <h1 style={style} className="text-3xl font-bold mt-6 mb-4" {...attributes}>{children}</h1>;
    case "heading-two":
      return <h2 style={style} className="text-2xl font-bold mt-5 mb-3" {...attributes}>{children}</h2>;
    case "heading-three":
      return <h3 style={style} className="text-xl font-bold mt-4 mb-2" {...attributes}>{children}</h3>;
    case "bulleted-list":
      return <ul className="list-disc pl-10 my-4" {...attributes}>{children}</ul>;
    case "numbered-list":
      return <ol className="list-decimal pl-10 my-4" {...attributes}>{children}</ol>;
    case "list-item":
      return <li {...attributes}>{children}</li>;
    case "link":
      return (
        <a href={(element as any).url} className="text-primary hover:underline" {...attributes}>
          {children}
        </a>
      );
    case "image":
      return <Image {...props} />;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Toolbar button
const ToolbarButton = ({
  format,
  icon,
  isBlock = false,
  isAlign = false,
  onClick,
}: {
  format: string;
  icon: React.ReactNode;
  isBlock?: boolean;
  isAlign?: boolean;
  onClick: () => void;
}) => {
  const editor = useSlate() as any;
  let isActive = false;

  if (isAlign) {
    const [match] = Array.from(
      Editor.nodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) && 
          SlateElement.isElement(n) && 
          (n as any).align === format,
      })
    );
    isActive = !!match;
  } else if (isBlock) {
    isActive = isBlockActive(editor, format);
  } else {
    isActive = isMarkActive(editor, format);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn(
        "h-8 w-8",
        isActive && "bg-accent"
      )}
    >
      {icon}
    </Button>
  );
};

// Deserialize HTML to Slate
const deserialize = (html: string): Descendant[] => {
  if (!html || html.trim() === "") {
    return [{ type: "paragraph", children: [{ text: "" }] } as any];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const convertDOMNode = (node: globalThis.Node): any[] => {
    if (node.nodeType === globalThis.Node.TEXT_NODE) {
      return [{ text: node.textContent || "" }];
    }

    if (node.nodeType !== globalThis.Node.ELEMENT_NODE) {
      return [{ text: "" }];
    }

    const element = node as HTMLElement;
    let children = Array.from(element.childNodes).flatMap(convertDOMNode);
    
    if (children.length === 0) {
      children = [{ text: "" }];
    }

    switch (element.nodeName.toLowerCase()) {
      case "p":
        return [{ type: "paragraph", align: element.style.textAlign || "left", children }];
      case "h1":
        return [{ type: "heading-one", children }];
      case "h2":
        return [{ type: "heading-two", children }];
      case "h3":
        return [{ type: "heading-three", children }];
      case "ul":
        return [{ type: "bulleted-list", children }];
      case "ol":
        return [{ type: "numbered-list", children }];
      case "li":
        return [{ type: "list-item", children }];
      case "a":
        return [{ type: "link", url: element.getAttribute("href") || "", children }];
      case "img":
        return [{ type: "image", url: element.getAttribute("src") || "", children: [{ text: "" }] }];
      case "strong":
      case "b":
        return children.map((child: any) => (child.text !== undefined ? { ...child, bold: true } : child));
      case "em":
      case "i":
        return children.map((child: any) => (child.text !== undefined ? { ...child, italic: true } : child));
      default:
        return children;
    }
  };

  const result = Array.from(doc.body.childNodes).flatMap(convertDOMNode);
  return result.length > 0 ? result : [{ type: "paragraph", children: [{ text: "" }] } as any];
};

// Serialize Slate to HTML
const serialize = (nodes: Descendant[]): string => {
  return nodes.map((node) => {
    if (Text.isText(node)) {
      let text = (node as any).text;
      if ((node as any).bold) text = `<strong>${text}</strong>`;
      if ((node as any).italic) text = `<em>${text}</em>`;
      return text;
    }

    const element = node as any;
    const children = element.children ? serialize(element.children) : "";

    switch (element.type) {
      case "paragraph":
        return `<p style="text-align: ${element.align || "left"}">${children}</p>`;
      case "heading-one":
        return `<h1>${children}</h1>`;
      case "heading-two":
        return `<h2>${children}</h2>`;
      case "heading-three":
        return `<h3>${children}</h3>`;
      case "bulleted-list":
        return `<ul>${children}</ul>`;
      case "numbered-list":
        return `<ol>${children}</ol>`;
      case "list-item":
        return `<li>${children}</li>`;
      case "link":
        return `<a href="${element.url}">${children}</a>`;
      case "image":
        return `<img src="${element.url}" />`;
      default:
        return children;
    }
  }).join("");
};

export const RichTextEditor = ({ value, onChange, className }: RichTextEditorProps) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const initialValue = useMemo(() => deserialize(value), []);
  
  const handleChange = useCallback(
    (newValue: Descendant[]) => {
      const html = serialize(newValue);
      onChange(html);
    },
    [onChange]
  );

  const handleInsertLink = () => {
    if (linkUrl) {
      insertLink(editor, linkUrl);
      setLinkUrl("");
      setLinkDialogOpen(false);
    }
  };

  const handleInsertImage = (url: string) => {
    insertImage(editor, url);
    setImageDialogOpen(false);
  };

  return (
    <div className={cn("border rounded-lg", className)}>
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <div className="border-b p-2 flex flex-wrap gap-1 bg-muted/30">
          <ToolbarButton
            format="bold"
            icon={<Bold className="w-4 h-4" />}
            onClick={() => toggleMark(editor, "bold")}
          />
          <ToolbarButton
            format="italic"
            icon={<Italic className="w-4 h-4" />}
            onClick={() => toggleMark(editor, "italic")}
          />
          
          <div className="w-px bg-border mx-1" />
          
          <ToolbarButton
            format="heading-one"
            icon={<Heading1 className="w-4 h-4" />}
            isBlock
            onClick={() => toggleBlock(editor, "heading-one")}
          />
          <ToolbarButton
            format="heading-two"
            icon={<Heading2 className="w-4 h-4" />}
            isBlock
            onClick={() => toggleBlock(editor, "heading-two")}
          />
          <ToolbarButton
            format="heading-three"
            icon={<Heading3 className="w-4 h-4" />}
            isBlock
            onClick={() => toggleBlock(editor, "heading-three")}
          />
          <ToolbarButton
            format="paragraph"
            icon={<Pilcrow className="w-4 h-4" />}
            isBlock
            onClick={() => toggleBlock(editor, "paragraph")}
          />
          
          <div className="w-px bg-border mx-1" />
          
          <ToolbarButton
            format="bulleted-list"
            icon={<List className="w-4 h-4" />}
            isBlock
            onClick={() => toggleBlock(editor, "bulleted-list")}
          />
          <ToolbarButton
            format="numbered-list"
            icon={<ListOrdered className="w-4 h-4" />}
            isBlock
            onClick={() => toggleBlock(editor, "numbered-list")}
          />
          
          <div className="w-px bg-border mx-1" />
          
          <ToolbarButton
            format="left"
            icon={<AlignLeft className="w-4 h-4" />}
            isAlign
            onClick={() => toggleAlign(editor, "left")}
          />
          <ToolbarButton
            format="center"
            icon={<AlignCenter className="w-4 h-4" />}
            isAlign
            onClick={() => toggleAlign(editor, "center")}
          />
          <ToolbarButton
            format="right"
            icon={<AlignRight className="w-4 h-4" />}
            isAlign
            onClick={() => toggleAlign(editor, "right")}
          />
          
          <div className="w-px bg-border mx-1" />
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setLinkDialogOpen(true)}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setImageDialogOpen(true)}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
          <Editable
            renderElement={Element}
            renderLeaf={Leaf}
            placeholder="Start typing..."
            className="focus:outline-none"
          />
        </div>
      </Slate>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInsertLink()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInsertLink}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageSelectorDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        onSelect={handleInsertImage}
      />
    </div>
  );
};
