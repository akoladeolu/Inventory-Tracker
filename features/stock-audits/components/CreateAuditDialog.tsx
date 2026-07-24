'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardCheck, Loader2 } from 'lucide-react';

interface CreateAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateAuditDialog({ open, onOpenChange, onCreated }: CreateAuditDialogProps) {
  const [scope, setScope] = useState<'full' | 'category' | 'brand'>('full');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const supabase = createClient();

    const fetchData = async () => {
      const [catRes, brandRes] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('brands').select('id, name').order('name'),
      ]);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
    };
    fetchData();
  }, [open]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();

      let scopeFilter = null;
      if (scope === 'category' && categoryId) {
        scopeFilter = { category_id: categoryId };
      } else if (scope === 'brand' && brandId) {
        scopeFilter = { brand_id: brandId };
      }

      const { data, error } = await supabase.rpc('start_stock_audit', {
        p_scope: scope,
        p_scope_filter: scopeFilter,
        p_notes: notes,
      });

      if (error) throw error;

      toast.success('Stock audit started successfully');
      onOpenChange(false);
      setScope('full');
      setCategoryId('');
      setBrandId('');
      setNotes('');
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create audit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-[#C8A348]" />
            Start New Stock Audit
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Audit Scope</Label>
            <Select value={scope} onValueChange={(v: any) => setScope(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Inventory</SelectItem>
                <SelectItem value="category">By Category</SelectItem>
                <SelectItem value="brand">By Brand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === 'category' && (
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {scope === 'brand' && (
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select value={brandId} onValueChange={(val) => setBrandId(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              placeholder="Any notes about this audit..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (scope === 'category' && !categoryId) || (scope === 'brand' && !brandId)}
            className="bg-[#C8A348] hover:bg-[#B8933E] text-white"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start Audit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
