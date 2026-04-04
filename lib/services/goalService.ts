import { db } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDocs, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { Goal, TaskGoalMapping } from '@/types/deepwork';

const getGoalsRef = (userId: string) => collection(db, 'users', userId, 'goals');
const getMappingsRef = (userId: string) => collection(db, 'users', userId, 'task_goal_mapping');

// ─── Goals ───────────────────────────────────────────────────────────────

export async function fetchGoals(userId: string): Promise<Goal[]> {
  const q = query(getGoalsRef(userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Goal);
}

export async function createGoal(userId: string, goal: Goal) {
  const dRef = doc(getGoalsRef(userId), goal.id);
  await setDoc(dRef, goal);
}

export async function updateGoalService(userId: string, goal: Goal) {
  const dRef = doc(getGoalsRef(userId), goal.id);
  const update: Partial<Goal> = { ...goal };
  await updateDoc(dRef, update);
}

export async function deleteGoalService(userId: string, goalId: string) {
  // First delete mappings
  const q = query(getMappingsRef(userId), where('goalId', '==', goalId));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  
  const dRef = doc(getGoalsRef(userId), goalId);
  await deleteDoc(dRef);
}

// ─── Task Mappings ───────────────────────────────────────────────────────

export async function fetchTaskMappings(userId: string): Promise<TaskGoalMapping[]> {
  const q = query(getMappingsRef(userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as TaskGoalMapping);
}

export async function linkTaskToGoal(userId: string, mapping: TaskGoalMapping) {
  // Overwrite existing mapping for this task if it exists (one task -> one goal)
  const existingQ = query(getMappingsRef(userId), where('taskId', '==', mapping.taskId));
  const snap = await getDocs(existingQ);
  const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletePromises);

  const dRef = doc(getMappingsRef(userId), mapping.id);
  await setDoc(dRef, mapping);
}

export async function unlinkTaskFromGoal(userId: string, taskId: string) {
  const existingQ = query(getMappingsRef(userId), where('taskId', '==', taskId));
  const snap = await getDocs(existingQ);
  const deletePromises = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}
