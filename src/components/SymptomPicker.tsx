import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  symptomCategories,
  computePriceEstimate,
  computeSeverity,
  getCategoryForService,
  type SymptomCategory,
} from '@/data/vehicleSymptoms';

interface SymptomPickerProps {
  selectedSymptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
  serviceType?: string;
}

const severityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-destructive/10 text-destructive',
  emergency: 'bg-destructive text-destructive-foreground',
};

const CategorySection: React.FC<{
  category: SymptomCategory;
  selected: string[];
  onToggle: (id: string) => void;
  defaultOpen: boolean;
  searchQuery: string;
}> = ({ category, selected, onToggle, defaultOpen, searchQuery }) => {
  const [open, setOpen] = useState(defaultOpen);

  const filtered = useMemo(() => {
    if (!searchQuery) return category.symptoms;
    return category.symptoms.filter(s =>
      s.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [category.symptoms, searchQuery]);

  const selectedCount = category.symptoms.filter(s => selected.includes(s.id)).length;

  if (filtered.length === 0) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 bg-card hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.emoji}</span>
          <span className="font-semibold text-sm text-foreground">{category.name}</span>
          {selectedCount > 0 && (
            <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5">
              {selectedCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{filtered.length}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1 animate-fade-in">
          {filtered.map(symptom => {
            const isSelected = selected.includes(symptom.id);
            return (
              <label
                key={symptom.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-secondary/50'
                }`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(symptom.id)}
                />
                <span className="flex-1 text-sm text-foreground">{symptom.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${severityColors[symptom.severity]}`}>
                  {symptom.severity === 'emergency' && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                  {symptom.severity}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SymptomPicker: React.FC<SymptomPickerProps> = ({
  selectedSymptoms,
  onSymptomsChange,
  serviceType,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSymptom = (id: string) => {
    onSymptomsChange(
      selectedSymptoms.includes(id)
        ? selectedSymptoms.filter(s => s !== id)
        : [...selectedSymptoms, id]
    );
  };

  const matchedCategory = serviceType ? getCategoryForService(serviceType) : null;

  // Sort categories: matched category first
  const sortedCategories = useMemo(() => {
    if (!matchedCategory) return symptomCategories;
    return [
      ...symptomCategories.filter(c => c.id === matchedCategory),
      ...symptomCategories.filter(c => c.id !== matchedCategory),
    ];
  }, [matchedCategory]);

  const priceEstimate = computePriceEstimate(selectedSymptoms);
  const severity = computeSeverity(selectedSymptoms);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search symptoms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Selected summary */}
      {selectedSymptoms.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedSymptoms.length} symptom{selectedSymptoms.length > 1 ? 's' : ''} selected
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${severityColors[severity]}`}>
              {severity.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Estimated cost</span>
            <span className="text-sm font-bold text-foreground">
              ₹{priceEstimate.min.toLocaleString()} – ₹{priceEstimate.max.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {sortedCategories.map(cat => (
          <CategorySection
            key={cat.id}
            category={cat}
            selected={selectedSymptoms}
            onToggle={toggleSymptom}
            defaultOpen={cat.id === matchedCategory}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
};

export default SymptomPicker;
