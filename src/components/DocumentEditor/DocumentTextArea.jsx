import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import './DocumentTextArea.scss';

const DocumentTextArea = ({ value, onChange, placeholder = "Start typing or paste your document here..." }) => {
  const editorRef = useRef(null);

  return (
    <div className="document-textarea">
      <Editor
        apiKey="no-api-key" // Using TinyMCE without cloud - self-hosted
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={onChange}
        init={{
          height: '100%',
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | help',
          content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif; font-size: 15px; line-height: 1.6; }',
          placeholder: placeholder,
          skin: 'oxide',
          content_css: 'default',
          branding: false,
          promotion: false,
          resize: false,
          statusbar: false,
          toolbar_mode: 'sliding',
          contextmenu: 'link image table',
        }}
      />
    </div>
  );
};

export default React.memo(DocumentTextArea);
