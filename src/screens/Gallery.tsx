import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { loadAllProjects, deleteProject, type ProjectMeta } from '../lib/projectStorage';

export default function Gallery() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  const loadProjects = async () => {
    const list = await loadAllProjects();
    setProjects(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Удалить проект?')) {
      await deleteProject(id);
      await loadProjects();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="p-8 min-h-screen bg-slate-950">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-white">Галерея проектов</h1>
        <Link
          to="/editor/new"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          + Создать проект
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-slate-400 text-center py-12">
          У вас пока нет проектов. Нажмите "Создать проект"
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              whileHover={{ scale: 1.02, y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group relative"
            >
              <Link to={`/editor/${project.id}`}>
                <div className="bg-slate-800 rounded-lg p-4 hover:bg-slate-700 transition-colors">
                  <h3 className="text-white font-semibold text-lg pr-8">{project.name}</h3>
                  <p className="text-slate-400 text-sm mt-2">Создан: {formatDate(project.createdAt)}</p>
                  <p className="text-slate-500 text-xs mt-1">Изменён: {formatDate(project.updatedAt)}</p>
                </div>
              </Link>
              <button
                onClick={(e) => handleDelete(project.id, e)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Удалить проект"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}