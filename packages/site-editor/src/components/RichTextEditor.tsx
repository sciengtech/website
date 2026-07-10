import { useMemo } from 'react';
import { Editor } from '@tinymce/tinymce-react';

const EDITOR_INIT = {
  height: 420,
  menubar: 'edit view insert format table tools',
  plugins: [
    'advlist',
    'autolink',
    'lists',
    'link',
    'image',
    'charmap',
    'preview',
    'anchor',
    'searchreplace',
    'visualblocks',
    'code',
    'fullscreen',
    'insertdatetime',
    'media',
    'table',
    'help',
    'wordcount',
    'autoresize',
  ],
  toolbar:
    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | ' +
    'forecolor backcolor | alignleft aligncenter alignright alignjustify | ' +
    'bullist numlist outdent indent | link unlink image table | removeformat code fullscreen',
  font_family_formats:
    'Inter=Inter,system-ui,sans-serif; Arial=arial,helvetica,sans-serif; ' +
    'Georgia=georgia,palatino,serif; Times New Roman=times new roman,times,serif; ' +
    'Courier New=courier new,courier,monospace; Space Grotesk=Space Grotesk,sans-serif',
  fontsize_formats: '12px 14px 16px 18px 20px 24px 28px 32px',
  block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Heading 4=h4',
  link_default_target: '_blank',
  link_assume_external_targets: true,
  relative_urls: false,
  convert_urls: false,
  branding: false,
  promotion: false,
  skin: 'oxide-dark',
  content_css: 'dark',
  content_style:
    'body { font-family: Inter, system-ui, sans-serif; font-size: 14px; color: #e2e8f0; background: #0e1118; line-height: 1.75; } ' +
    'a { color: #e11d48; text-decoration: underline; }',
  resize: true,
  min_height: 320,
  max_height: 720,
  autoresize_bottom_margin: 16,
} as const;

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const tinymceScriptSrc = useMemo(
    () => `${import.meta.env.BASE_URL}tinymce/tinymce.min.js`,
    [],
  );

  return (
    <div className="rich-text-editor overflow-hidden rounded-md border border-[#2a3142] bg-[#0e1118]">
      <Editor
        licenseKey="gpl"
        tinymceScriptSrc={tinymceScriptSrc}
        value={value}
        onEditorChange={onChange}
        init={EDITOR_INIT}
      />
    </div>
  );
}
