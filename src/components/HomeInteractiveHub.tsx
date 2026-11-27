'use client';

import React, { useState } from 'react';
import type { CatalogModel } from '../lib/catalog';
import { NewModelTimeline } from './NewModelTimeline';
import { HomeInteractiveWorkbench } from './HomeInteractiveWorkbench';

export function HomeInteractiveHub({ models }: { models: CatalogModel[] }) {
  const [selectedModelSlug, setSelectedModelSlug] = useState<string | null>(null);

  const handleSimulateModel = (slug: string) => {
    setSelectedModelSlug(slug);
    const el = document.getElementById('estimator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      <NewModelTimeline models={models} onSimulateModel={handleSimulateModel} />
      <HomeInteractiveWorkbench models={models} externalSelectedSlug={selectedModelSlug} />
    </div>
  );
}
