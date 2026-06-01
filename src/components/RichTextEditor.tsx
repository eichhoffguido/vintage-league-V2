import { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Code,
  Heading2,
  Heading3,
  Smile,
  Image as ImageIcon,
} from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import GifPicker from "./GifPicker";
import { TenorGif } from "@/utils/tenor";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  maxLength?: number;
  placeholder?: string;
}

const ToolbarButton = ({
  onClick,
  active,
  children,
}: {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-sm p-1.5 transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}
  >
    {children}
  </button>
);

const RichTextEditor = ({ content, onChange, maxLength, placeholder }: RichTextEditorProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Image,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[120px] focus:outline-none px-3 py-2",
        "data-placeholder": placeholder || "",
      },
    },
  });

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);

  const textLength = editor?.getText().length ?? 0;
  const overLimit = maxLength !== undefined && textLength > maxLength;

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const toggleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  const toggleCodeBlock = useCallback(() => editor?.chain().focus().toggleCodeBlock().run(), [editor]);
  const toggleH2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
  const toggleH3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor]);

  const onEmojiSelect = useCallback(
    (emoji: EmojiClickData) => {
      editor?.chain().focus().insertContent(emoji.emoji).run();
      setEmojiPickerOpen(false);
    },
    [editor],
  );

  const onGifSelect = useCallback(
    (gif: TenorGif) => {
      const html = `<img src="${gif.media_formats.gif.url}" alt="${gif.title}" style="max-width: 100%; height: auto;" />`;
      editor?.chain().focus().insertContent(html).run();
      setGifPickerOpen(false);
    },
    [editor],
  );

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      const hasFiles = e.dataTransfer.types.includes("Files");
      setDragCounter((prev) => prev + 1);
      setDragActive(hasFiles);
    } else if (e.type === "dragleave") {
      setDragCounter((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDragEnd = () => {
    setDragActive(false);
    setDragCounter(0);
  };

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-sm border transition-colors",
        dragActive && dragCounter > 0 ? "border-primary bg-primary/5" : "border-border"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDragEnd={handleDragEnd}
      onDrop={handleDragEnd}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-2 py-1.5">
        <ToolbarButton onClick={toggleBold} active={editor.isActive("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleItalic} active={editor.isActive("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleUnderline} active={editor.isActive("underline")}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={toggleH2} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleH3} active={editor.isActive("heading", { level: 3 })}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton onClick={toggleBulletList} active={editor.isActive("bulletList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleOrderedList} active={editor.isActive("orderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleCodeBlock} active={editor.isActive("codeBlock")}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger className={cn(
            "rounded-sm p-1.5 transition-colors",
            emojiPickerOpen
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}>
            <Smile className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-[calc(100vw-2rem)] md:max-w-[350px] p-0 z-[9999]" align="start" sideOffset={4}>
            <EmojiPicker onEmojiClick={onEmojiSelect} />
          </PopoverContent>
        </Popover>
        <Popover open={gifPickerOpen} onOpenChange={setGifPickerOpen}>
          <PopoverTrigger className={cn(
            "rounded-sm p-1.5 transition-colors",
            gifPickerOpen
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}>
            <ImageIcon className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-[calc(100vw-2rem)] md:max-w-[400px] p-0 z-[9999]" align="start" sideOffset={4}>
            <GifPicker onGifSelect={onGifSelect} />
          </PopoverContent>
        </Popover>
      </div>
      <EditorContent editor={editor} />
      {maxLength && (
        <div
          className={cn(
            "border-t border-border px-3 py-1 text-right text-xs",
            overLimit ? "text-destructive font-medium" : "text-muted-foreground"
          )}
        >
          {textLength}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
