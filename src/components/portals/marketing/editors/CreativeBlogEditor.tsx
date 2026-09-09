import React, { useRef, useMemo, useState, useCallback, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Image as ImageIcon, Layout, AlignLeft, AlignCenter, AlignRight, Maximize2,
  Loader2, FolderOpen, Type, Trash2, Replace, Tag,
} from 'lucide-react';
import MediaLibrary from '../MediaLibrary';

/* ---------------- Quill registrations (one-time) ---------------- */

// Patch image format so style/width/etc. survive
const Image = Quill.import('formats/image') as any;
if (Image && !Image.__lov_patched) {
  Image.className = 'blog-img';
  const ATTRS = ['alt', 'height', 'width', 'class', 'style', 'src', 'title'];
  Image.sanitize = (url: string) => url;
  (Image as any).formats = function (domNode: HTMLElement) {
    return ATTRS.reduce((formats: any, attr) => {
      if (domNode.hasAttribute(attr)) formats[attr] = domNode.getAttribute(attr);
      return formats;
    }, {});
  };
  Image.prototype.format = function (name: string, value: any) {
    if (ATTRS.includes(name)) {
      if (value) (this.domNode as HTMLElement).setAttribute(name, value);
      else (this.domNode as HTMLElement).removeAttribute(name);
    } else {
      // @ts-ignore
      Quill.import('blots/block/embed').prototype.format.call(this, name, value);
    }
  };
  Image.__lov_patched = true;
}

// Fonts
const FONT_OPTIONS: Array<{ slug: string; label: string; css: string; google?: string }> = [
  { slug: 'inter',           label: 'Inter',            css: "'Inter', sans-serif",            google: 'Inter:wght@400;600;700' },
  { slug: 'poppins',         label: 'Poppins',          css: "'Poppins', sans-serif",          google: 'Poppins:wght@400;600;700' },
  { slug: 'montserrat',      label: 'Montserrat',       css: "'Montserrat', sans-serif",       google: 'Montserrat:wght@400;600;700' },
  { slug: 'roboto',          label: 'Roboto',           css: "'Roboto', sans-serif",           google: 'Roboto:wght@400;500;700' },
  { slug: 'open-sans',       label: 'Open Sans',        css: "'Open Sans', sans-serif",        google: 'Open+Sans:wght@400;600;700' },
  { slug: 'lato',            label: 'Lato',             css: "'Lato', sans-serif",             google: 'Lato:wght@400;700' },
  { slug: 'nunito',          label: 'Nunito',           css: "'Nunito', sans-serif",           google: 'Nunito:wght@400;600;700' },
  { slug: 'raleway',         label: 'Raleway',          css: "'Raleway', sans-serif",          google: 'Raleway:wght@400;600;700' },
  { slug: 'oswald',          label: 'Oswald',           css: "'Oswald', sans-serif",           google: 'Oswald:wght@400;600;700' },
  { slug: 'playfair-display',label: 'Playfair Display', css: "'Playfair Display', serif",      google: 'Playfair+Display:wght@400;700' },
  { slug: 'merriweather',    label: 'Merriweather',     css: "'Merriweather', serif",          google: 'Merriweather:wght@400;700' },
  { slug: 'lora',            label: 'Lora',             css: "'Lora', serif",                  google: 'Lora:wght@400;600;700' },
  { slug: 'georgia',         label: 'Georgia',          css: "Georgia, serif" },
  { slug: 'courier-new',     label: 'Courier New',      css: "'Courier New', monospace" },
  { slug: 'monospace',       label: 'Monospace',        css: "ui-monospace, SFMono-Regular, Menlo, monospace" },
];

const SIZE_OPTIONS = ['10px','12px','14px','16px','18px','20px','24px','28px','32px','40px','48px','64px'];

const Font = Quill.import('formats/font') as any;
if (Font && !Font.__lov_registered) {
  Font.whitelist = FONT_OPTIONS.map(f => f.slug);
  Quill.register(Font, true);
  Font.__lov_registered = true;
}
const SizeStyle = Quill.import('attributors/style/size') as any;
if (SizeStyle && !SizeStyle.__lov_registered) {
  SizeStyle.whitelist = SIZE_OPTIONS;
  Quill.register(SizeStyle, true);
  SizeStyle.__lov_registered = true;
}

// Banner blot
interface BannerData {
  img: string;
  heading: string;
  sub: string;
  align: 'left' | 'center' | 'right';
  overlay: number; // 0-100
  color: string;
  height: number; // px
  headingFont?: string; // slug from FONT_OPTIONS
  headingSize?: number; // px
  subFont?: string;
  subSize?: number; // px
}

const fontCssFromSlug = (slug?: string) => {
  if (!slug) return '';
  const f = FONT_OPTIONS.find(o => o.slug === slug);
  return f ? f.css : '';
};

const renderBannerInner = (d: BannerData) => {
  const overlayRgba = `rgba(0,0,0,${(d.overlay / 100).toFixed(2)})`;
  const hFont = fontCssFromSlug(d.headingFont);
  const sFont = fontCssFromSlug(d.subFont);
  const hSize = d.headingSize || 32;
  const sSize = d.subSize || 17;
  const hStyle = `color:${d.color}; margin:0 0 .5rem; font-size:${hSize}px; line-height:1.15;${hFont ? ` font-family:${hFont};` : ''}`;
  const pStyle = `color:${d.color}; margin:0; font-size:${sSize}px; opacity:.95;${sFont ? ` font-family:${sFont};` : ''}`;
  return (
    `<div style="position:absolute; inset:0; background:${overlayRgba}; pointer-events:none;"></div>` +
    `<div class="blog-banner-content" style="position:relative; padding:2.25rem 2rem; max-width:720px; color:${d.color}; text-align:${d.align}; pointer-events:none;">` +
      `<h2 data-h-font="${d.headingFont || ''}" data-h-size="${hSize}" style="${hStyle}">${d.heading || ''}</h2>` +
      (d.sub ? `<p data-s-font="${d.subFont || ''}" data-s-size="${sSize}" style="${pStyle}">${d.sub}</p>` : '') +
    `</div>`
  );
};
const applyBannerStyle = (node: HTMLElement, d: BannerData) => {
  const justify = d.align === 'left' ? 'flex-start' : d.align === 'right' ? 'flex-end' : 'center';
  const bg = d.img
    ? `background-image:url('${d.img.replace(/'/g, "\\'")}'); background-size:cover; background-position:center;`
    : 'background:linear-gradient(135deg,#1f4d2b,#3b7a4c);';
  node.setAttribute(
    'style',
    `position:relative; ${bg} min-height:${d.height}px; border-radius:14px; overflow:hidden; margin:1.5rem 0; display:flex; align-items:center; justify-content:${justify};`,
  );
};

const BlockEmbed = Quill.import('blots/block/embed') as any;
class BannerBlot extends BlockEmbed {
  static blotName = 'blogBanner';
  static tagName  = 'div';
  static className = 'blog-banner';
  static create(value: BannerData) {
    const node: HTMLElement = super.create();
    node.setAttribute('data-banner', '1');
    node.setAttribute('contenteditable', 'false');
    node.innerHTML = renderBannerInner(value);
    applyBannerStyle(node, value);
    (node as any).__bannerData = value;
    return node;
  }
  static value(node: HTMLElement): BannerData {
    return (node as any).__bannerData || parseBannerFromDom(node);
  }
}
if (!(BannerBlot as any).__lov_registered) {
  Quill.register(BannerBlot, true);
  (BannerBlot as any).__lov_registered = true;
}

const parseBannerFromDom = (el: HTMLElement): BannerData => {
  const style = el.getAttribute('style') || '';
  const bgMatch = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/);
  const h2 = el.querySelector('h2') as HTMLElement | null;
  const p = el.querySelector('p') as HTMLElement | null;
  const content = el.querySelector('.blog-banner-content') as HTMLElement | null;
  const ta = (content?.style.textAlign as 'left' | 'center' | 'right') || 'center';
  const overlayDiv = el.querySelector('div') as HTMLElement | null;
  const rgba = overlayDiv?.style.background?.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)/);
  const mh = parseInt(el.style.minHeight || '360', 10);
  const parsePx = (s?: string) => { const n = parseInt(s || '', 10); return isNaN(n) ? undefined : n; };
  return {
    img: bgMatch?.[1] || '',
    heading: h2?.textContent || '',
    sub: p?.textContent || '',
    align: ta,
    overlay: rgba ? Math.round(parseFloat(rgba[1]) * 100) : 40,
    color: (h2?.style.color as string) || '#ffffff',
    height: isNaN(mh) ? 360 : mh,
    headingFont: h2?.getAttribute('data-h-font') || undefined,
    headingSize: parsePx(h2?.getAttribute('data-h-size') || h2?.style.fontSize) || 32,
    subFont: p?.getAttribute('data-s-font') || undefined,
    subSize: parsePx(p?.getAttribute('data-s-size') || p?.style.fontSize) || 17,
  };
};

/* ---------------- Inject font/size dropdown labels + Google Fonts (once) ---------------- */
if (typeof document !== 'undefined' && !document.getElementById('lov-quill-fonts-css')) {
  // Google fonts link
  const link = document.createElement('link');
  link.id = 'lov-quill-fonts-link';
  link.rel = 'stylesheet';
  const families = FONT_OPTIONS.filter(f => f.google).map(f => `family=${f.google}`).join('&');
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);

  // CSS
  const style = document.createElement('style');
  style.id = 'lov-quill-fonts-css';
  const fontClassCss = FONT_OPTIONS.map(f => `.ql-font-${f.slug}{font-family:${f.css};}`).join('\n');
  const fontPickerCss = FONT_OPTIONS.map(f => `
    .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="${f.slug}"]::before,
    .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="${f.slug}"]::before { content:"${f.label}"; font-family:${f.css}; }
  `).join('\n');
  const sizePickerCss = SIZE_OPTIONS.map(s => `
    .ql-snow .ql-picker.ql-size .ql-picker-label[data-value="${s}"]::before,
    .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="${s}"]::before { content:"${s}"; }
  `).join('\n');
  style.textContent = `
    ${fontClassCss}
    ${fontPickerCss}
    ${sizePickerCss}
    .ql-snow .ql-picker.ql-font { width: 140px; }
    .ql-snow .ql-picker.ql-size { width: 80px; }
    .ql-editor .blog-banner { user-select: none; }
  `;
  document.head.appendChild(style);
}

/* ---------------- Component ---------------- */

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

const uploadToStorage = async (file: File): Promise<string> => {
  const ext = file.name.split('.').pop();
  const path = `blog-inline/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('page-media').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('page-media').getPublicUrl(path);
  return data.publicUrl;
};

const CreativeBlogEditor: React.FC<Props> = ({ value, onChange, placeholder = 'Write your story…', height = 480 }) => {
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<null | 'inline' | 'banner' | 'replace'>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgWidth, setImgWidth] = useState<number>(100);

  // Banner dialog state
  const [bannerOpen, setBannerOpen] = useState(false);
  const [bannerEditing, setBannerEditing] = useState<HTMLElement | null>(null);
  const [bannerImg, setBannerImg] = useState('');
  const [bannerHeading, setBannerHeading] = useState('');
  const [bannerSub, setBannerSub] = useState('');
  const [bannerAlign, setBannerAlign] = useState<'left' | 'center' | 'right'>('center');
  const [bannerOverlay, setBannerOverlay] = useState(40);
  const [bannerColor, setBannerColor] = useState('#ffffff');
  const [bannerHeight, setBannerHeight] = useState(360);
  const [bannerHeadingFont, setBannerHeadingFont] = useState<string>('playfair-display');
  const [bannerHeadingSize, setBannerHeadingSize] = useState<number>(36);
  const [bannerSubFont, setBannerSubFont] = useState<string>('inter');
  const [bannerSubSize, setBannerSubSize] = useState<number>(17);

  const insertImageAtCursor = useCallback((url: string) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
    editor.insertEmbed(range.index, 'image', url, 'user');
    editor.formatLine(range.index, 1, 'align', 'center');
    editor.setSelection(range.index + 1, 0);
  }, []);

  const handleFilePick = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 25 * 1024 * 1024) { toast.error('Image must be under 25MB'); return; }
    setUploading(true);
    try { insertImageAtCursor(await uploadToStorage(file)); toast.success('Image inserted'); }
    catch (e) { console.error(e); toast.error('Upload failed'); }
    finally { setUploading(false); }
  }, [insertImageAtCursor]);

  const triggerUpload = () => fileInputRef.current?.click();

  const openBannerNew = () => {
    setBannerEditing(null);
    setBannerImg(''); setBannerHeading('Your bold headline');
    setBannerSub('A short supporting line that sits on top of the picture.');
    setBannerAlign('center'); setBannerOverlay(40); setBannerColor('#ffffff'); setBannerHeight(360);
    setBannerHeadingFont('playfair-display'); setBannerHeadingSize(36);
    setBannerSubFont('inter'); setBannerSubSize(17);
    setBannerOpen(true);
  };

  const currentBannerData = (): BannerData => ({
    img: bannerImg, heading: bannerHeading, sub: bannerSub,
    align: bannerAlign, overlay: bannerOverlay, color: bannerColor, height: bannerHeight,
    headingFont: bannerHeadingFont, headingSize: bannerHeadingSize,
    subFont: bannerSubFont, subSize: bannerSubSize,
  });

  const saveBanner = () => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const data = currentBannerData();
    if (bannerEditing) {
      const blot = (Quill as any).find(bannerEditing);
      if (blot) {
        const idx = editor.getIndex(blot);
        editor.deleteText(idx, 1, 'user');
        editor.insertEmbed(idx, 'blogBanner', data, 'user');
        editor.setSelection(idx + 1, 0);
      }
    } else {
      const range = editor.getSelection(true) || { index: editor.getLength(), length: 0 };
      editor.insertEmbed(range.index, 'blogBanner', data, 'user');
      editor.insertText(range.index + 1, '\n', 'user');
      editor.setSelection(range.index + 2, 0);
    }
    onChange(editor.root.innerHTML);
    setBannerOpen(false);
  };

  const editExistingBanner = (el: HTMLElement) => {
    const d: BannerData = (el as any).__bannerData || parseBannerFromDom(el);
    setBannerEditing(el);
    setBannerImg(d.img); setBannerHeading(d.heading); setBannerSub(d.sub);
    setBannerAlign(d.align); setBannerOverlay(d.overlay); setBannerColor(d.color); setBannerHeight(d.height);
    setBannerHeadingFont(d.headingFont || 'playfair-display');
    setBannerHeadingSize(d.headingSize || 36);
    setBannerSubFont(d.subFont || 'inter');
    setBannerSubSize(d.subSize || 17);
    setBannerOpen(true);
  };

  // Click + dblclick handling
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const root = editor.root;
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const banner = target.closest('.blog-banner') as HTMLElement | null;
      if (banner && e.detail >= 2) {
        e.preventDefault();
        editExistingBanner(banner);
        return;
      }
      if (target.tagName === 'IMG' && !banner) {
        const img = target as HTMLImageElement;
        setSelectedImg(img);
        const w = img.style.width.match(/(\d+)%/);
        setImgWidth(w ? parseInt(w[1], 10) : 100);
      } else {
        setSelectedImg(null);
      }
    };
    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  const syncOnChange = () => {
    const editor = quillRef.current?.getEditor();
    if (editor) onChange(editor.root.innerHTML);
  };

  const applyImageStyle = (style: Partial<CSSStyleDeclaration>) => {
    if (!selectedImg) return;
    Object.entries(style).forEach(([k, v]) => { (selectedImg.style as any)[k] = v as string; });
    syncOnChange();
  };

  const setImageWidthPct = (pct: number) => {
    setImgWidth(pct);
    applyImageStyle({ width: `${pct}%`, height: 'auto' as any });
  };
  const alignImage = (side: 'left' | 'center' | 'right') => {
    if (side === 'left') applyImageStyle({ float: 'left', margin: '0.5rem 1.5rem 0.5rem 0', display: 'inline' });
    else if (side === 'right') applyImageStyle({ float: 'right', margin: '0.5rem 0 0.5rem 1.5rem', display: 'inline' });
    else applyImageStyle({ float: '', margin: '1rem auto', display: 'block' });
  };
  const addCaptionToImage = () => {
    if (!selectedImg) return;
    const caption = window.prompt('Caption text'); if (caption == null) return;
    const fig = document.createElement('figure');
    fig.style.cssText = 'margin:1rem 0; text-align:center;';
    const parent = selectedImg.parentElement!;
    parent.insertBefore(fig, selectedImg);
    fig.appendChild(selectedImg);
    const fc = document.createElement('figcaption');
    fc.textContent = caption;
    fc.style.cssText = 'font-size:.875rem; color:#666; margin-top:.5rem; font-style:italic;';
    fig.appendChild(fc);
    syncOnChange();
  };
  const deleteSelectedImg = () => {
    if (!selectedImg) return;
    const fig = selectedImg.closest('figure');
    (fig || selectedImg).remove();
    setSelectedImg(null);
    syncOnChange();
  };
  const editAltText = () => {
    if (!selectedImg) return;
    const alt = window.prompt('Alt text (for SEO + accessibility)', selectedImg.alt || '');
    if (alt == null) return;
    selectedImg.alt = alt;
    syncOnChange();
  };
  const replaceSelectedImg = () => replaceInputRef.current?.click();
  const handleReplaceFile = async (file: File) => {
    if (!selectedImg) return;
    setUploading(true);
    try { selectedImg.src = await uploadToStorage(file); syncOnChange(); toast.success('Image replaced'); }
    catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const imageHandler = useCallback(() => triggerUpload(), []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, false] }, { font: FONT_OPTIONS.map(f => f.slug) }],
        [{ size: SIZE_OPTIONS }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['blockquote', 'code-block', 'link', 'image', 'video'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
    clipboard: { matchVisual: false },
  }), [imageHandler]);

  const formats = [
    'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent', 'align',
    'blockquote', 'code-block', 'link', 'image', 'video',
    'width', 'height', 'style', 'class', 'alt',
    'blogBanner',
  ];

  // Live preview banner data
  const previewBanner: BannerData = currentBannerData();
  const previewStyle = (() => {
    const justify = previewBanner.align === 'left' ? 'flex-start' : previewBanner.align === 'right' ? 'flex-end' : 'center';
    const bg = previewBanner.img
      ? `background-image:url('${previewBanner.img.replace(/'/g, "\\'")}'); background-size:cover; background-position:center;`
      : 'background:linear-gradient(135deg,#1f4d2b,#3b7a4c);';
    return `position:relative; ${bg} min-height:${previewBanner.height}px; border-radius:14px; overflow:hidden; display:flex; align-items:center; justify-content:${justify};`;
  })();

  return (
    <div className="creative-blog-editor space-y-2">
      <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-muted/40">
        <Button type="button" size="sm" variant="outline" onClick={triggerUpload} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
          Upload image
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setLibrary('inline')}>
          <FolderOpen className="w-4 h-4 mr-2" /> From library
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={openBannerNew}>
          <Layout className="w-4 h-4 mr-2" /> Image + text banner
        </Button>

        <div className="ml-auto text-xs text-muted-foreground hidden md:block">
          Tip: click any image to edit it. Double-click a banner to re-open.
        </div>
      </div>

      {selectedImg && (
        <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-accent/30">
          <span className="text-xs font-medium">Image:</span>
          <Button type="button" size="sm" variant="ghost" onClick={() => alignImage('left')} title="Wrap left"><AlignLeft className="w-4 h-4" /></Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => alignImage('center')} title="Center"><AlignCenter className="w-4 h-4" /></Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => alignImage('right')} title="Wrap right"><AlignRight className="w-4 h-4" /></Button>
          <div className="flex items-center gap-2 px-2 min-w-[180px]">
            <span className="text-xs text-muted-foreground w-12">{imgWidth}%</span>
            <Slider
              value={[imgWidth]} min={20} max={100} step={5}
              onValueChange={(v) => setImageWidthPct(v[0])}
              className="w-32"
            />
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={addCaptionToImage} title="Add caption"><Type className="w-4 h-4" /></Button>
          <Button type="button" size="sm" variant="ghost" onClick={editAltText} title="Alt text"><Tag className="w-4 h-4" /></Button>
          <Button type="button" size="sm" variant="ghost" onClick={replaceSelectedImg} title="Replace image"><Replace className="w-4 h-4" /></Button>
          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={deleteSelectedImg} title="Delete image"><Trash2 className="w-4 h-4" /></Button>
        </div>
      )}

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight: `${height}px` }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFilePick(f); e.target.value = ''; }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleReplaceFile(f); e.target.value = ''; }}
      />

      <MediaLibrary
        isOpen={library !== null}
        onClose={() => setLibrary(null)}
        onSelect={(url) => {
          if (library === 'banner') setBannerImg(url);
          else if (library === 'replace' && selectedImg) { selectedImg.src = url; syncOnChange(); toast.success('Image replaced'); }
          else { insertImageAtCursor(url); toast.success('Image inserted'); }
          setLibrary(null);
        }}
        filterType="image"
      />

      <Dialog open={bannerOpen} onOpenChange={setBannerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b">
            <DialogTitle>{bannerEditing ? 'Edit banner' : 'Image with text overlay'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Background image URL</Label>
                  <div className="flex gap-2">
                    <Input value={bannerImg} onChange={e => setBannerImg(e.target.value)} placeholder="Paste image URL" />
                    <Button type="button" variant="outline" onClick={() => setLibrary('banner')}>
                      <FolderOpen className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button" variant="outline" disabled={uploading}
                      onClick={async () => {
                        const inp = document.createElement('input');
                        inp.type = 'file'; inp.accept = 'image/*';
                        inp.onchange = async () => {
                          const f = inp.files?.[0]; if (!f) return;
                          setUploading(true);
                          try { setBannerImg(await uploadToStorage(f)); toast.success('Uploaded'); }
                          catch { toast.error('Upload failed'); }
                          finally { setUploading(false); }
                        };
                        inp.click();
                      }}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Heading</Label>
                  <Input value={bannerHeading} onChange={e => setBannerHeading(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Subtext</Label>
                  <Textarea rows={2} value={bannerSub} onChange={e => setBannerSub(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Text align</Label>
                    <Select value={bannerAlign} onValueChange={(v: any) => setBannerAlign(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Text color</Label>
                    <Input type="color" value={bannerColor} onChange={e => setBannerColor(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Dark overlay: {bannerOverlay}%</Label>
                  <Slider value={[bannerOverlay]} min={0} max={80} step={5} onValueChange={v => setBannerOverlay(v[0])} />
                </div>
                <div className="space-y-1">
                  <Label>Height: {bannerHeight}px</Label>
                  <Slider value={[bannerHeight]} min={200} max={640} step={20} onValueChange={v => setBannerHeight(v[0])} />
                  <p className="text-xs text-muted-foreground">Controls banner height on the published post.</p>
                </div>

                <div className="pt-2 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Heading font</Label>
                      <Select value={bannerHeadingFont} onValueChange={setBannerHeadingFont}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(f => (
                            <SelectItem key={f.slug} value={f.slug} style={{ fontFamily: f.css }}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Heading size: {bannerHeadingSize}px</Label>
                      <Slider value={[bannerHeadingSize]} min={20} max={72} step={1} onValueChange={v => setBannerHeadingSize(v[0])} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Subtext font</Label>
                      <Select value={bannerSubFont} onValueChange={setBannerSubFont}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(f => (
                            <SelectItem key={f.slug} value={f.slug} style={{ fontFamily: f.css }}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Subtext size: {bannerSubSize}px</Label>
                      <Slider value={[bannerSubSize]} min={12} max={32} step={1} onValueChange={v => setBannerSubSize(v[0])} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md overflow-hidden">
                  <div
                    ref={(el) => { if (el) el.setAttribute('style', previewStyle); }}
                    style={{ minHeight: Math.min(bannerHeight, 420) }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(bannerOverlay/100).toFixed(2)})` }} />
                    <div style={{ position: 'relative', padding: '2rem', maxWidth: 720, color: bannerColor, textAlign: bannerAlign }}>
                      <h2 style={{ color: bannerColor, margin: '0 0 .5rem', fontSize: `${bannerHeadingSize}px`, lineHeight: 1.15, fontFamily: fontCssFromSlug(bannerHeadingFont) || undefined }}>{bannerHeading}</h2>
                      {bannerSub && <p style={{ color: bannerColor, margin: 0, fontSize: `${bannerSubSize}px`, opacity: .95, fontFamily: fontCssFromSlug(bannerSubFont) || undefined }}>{bannerSub}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setBannerOpen(false)}>Cancel</Button>
            <Button onClick={saveBanner}>{bannerEditing ? 'Update banner' : 'Insert banner'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreativeBlogEditor;
