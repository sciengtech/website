import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect } from 'react';
import { Button } from './ui/Button';

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-[#2a3142] bg-[#0e1118]">
      <div className="flex flex-wrap gap-2 border-b border-[#2a3142] p-2">
        <Button type="button" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button type="button" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </Button>
        <Button type="button" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            const url = window.prompt('Link URL');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          Link
        </Button>
      </div>
      <EditorContent editor={editor} className="prose prose-invert max-w-none p-3 min-h-[240px] [&_.ProseMirror]:outline-none" />
    </div>
  );
}
