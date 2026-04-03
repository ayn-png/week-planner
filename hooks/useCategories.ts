'use client';

import { useEffect } from 'react';
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
    dispatch({ type: 'ADD_CATEGORY', category: newCategory });
    await saveCategory(user.uid, newCategory);
  }

  async function removeCategory(categoryId: string) {
    if (!user) return;
    dispatch({ type: 'DELETE_CATEGORY', id: categoryId });
    await deleteCategory(user.uid, categoryId);
  }

  return {
    categories: state.categories,
    addCategory,
    removeCategory,
  };
}
