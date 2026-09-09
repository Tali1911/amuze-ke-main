import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import FieldLabel from './shared/FieldLabel';
import { TypographyStyle } from '@/lib/typography';
import { HOME_INTERNAL_LINKS, EXTERNAL_LINK_VALUE } from '@/lib/homeLinkOptions';
import type { HomeCard } from '@/components/home/CardsGridSection';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  item?: ContentItem | null;
  /** Which public page these sections belong to. Defaults to 'home'. */
  scope?: 'home' | 'news' | 'camp' | 'programs';
}

/** Built-in home sections that map to existing components on the homepage. */
export const HOME_BUILTIN_SECTIONS = [
  { value: 'hero',          label: 'Hero (rotating slides)' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'programs',      label: 'Programs Overview' },
  { value: 'calendar',      label: 'Yearly Calendar' },
  { value: 'testimonials',  label: 'Testimonials' },
] as const;

/** Built-in News & Updates sections that map to existing components. */
export const NEWS_BUILTIN_SECTIONS = [
  { value: 'announcements', label: 'Announcements' },
  { value: 'calendar',      label: 'Yearly Calendar' },
] as const;

const buildKindOptions = (scope: 'home' | 'news' | 'camp' | 'programs') => {
  const list = scope === 'news'
    ? NEWS_BUILTIN_SECTIONS
    : scope === 'camp' || scope === 'programs'
      ? []
      : HOME_BUILTIN_SECTIONS;
  return [
    ...list.map(s => ({ value: s.value, label: `Built-in — ${s.label}` })),
    { value: 'custom',       label: 'Custom Section (title, subtitle, image, background)' },
    { value: 'custom_cards', label: 'Cards / Grid Section (row of linked cards)' },
  ];
};


const uid = () => Math.random().toString(36).slice(2, 10);

const emptyCard = (): HomeCard => ({
  id: uid(),
  title: '',
  body: '',
  image_url: '',
  link_type: 'internal',
  link_to: '',
  link_label: 'Learn more',
  badge: '',
  typography: {},
});

const HomeSectionEditor: React.FC<Props> = ({ isOpen, onClose, onSave, item, scope = 'home' }) => {
  const SECTION_KIND_OPTIONS = React.useMemo(() => buildKindOptions(scope), [scope]);
  const scopeLabel = scope === 'news' ? 'News & Updates Page' : scope === 'camp' ? 'Camp Page' : scope === 'programs' ? 'Programs Page' : 'Home Page';
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    sectionKind: 'custom' as string,
    order: 10,
    visible: true,
    eyebrow: '',
    subtitle: '',
    subtitle_2: '',
    background_color: '#ffffff',
    image_url: '',
    image_alignment: 'left' as 'left' | 'right' | 'center',
    columns: 3 as 2 | 3 | 4,
  });
  const [cards, setCards] = useState<HomeCard[]>([]);
  const [typography, setTypography] = useState<Record<string, TypographyStyle | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // holds card id or 'section'
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        content: item.content || '',
        sectionKind: item.metadata?.section_kind || 'custom',
        order: item.metadata?.order ?? 10,
        visible: item.metadata?.visible !== false,
        eyebrow: item.metadata?.eyebrow || '',
        subtitle: item.metadata?.subtitle || '',
        subtitle_2: item.metadata?.subtitle_2 || '',
        background_color: item.metadata?.background_color || '#ffffff',
        image_url: item.metadata?.image_url || '',
        image_alignment: item.metadata?.image_alignment || 'left',
        columns: [2, 3, 4].includes(item.metadata?.columns) ? item.metadata.columns : 3,
      });
      setTypography(item.metadata?.typography || {});
      setCards(Array.isArray(item.metadata?.cards) ? item.metadata.cards : []);
    } else {
      setFormData({
        title: '',
        content: '',
        sectionKind: 'custom',
        order: 10,
        visible: true,
        eyebrow: '',
        subtitle: '',
        subtitle_2: '',
        background_color: '#ffffff',
        image_url: '',
        image_alignment: 'left',
        columns: 3,
      });
      setTypography({});
      setCards([]);
    }
  }, [item, isOpen]);

  const isCustom = formData.sectionKind === 'custom';
  const isCards = formData.sectionKind === 'custom_cards';
  const isCustomKind = isCustom || isCards;

  const setFieldTypography = (key: string) => (v: TypographyStyle | undefined) => {
    setTypography(prev => {
      const next = { ...prev };
      if (v) next[key] = v; else delete next[key];
      return next;
    });
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `home/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('content-images').upload(path, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from('content-images').getPublicUrl(path);
    return publicUrl;
  };

  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Please select an image file', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Image must be less than 5MB', variant: 'destructive' }); return; }
    setUploading('section');
    try {
      const url = await uploadImage(file);
      setFormData(prev => ({ ...prev, image_url: url }));
      toast({ title: 'Image uploaded' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  // --- Cards helpers ---
  const updateCard = (id: string, patch: Partial<HomeCard>) => {
    setCards(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  };
  const updateCardTypography = (id: string, key: 'title' | 'body' | 'badge') =>
    (v: TypographyStyle | undefined) => {
      setCards(prev => prev.map(c => {
        if (c.id !== id) return c;
        const nextT = { ...(c.typography || {}) };
        if (v) (nextT as any)[key] = v; else delete (nextT as any)[key];
        return { ...c, typography: nextT };
      }));
    };
  const addCard = () => setCards(prev => [...prev, emptyCard()]);
  const removeCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));
  const moveCard = (id: string, dir: -1 | 1) => {
    setCards(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };
  const handleCardImageUpload = async (cardId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast({ title: 'Please select an image file', variant: 'destructive' }); return; }
    if (file.size > 5 * 1024 * 1024) { toast({ title: 'Image must be less than 5MB', variant: 'destructive' }); return; }
    setUploading(cardId);
    try {
      const url = await uploadImage(file);
      updateCard(cardId, { image_url: url });
      toast({ title: 'Card image uploaded' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const slugPrefix = scope === 'news' ? 'news' : scope === 'camp' ? 'camp' : scope === 'programs' ? 'programs-page' : 'home';
      const baseSlug = isCustomKind
        ? `${slugPrefix}-${isCards ? 'cards' : 'custom'}-${(formData.title || 'section')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${item?.id ? item.id.slice(0, 6) : Date.now()}`
        : `${slugPrefix}-${formData.sectionKind}`;


      const metadata: Record<string, any> = {
        scope,
        section_kind: formData.sectionKind,
        order: formData.order,
        visible: formData.visible,
        typography,
      };
      if (isCustom) {
        metadata.eyebrow = formData.eyebrow;
        metadata.subtitle = formData.subtitle;
        metadata.subtitle_2 = formData.subtitle_2;
        metadata.background_color = formData.background_color;
        metadata.image_url = formData.image_url;
        metadata.image_alignment = formData.image_alignment;
      }
      if (isCards) {
        metadata.eyebrow = formData.eyebrow;
        metadata.subtitle = formData.subtitle;
        metadata.background_color = formData.background_color;
        metadata.columns = formData.columns;
        metadata.cards = cards;
      }

      const builtInPrefix = scope === 'news' ? 'News' : scope === 'camp' ? 'Camp' : scope === 'programs' ? 'Programs' : 'Home';
      const contentData = {
        title: formData.title || (isCustomKind ? (isCards ? 'Cards Section' : 'Custom Section') : `${builtInPrefix}: ${formData.sectionKind}`),
        slug: item?.slug || baseSlug,
        content: formData.content,
        content_type: 'about_section' as const,
        status: 'published' as const,
        metadata,
      };

      if (item?.id) {
        await cmsService.updateContent(item.id, contentData);
        toast({ title: `${scopeLabel} section updated` });
      } else {
        await cmsService.createContent(contentData);
        toast({ title: `${scopeLabel} section created` });
      }
      window.dispatchEvent(new Event('cms-content-updated'));
      onSave();
      onClose();
    } catch (error) {
      console.error(`Error saving ${scopeLabel.toLowerCase()} section:`, error);
      toast({
        title: `Error saving ${scopeLabel.toLowerCase()} section`,
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? 'Edit' : 'Create'} {scopeLabel} Section</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Section Kind</Label>
            <Select
              value={formData.sectionKind}
              onValueChange={(v) => setFormData({ ...formData, sectionKind: v })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTION_KIND_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isCustomKind && (
              <p className="text-xs text-muted-foreground mt-1">
                Built-in sections keep their existing content. You can override the header text/typography
                and toggle visibility to hide them from the homepage.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <Label className="mb-0">Visible on homepage</Label>
              <p className="text-xs text-muted-foreground">Toggle off to hide without deleting.</p>
            </div>
            <Switch
              checked={formData.visible}
              onCheckedChange={(v) => setFormData({ ...formData, visible: v })}
            />
          </div>

          {isCustomKind && (
            <div>
              <FieldLabel
                htmlFor="eyebrow"
                typography={typography.eyebrow}
                onTypographyChange={setFieldTypography('eyebrow')}
              >
                Eyebrow / Tag Label (optional)
              </FieldLabel>
              <Input
                id="eyebrow"
                value={formData.eyebrow}
                placeholder="e.g. WHY IT MATTERS"
                onChange={(e) => setFormData({ ...formData, eyebrow: e.target.value })}
              />
            </div>
          )}

          <div>
            <FieldLabel
              htmlFor="title"
              typography={typography.title}
              onTypographyChange={setFieldTypography('title')}
            >
              {isCustomKind ? 'Section Title' : 'Section Header Title (override, optional)'}
            </FieldLabel>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required={isCustom}
            />
          </div>

          <div>
            <FieldLabel
              htmlFor="subtitle"
              typography={typography.subtitle}
              onTypographyChange={setFieldTypography('subtitle')}
            >
              Subtitle (optional)
            </FieldLabel>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          {isCustom && (
            <div>
              <FieldLabel
                htmlFor="subtitle_2"
                typography={typography.subtitle_2}
                onTypographyChange={setFieldTypography('subtitle_2')}
              >
                Subtitle 2 (optional)
              </FieldLabel>
              <Input
                id="subtitle_2"
                value={formData.subtitle_2}
                onChange={(e) => setFormData({ ...formData, subtitle_2: e.target.value })}
              />
            </div>
          )}

          {isCustom && (
            <div>
              <FieldLabel
                htmlFor="content"
                typography={typography.body}
                onTypographyChange={setFieldTypography('body')}
              >
                Body Content
              </FieldLabel>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
              />
            </div>
          )}

          {isCustomKind && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background_color"
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
              {isCustom && (
                <div>
                  <Label htmlFor="image_alignment">Image Alignment</Label>
                  <Select
                    value={formData.image_alignment}
                    onValueChange={(v: 'left' | 'right' | 'center') =>
                      setFormData({ ...formData, image_alignment: v })
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="center">Center (below text)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isCards && (
                <div>
                  <Label htmlFor="columns">Cards Per Row</Label>
                  <Select
                    value={String(formData.columns)}
                    onValueChange={(v) => setFormData({ ...formData, columns: Number(v) as 2 | 3 | 4 })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 columns</SelectItem>
                      <SelectItem value="3">3 columns</SelectItem>
                      <SelectItem value="4">4 columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {isCustom && (
            <div>
              <Label>Section Image (optional)</Label>
              <div className="flex items-center gap-3 mt-2">
                {formData.image_url ? (
                  <div className="relative">
                    <img src={formData.image_url} alt="preview" className="w-24 h-24 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      aria-label="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleSectionImageUpload} />
                  <Button
                    type="button" variant="outline" size="sm"
                    onClick={() => fileRef.current?.click()} disabled={uploading === 'section'}
                  >
                    <Upload size={14} className="mr-1" />
                    {uploading === 'section' ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Or paste an image URL"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {isCards && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Cards</Label>
                <Button type="button" size="sm" variant="outline" onClick={addCard}>
                  <Plus className="h-4 w-4 mr-1" /> Add Card
                </Button>
              </div>
              {cards.length === 0 && (
                <p className="text-sm text-muted-foreground border rounded p-3">
                  No cards yet. Click "Add Card" to build your grid.
                </p>
              )}
              {cards.map((card, idx) => (
                <CardEditor
                  key={card.id}
                  card={card}
                  index={idx}
                  total={cards.length}
                  uploading={uploading === card.id}
                  onChange={(patch) => updateCard(card.id, patch)}
                  onTypographyChange={(k) => updateCardTypography(card.id, k)}
                  onUpload={(e) => handleCardImageUpload(card.id, e)}
                  onMove={(dir) => moveCard(card.id, dir)}
                  onRemove={() => removeCard(card.id)}
                />
              ))}
            </div>
          )}

          <div>
            <Label htmlFor="order">Display Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              min="1"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Built-in section defaults: Hero 1, Announcements 2, Programs 3, Calendar 4, Testimonials 5.
              Custom sections use any number; lower renders first.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ------------------- Card sub-editor -------------------

interface CardEditorProps {
  card: HomeCard;
  index: number;
  total: number;
  uploading: boolean;
  onChange: (patch: Partial<HomeCard>) => void;
  onTypographyChange: (key: 'title' | 'body' | 'badge') => (v: TypographyStyle | undefined) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

const CardEditor: React.FC<CardEditorProps> = ({
  card, index, total, uploading, onChange, onTypographyChange, onUpload, onMove, onRemove,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const isExternal = card.link_type === 'external';

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Card {index + 1}</span>
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(-1)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" disabled={index === total - 1} onClick={() => onMove(1)}>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-[auto,1fr] gap-3 items-start">
        {card.image_url ? (
          <div className="relative">
            <img src={card.image_url} alt="" className="w-20 h-20 object-cover rounded border" />
            <button
              type="button"
              onClick={() => onChange({ image_url: '' })}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
              aria-label="Remove image"
            >
              <X size={10} />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground">
            <ImageIcon size={20} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload size={12} className="mr-1" />
            {uploading ? 'Uploading...' : 'Upload Card Image'}
          </Button>
          <Input
            value={card.image_url || ''}
            onChange={(e) => onChange({ image_url: e.target.value })}
            placeholder="Or paste an image URL"
            className="text-xs h-8"
          />
        </div>
      </div>

      <div>
        <FieldLabel typography={card.typography?.badge} onTypographyChange={onTypographyChange('badge')}>
          Badge (optional)
        </FieldLabel>
        <Input
          value={card.badge || ''}
          onChange={(e) => onChange({ badge: e.target.value })}
          placeholder="e.g. NEW"
        />
      </div>

      <div>
        <FieldLabel typography={card.typography?.title} onTypographyChange={onTypographyChange('title')}>
          Card Title
        </FieldLabel>
        <Input
          value={card.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Card title"
        />
      </div>

      <div>
        <FieldLabel typography={card.typography?.body} onTypographyChange={onTypographyChange('body')}>
          Write-up
        </FieldLabel>
        <Textarea
          value={card.body || ''}
          onChange={(e) => onChange({ body: e.target.value })}
          rows={3}
          placeholder="Short description shown on the card"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Link Target</Label>
          <Select
            value={isExternal ? EXTERNAL_LINK_VALUE : (card.link_to || '')}
            onValueChange={(v) => {
              if (v === EXTERNAL_LINK_VALUE) {
                onChange({ link_type: 'external', link_to: card.link_type === 'external' ? card.link_to : '' });
              } else {
                onChange({ link_type: 'internal', link_to: v });
              }
            }}
          >
            <SelectTrigger><SelectValue placeholder="No link" /></SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {HOME_INTERNAL_LINKS.map(o => (
                <SelectItem key={o.value} value={o.value}>
                  {o.group ? `${o.group} · ${o.label}` : o.label}
                </SelectItem>
              ))}
              <SelectItem value={EXTERNAL_LINK_VALUE}>External URL…</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Link Label</Label>
          <Input
            value={card.link_label || ''}
            onChange={(e) => onChange({ link_label: e.target.value })}
            placeholder="Learn more"
          />
        </div>
      </div>

      {isExternal && (
        <div>
          <Label>External URL</Label>
          <Input
            value={card.link_to || ''}
            onChange={(e) => onChange({ link_to: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
      )}
    </div>
  );
};

export default HomeSectionEditor;
