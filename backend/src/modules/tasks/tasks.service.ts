import { FarmTask, IFarmTask, TaskCategory, TaskPriority } from '../../models/FarmTask';
import { NotFoundError, ValidationError } from '../../shared/errors';

export interface CreateTaskInput {
  title: string;
  cropName?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate: string | Date;
  notes?: string;
}

export interface UpdateTaskInput {
  title?: string;
  cropName?: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string | Date;
  completed?: boolean;
  notes?: string;
}

const DEFAULT_PILOT_TASKS: Array<Omit<CreateTaskInput, 'dueDate'> & { daysAhead: number }> = [
  {
    title: 'Wheat Crown Root Initiation (CRI) Irrigation',
    cropName: 'Wheat',
    category: 'IRRIGATION',
    priority: 'HIGH',
    daysAhead: 1,
    notes: 'Crucial irrigation window: 20-25 days after sowing. Essential to secure crown root development.',
  },
  {
    title: 'Urea Top-Dressing (First Split)',
    cropName: 'Wheat',
    category: 'FERTILIZER',
    priority: 'HIGH',
    daysAhead: 3,
    notes: 'Apply 30 kg Nitrogen/acre after first irrigation when soil is at field capacity.',
  },
  {
    title: 'Chickpea / Gram Pod Borer Monitoring',
    cropName: 'Gram (Chickpea)',
    category: 'PEST_CONTROL',
    priority: 'MEDIUM',
    daysAhead: 5,
    notes: 'Inspect terminal shoots for early Helicoverpa armigera larvae. Install pheromone traps.',
  },
  {
    title: 'Mustard Aphid Field Inspection',
    cropName: 'Mustard',
    category: 'PEST_CONTROL',
    priority: 'MEDIUM',
    daysAhead: 7,
    notes: 'Check flower buds for aphid colonies during morning hours.',
  },
];

export async function getTasks(userId?: string): Promise<IFarmTask[]> {
  const query = userId ? { userId } : { userId: null };
  let tasks = await FarmTask.find(query).sort({ dueDate: 1 }).lean();

  // If no user-specific tasks exist, seed standard pilot tasks
  if (tasks.length === 0) {
    const now = new Date();
    const seeded = await Promise.all(
      DEFAULT_PILOT_TASKS.map((item) => {
        const d = new Date(now);
        d.setDate(d.getDate() + item.daysAhead);
        return FarmTask.create({
          userId: userId || undefined,
          title: item.title,
          cropName: item.cropName,
          category: item.category,
          priority: item.priority,
          dueDate: d,
          completed: false,
          notes: item.notes,
        });
      })
    );
    tasks = seeded.map((t) => t.toObject());
  }

  return tasks as unknown as IFarmTask[];
}

export async function createTask(userId: string | undefined, input: CreateTaskInput): Promise<IFarmTask> {
  const dueDate = new Date(input.dueDate);
  if (isNaN(dueDate.getTime())) {
    throw new ValidationError('Valid due date is required');
  }

  const task = await FarmTask.create({
    userId: userId || undefined,
    title: input.title.trim(),
    cropName: input.cropName?.trim(),
    category: input.category || 'GENERAL',
    priority: input.priority || 'MEDIUM',
    dueDate,
    completed: false,
    notes: input.notes?.trim(),
  });

  return task;
}

export async function updateTask(
  taskId: string,
  userId: string | undefined,
  updates: UpdateTaskInput
): Promise<IFarmTask> {
  const query: Record<string, unknown> = { _id: taskId };
  if (userId) query.userId = userId;

  const task = await FarmTask.findOne(query);
  if (!task) {
    throw new NotFoundError('Farm task');
  }

  if (updates.title !== undefined) task.title = updates.title.trim();
  if (updates.cropName !== undefined) task.cropName = updates.cropName.trim();
  if (updates.category !== undefined) task.category = updates.category;
  if (updates.priority !== undefined) task.priority = updates.priority;
  if (updates.dueDate !== undefined) {
    const d = new Date(updates.dueDate);
    if (!isNaN(d.getTime())) task.dueDate = d;
  }
  if (updates.notes !== undefined) task.notes = updates.notes.trim();

  if (updates.completed !== undefined) {
    task.completed = updates.completed;
    task.completedAt = updates.completed ? new Date() : undefined;
  }

  await task.save();
  return task;
}

export async function deleteTask(taskId: string, userId: string | undefined): Promise<boolean> {
  const query: Record<string, unknown> = { _id: taskId };
  if (userId) query.userId = userId;

  const res = await FarmTask.deleteOne(query);
  if (res.deletedCount === 0) {
    throw new NotFoundError('Farm task');
  }
  return true;
}
