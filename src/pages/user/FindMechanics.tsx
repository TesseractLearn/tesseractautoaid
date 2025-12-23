import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NearbyMechanicsMap from '@/components/NearbyMechanicsMap';

const FindMechanics: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border safe-area-inset-top sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Find Nearby Mechanics</h1>
        </div>
      </header>

      {/* Map */}
      <main className="p-4">
        <NearbyMechanicsMap />
      </main>
    </div>
  );
};

export default FindMechanics;
