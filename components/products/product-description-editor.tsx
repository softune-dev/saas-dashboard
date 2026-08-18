"use client";

import Color from "@tiptap/extension-color";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EditorLabel } from "@/components/themes/editor/editor-field";

const SWATCHES = [
  "#171717",
  "#DC2626",
  "#D97706",
  "#16A34A",
  "#2563EB",
  "#7C3AED",
];

/** Module-level so useEditor doesn't see a new extensions array every render
 * and tear down / recreate the ProseMirror instance. */
// Also module-level, for the same reason: TipTap v3's useEditor watches its
// whole options object for identity changes and recreates the editor when
// anything in it differs — an inline object literal here would be a NEW
// object every render, forcing a recreate -> re-render -> new object ->
// recreate loop that pins the CPU with no catchable error (this is what was
// crashing the tab on every product's edit page).
const EDITOR_PROPS = {
  attributes: {
    class:
      "product-description-editor prose prose-sm max-w-none min-h-[10rem] px-3 py-2.5 text-sm text-foreground outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg",
  },
};

const EXTENSIONS = [
  StarterKit.configure({
    // StarterKit ships its own Link; we configure a separate one below.
    link: false,
  }),
  Underline,
  TextStyle,
  Color,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  LinkExtension.configure({
    openOnClick: false,
    autolink: true,
    defaultProtocol: "https",
  }),
  ImageExtension.configure({ allowBase64: false }),
  Placeholder.configure({ placeholder: "Write a product description…" }),
];

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep focus in the editor so the command applies to the current selection
      // instead of the button stealing it (which would collapse the range).
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={[
        "inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-primary text-white"
          : "text-muted hover:bg-white hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function LinkButton({
  editor,
  isLink,
}: {
  editor: Editor;
  isLink: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  return (
    <div className="relative">
      <ToolbarButton
        label="Link"
        active={isLink}
        onClick={() => {
          setUrl(editor.getAttributes("link").href ?? "");
          setOpen((v) => !v);
        }}
      >
        <LinkIcon className="size-3.5" strokeWidth={2} />
      </ToolbarButton>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1.5 flex items-center gap-1.5 rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-slate-200">
          <input
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (url.trim()) {
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: url.trim() })
                    .run();
                } else {
                  editor.chain().focus().unsetLink().run();
                }
                setOpen(false);
              }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder="https://…"
            className="h-8 w-48 rounded-md border-0 bg-search-bg px-2 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editor.chain().focus().unsetLink().run();
              setOpen(false);
            }}
            className="shrink-0 text-[11px] font-medium text-muted hover:text-red-500"
          >
            Clear
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ColorButton({
  editor,
  color,
}: {
  editor: Editor;
  color: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <ToolbarButton label="Text color" onClick={() => setOpen((v) => !v)}>
        <span
          className="size-3.5 rounded-full ring-1 ring-inset ring-black/10"
          style={{ backgroundColor: color }}
        />
      </ToolbarButton>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1.5 flex items-center gap-1 rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-slate-200">
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                editor.chain().focus().setColor(c).run();
                setOpen(false);
              }}
              className="size-6 rounded-full ring-1 ring-inset ring-black/10"
              style={{ backgroundColor: c }}
            />
          ))}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              editor.chain().focus().unsetColor().run();
              setOpen(false);
            }}
            className="ml-1 text-[11px] font-medium text-muted hover:text-red-500"
          >
            Reset
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Toolbar({
  editor,
  onInsertImage,
  imageUploading,
}: {
  editor: Editor;
  onInsertImage: () => void;
  imageUploading: boolean;
}) {
  // TipTap v3 no longer re-renders the host on every transaction by default.
  // Without this subscription the toolbar's isActive() flags freeze on the
  // values from first paint (bold looks off after you bold, etc.).
  const marks = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      blockquote: e.isActive("blockquote"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      alignLeft: e.isActive({ textAlign: "left" }),
      alignCenter: e.isActive({ textAlign: "center" }),
      alignRight: e.isActive({ textAlign: "right" }),
      link: e.isActive("link"),
      color: (e.getAttributes("textStyle").color as string | undefined) || "#171717",
    }),
  });

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200/80 p-1.5">
      <ToolbarButton
        label="Bold"
        active={marks.bold}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={marks.italic}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={marks.underline}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={marks.blockquote}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      <ColorButton editor={editor} color={marks.color} />

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Bullet list"
        active={marks.bulletList}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={marks.orderedList}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton
        label="Align left"
        active={marks.alignLeft}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={marks.alignCenter}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={marks.alignRight}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <LinkButton editor={editor} isLink={marks.link} />
      <ToolbarButton
        label="Insert image"
        disabled={imageUploading}
        onClick={onInsertImage}
      >
        <ImageIcon className="size-3.5" strokeWidth={2.25} />
      </ToolbarButton>
      {imageUploading ? (
        <span className="ml-1 text-[11px] text-muted">Uploading…</span>
      ) : null}
    </div>
  );
}

type ProductDescriptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
  /** Image insert uploads through the same product-image pipeline as the
   * gallery — real Cloudinary URLs, not local blobs, since this content is
   * stored as HTML and a blob: URL wouldn't survive a page reload. */
  onUploadImage: (file: File) => Promise<string>;
};

/** TipTap-backed product description field. Output is HTML stored in
 * Product.description. Kept as TipTap: the unreliability was integration
 * bugs (frozen toolbar in v3, broken external value sync), not the library. */
export function ProductDescriptionEditor({
  value,
  onChange,
  onUploadImage,
}: ProductDescriptionEditorProps) {
  const [imageUploading, setImageUploading] = useState(false);

  // Always call the latest parent handlers without putting them in useEditor's
  // option object (which would recreate the editor if they change identity).
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onUploadImageRef = useRef(onUploadImage);
  onUploadImageRef.current = onUploadImage;

  // When the editor itself fires onUpdate we push HTML up; the parent then
  // feeds the same string back as `value`. Skip that echo so we never
  // setContent mid-keystroke (which jumps the cursor to the end).
  const skipNextExternalSync = useRef(false);

  // Stable identity across renders (empty deps — reads the latest onChange
  // via the ref above) so it doesn't trigger useEditor's recreate-on-change
  // behavior. See EDITOR_PROPS above for why editorProps is module-level.
  const handleUpdate = useCallback(({ editor: e }: { editor: Editor }) => {
    skipNextExternalSync.current = true;
    onChangeRef.current(e.getHTML());
  }, []);

  // Captured ONCE at construction, not kept reactive to `value`. TipTap
  // re-diffs this whole options object on every render (no deps array
  // passed to useEditor) and calls editor.setOptions() whenever anything
  // differs — but setOptions() never writes back into editor.options.content,
  // so a live `content: value` here meant that the instant `value` became
  // non-empty (real product data loading), the comparison was permanently
  // unequal: every render called setOptions() again, which bumps TipTap's
  // transaction counter, which forces this component to re-render (see the
  // useEditorState subscription inside useEditor), forever. All content
  // updates after mount go through the sync effect below instead, which is
  // the only thing actually meant to own them.
  const [initialContent] = useState(() => value || "");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: EXTENSIONS,
    content: initialContent,
    onUpdate: handleUpdate,
    editorProps: EDITOR_PROPS,
  });

  // External value changes only — e.g. product fetch finishing in edit mode.
  // The effect that only depended on [editor] never re-ran when value arrived
  // after mount, so edit forms showed a blank description.
  useEffect(() => {
    if (!editor) return;
    if (skipNextExternalSync.current) {
      skipNextExternalSync.current = false;
      return;
    }
    const next = value || "";
    if (next !== editor.getHTML()) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  function handleInsertImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      setImageUploading(true);
      try {
        const url = await onUploadImageRef.current(file);
        editor.chain().focus().setImage({ src: url }).run();
      } finally {
        setImageUploading(false);
      }
    };
    input.click();
  }

  return (
    <div className="flex flex-col gap-1.5">
      <EditorLabel>Description</EditorLabel>
      {/* Placeholder needs the empty-paragraph ::before rule TipTap documents;
       * without it the Placeholder extension is a no-op visually. */}
      <style>{`
        .product-description-editor p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
      {/* Outer shell matches other inputs (search-bg); the writing surface is white. */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-search-bg focus-within:border-primary">
        {editor ? (
          <Toolbar
            editor={editor}
            onInsertImage={handleInsertImage}
            imageUploading={imageUploading}
          />
        ) : null}
        <div className="bg-white">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
