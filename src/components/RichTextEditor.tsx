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

// Werkzeugleiste im cc-design: eckige Felder, aktiv = nero gefüllt (Skill cc-design §6)
const TOOL = "flex h-10 w-10 items-center justify-center transition-colors";

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
      TOOL,
      active ? "bg-nero text-avorio" : "text-nero hover:bg-nero/10"
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
          "prose prose-cc max-w-none min-h-[120px] px-3 py-2 text-base focus:outline-none",
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
      editor?.chain().focus().setImage({
        src: gif.media_formats.gif.url,
        alt: gif.title,
      }).run();
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
        "border bg-card transition-colors focus-within:ring-2 focus-within:ring-ring",
        dragActive && dragCounter > 0 ? "border-verde bg-verde/5" : "border-nero"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDragEnd={handleDragEnd}
      onDrop={handleDragEnd}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-nero bg-sabbia/60 px-1 py-1">
        <ToolbarButton onClick={toggleBold} active={editor.isActive("bold")}>
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleItalic} active={editor.isActive("italic")}>
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleUnderline} active={editor.isActive("underline")}>
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-nero/30" />
        <ToolbarButton onClick={toggleH2} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleH3} active={editor.isActive("heading", { level: 3 })}>
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-nero/30" />
        <ToolbarButton onClick={toggleBulletList} active={editor.isActive("bulletList")}>
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleOrderedList} active={editor.isActive("orderedList")}>
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleCodeBlock} active={editor.isActive("codeBlock")}>
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-nero/30" />
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger className={cn(TOOL, emojiPickerOpen ? "bg-nero text-avorio" : "text-nero hover:bg-nero/10")}>
            <Smile className="h-4 w-4" />
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-[calc(100vw-2rem)] md:max-w-[350px] p-0 z-[9999]" align="start" sideOffset={4}>
            <EmojiPicker onEmojiClick={onEmojiSelect} />
          </PopoverContent>
        </Popover>
        <Popover open={gifPickerOpen} onOpenChange={setGifPickerOpen}>
          <PopoverTrigger className={cn(TOOL, gifPickerOpen ? "bg-nero text-avorio" : "text-nero hover:bg-nero/10")}>
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
            "num border-t border-nero px-3 py-1 text-right text-sm",
            overLimit ? "text-rosso" : "text-muted-foreground"
          )}
        >
          {textLength}/{maxLength}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
