import { BaseDirectory, mkdir, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const PROJECTS_DIR = 'VectorEngine/projects';
const INDEX_FILE = 'VectorEngine/index.json';

export type ProjectMeta = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectData = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lineAlgorithm: string;
  shapes: any[];
};

async function ensureDir() {
  try {
    await mkdir(PROJECTS_DIR, { baseDir: BaseDirectory.Document, recursive: true });
  } catch (e) {}
  try {
    await mkdir('VectorEngine', { baseDir: BaseDirectory.Document, recursive: true });
  } catch (e) {}
}

async function readIndex(): Promise<ProjectMeta[]> {
  await ensureDir();
  try {
    const content = await readTextFile(INDEX_FILE, { baseDir: BaseDirectory.Document });
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeIndex(index: ProjectMeta[]) {
  await ensureDir();
  await writeTextFile(INDEX_FILE, JSON.stringify(index, null, 2), { baseDir: BaseDirectory.Document });
}

export async function saveProject(projectId: string, name: string, lineAlgorithm: string, shapes: any[]): Promise<void> {
  await ensureDir();
  
  const now = new Date().toISOString();
  let index = await readIndex();
  let existing = index.find(p => p.id === projectId);
  let finalId = projectId;
  
  if (projectId === 'new') {
    const nextId = (index.length + 1).toString();
    finalId = nextId;
    existing = null;
  }
  
  if (existing) {
    existing.name = name;
    existing.updatedAt = now;
  } else {
    index.push({
      id: finalId,
      name: name,
      createdAt: now,
      updatedAt: now
    });
  }
  
  await writeIndex(index);
  
  const projectData: ProjectData = {
    id: finalId,
    name: name,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lineAlgorithm: lineAlgorithm,
    shapes: shapes
  };
  
  const filePath = `${PROJECTS_DIR}/${finalId}.json`;
  await writeTextFile(filePath, JSON.stringify(projectData, null, 2), { baseDir: BaseDirectory.Document });
}

export async function loadProject(projectId: string): Promise<ProjectData | null> {
  await ensureDir();
  
  try {
    const filePath = `${PROJECTS_DIR}/${projectId}.json`;
    const content = await readTextFile(filePath, { baseDir: BaseDirectory.Document });
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function loadAllProjects(): Promise<ProjectMeta[]> {
  return await readIndex();
}

export async function deleteProject(projectId: string): Promise<void> {
  await ensureDir();
  
  const index = await readIndex();
  const newIndex = index.filter(p => p.id !== projectId);
  await writeIndex(newIndex);
}