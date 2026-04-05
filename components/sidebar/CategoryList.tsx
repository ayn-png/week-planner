'use client';

import { motion } from 'framer-motion';
import type { Category } from '@/types/planner';
import { CategoryCard } from './CategoryCard';

interface CategoryListProps {
  categories: Category[];
  onDelete: (id: string) => void;
  onTap?: (category: Category) => void;
}

const containerVariants = {
  visible: { transition: { staggerChildren: 0.05 } },
};

export function CategoryList({ categories, onDelete, onTap }: CategoryListProps) {
  const sorted = [...categories].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.label.localeCompare(b.label);
  });

  return (
    <motion.div
      className="space-y-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      data-tour="categories"
    >
      {sorted.map((cat, i) => (
        <CategoryCard key={cat.id} category={cat} onDelete={onDelete} onTap={onTap ? () => onTap(cat) : undefined} index={i} />
      ))}
    </motion.div>
  );
}
