import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, CheckCircle2, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ALL_SERVICES = [
  { id: 'puncture', label: 'Flat Tire / Puncture' },
  { id: 'battery', label: 'Battery & Electrical' },
  { id: 'engine', label: 'Engine Repair' },
  { id: 'towing', label: 'Towing' },
  { id: 'ac_repair', label: 'AC Repair' },
  { id: 'oil_service', label: 'Oil & Lube' },
  { id: 'general', label: 'General Repair' },
  { id: 'denting', label: 'Denting & Painting' },
  { id: 'brakes', label: 'Brake Service' },
  { id: 'clutch', label: 'Clutch Repair' },
  { id: 'suspension', label: 'Suspension & Steering' },
  { id: 'transmission', label: 'Transmission Repair' },
  { id: 'exhaust', label: 'Exhaust System' },
  { id: 'radiator', label: 'Radiator & Cooling' },
  { id: 'windshield', label: 'Windshield & Glass' },
  { id: 'body_work', label: 'Body Work' },
  { id: 'car_wash', label: 'Car Wash & Detailing' },
  { id: 'diagnostics', label: 'Diagnostics & Scanning' },
];

interface ServicesPickerProps {
  selected: string[];
  onChange: (services: string[]) => void;
}

const ServicesPicker: React.FC<ServicesPickerProps> = ({ selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(selected);
    setOpen(isOpen);
  };

  const toggleService = (id: string) => {
    setDraft(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const selectAll = () => setDraft(ALL_SERVICES.map(s => s.id));
  const clearAll = () => setDraft([]);

  const handleSave = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-foreground flex items-center gap-2">
          <Wrench className="w-4 h-4 text-muted-foreground" /> Services Offered
        </label>
        <Dialog open={open} onOpenChange={handleOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-primary">
              <Pencil className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Select Services</DialogTitle>
            </DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={clearAll}>Clear All</Button>
              <span className="text-xs text-muted-foreground ml-auto">{draft.length} selected</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {ALL_SERVICES.map(s => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    draft.includes(s.id) ? 'bg-primary/10 border border-primary/20' : 'bg-card border border-border hover:border-primary/30'
                  }`}
                  onClick={() => toggleService(s.id)}
                >
                  <Checkbox checked={draft.includes(s.id)} className="pointer-events-none" />
                  <span className="text-sm font-medium text-foreground">{s.label}</span>
                  {draft.includes(s.id) && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                </label>
              ))}
            </div>
            <Button onClick={handleSave} className="w-full mt-3">
              Save ({draft.length} services)
            </Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        {selected.length === 0 ? (
          <p className="text-xs text-muted-foreground">No services selected. Tap the edit icon to add.</p>
        ) : (
          selected.map(id => {
            const svc = ALL_SERVICES.find(s => s.id === id);
            return (
              <Badge key={id} variant="default" className="bg-primary text-primary-foreground text-xs">
                {svc?.label || id}
              </Badge>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ServicesPicker;
