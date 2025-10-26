import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import DashboardClient from './DashboardClient';

type Task = {
  title: string;
  userStoryId: string;
  userStory: string;
  acceptanceCriteria?: Array<{ description: string }>;
  uncertainties?: string[];
  priority: string;
  dependencies?: string[];
  risk?: number;
  status: string;
  questions?: string[];
};

async function loadTasks(): Promise<Task[]> {
  try {
    const tasksPath = path.join(process.cwd(), '.codekiwi', 'tasks.yaml');
    const fileContents = fs.readFileSync(tasksPath, 'utf8');
    const tasks = YAML.parse(fileContents);
    return Array.isArray(tasks) ? tasks : [];
  } catch (error) {
    console.error('Error reading tasks.yaml:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const tasks = await loadTasks();
  
  return <DashboardClient tasks={tasks} />;
}

