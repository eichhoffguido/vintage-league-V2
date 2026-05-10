import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

interface RichTextViewerProps {
  content: string;
}

const RichTextViewer = ({ content }: RichTextViewerProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
    ],
    content,
    editable: false,
  });

  if (!editor) return null;

  return <EditorContent editor={editor} />;
};

export default RichTextViewer;
