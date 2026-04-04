'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { usePlannerContext } from '@/context/PlannerContext';
import { subscribeToCategories, saveCategory, deleteCategory } from '@/lib/firebase/firestore';
import type { Category } from '@/types/planner';
import { v4 as uuidv4 } from 'uuid';

export function useCategories() {
  const { user } = useAuth();
  const { state, dispatch } = usePlannerContext();

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCategories(user.uid, (cats) => {
      dispatch({ type: 'SET_CATEGORIES', categories: cats });
    });
    return unsub;
  }, [user, dispatch]);

  async function addCategory(label: string, color: string) {
    if (!user) return;
    const newCategory: Category = {
      id: uuidv4(),
      label,
      color,
      isDefault: false,
    };
    // Optimistic update
    dispatch({ type: 'ADD_CATEGORY', category: newCategory });
    try {
      await saveCategory(user.uid, newCategory);
    } catch (err) {
      console.error('[useCategories] addCategory failed:', err);
      // Revert optimistic update
      dispatch({ type: 'DELETE_CATEGORY', id: newCategory.id });
      toast.error('Failed to add category');
    }
  }

  async function removeCategory(categoryId: string) {
    if (!user) return;
    // Capture the category before removing so we can restore it on failure
    const categoryToRemove = state.categories.find((c) => c.id === categoryId);
    // Optimistic update
    dispatch({ type: 'DELETE_CATEGORY', id: categoryId });
    try {
      await deleteCategory(user.uid, categoryId);
    } catch (err) {
      console.error('[useCategories] removeCategory failed:', err);
      // Revert: re-add the category that was removed
      if (categoryToRemove) {
        dispatch({ type: 'ADD_CATEGORY', category: categoryToRemove });
      }
      toast.error('Failed to remove category');
    }
  }

  return {
    categories: state.categories,
    addCategory,
    removeCategory,
  };
}
