import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MousePointer,
  Square,
  Circle,
  Minus,
  Triangle,
  Spline,
} from 'lucide-react';

import CanvasScene from './CanvasScene';
import { saveProject, loadProject } from '../lib/projectStorage';

export type Tool =
  | 'select'
  | 'rect'
  | 'oval'
  | 'line'
  | 'triangle'
  | 'quadratic'
  | 'cubic'
  | 'path';

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = id ?? 'new';

  const [tool, setTool] = useState<Tool>('select');
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveSignal, setSaveSignal] = useState(0);
  const [loadedShapes, setLoadedShapes] = useState<any[] | null>(null);
  const [selectedShape, setSelectedShape] = useState<any | null>(null);

  useEffect(() => {
    if (projectId === 'new') {
      setProjectName(`Новый проект`);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      const data = await loadProject(projectId);
      if (data) {
        setProjectName(data.name);
        setLoadedShapes(data.shapes);
      } else {
        setProjectName(`Проект ${projectId}`);
        setLoadedShapes([]);
      }
      setIsLoading(false);
    };
    load();
  }, [projectId]);

  const handleSave = async () => {
    setSaveSignal(prev => prev + 1);
  };

  const handleSaveComplete = async (shapes: any[], lineAlg: string) => {
    const savedId = await saveProject(projectId, projectName, lineAlg, shapes);
    if (projectId === 'new' && savedId) {
      navigate(`/editor/${savedId}`);
    }
  };

  const toolButton = (
    value: Tool,
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      onClick={() => setTool(value)}
      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all border ${
        tool === value
          ? 'bg-blue-600 text-white border-blue-500'
          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span className="text-[11px] leading-none text-center">{label}</span>
    </button>
  );

  const renderShapeProperties = () => {
    if (!selectedShape) {
      return <p className="text-sm text-gray-500">Выберите фигуру, чтобы редактировать</p>;
    }

    return (
      <div className="space-y-2 text-sm">
      
    
        {selectedShape.transform && (
          <>
            <p><strong className="text-gray-700">Позиция:</strong> <span className="text-gray-900">x: {Math.round(selectedShape.transform.x)}, y: {Math.round(selectedShape.transform.y)}</span></p>
            <p><strong className="text-gray-700">Масштаб:</strong> <span className="text-gray-900">x: {selectedShape.transform.scaleX.toFixed(2)}, y: {selectedShape.transform.scaleY.toFixed(2)}</span></p>
          </>
        )}

        {selectedShape.width !== undefined && (
          <p><strong className="text-gray-700">Размер:</strong> <span className="text-gray-900">{selectedShape.width} x {selectedShape.height}</span></p>
        )}

        {selectedShape.radiusX !== undefined && (
          <p><strong className="text-gray-700">Радиусы:</strong> <span className="text-gray-900">{selectedShape.radiusX} x {selectedShape.radiusY}</span></p>
        )}

        {selectedShape.size !== undefined && (
          <p><strong className="text-gray-700">Сторона:</strong> <span className="text-gray-900">{selectedShape.size}</span></p>
        )}

        {(selectedShape.x1 !== undefined || selectedShape.x2 !== undefined) && (
          <>
            <p><strong className="text-gray-700">Точка 1:</strong> <span className="text-gray-900">({selectedShape.x1}, {selectedShape.y1})</span></p>
            <p><strong className="text-gray-700">Точка 2:</strong> <span className="text-gray-900">({selectedShape.x2}, {selectedShape.y2})</span></p>
          </>
        )}

        {selectedShape.fillStyle && (
          <div>
            <strong className="text-gray-700">Заливка:</strong>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-6 rounded border border-gray-300" 
                style={{ backgroundColor: `rgba(${selectedShape.fillStyle.r}, ${selectedShape.fillStyle.g}, ${selectedShape.fillStyle.b}, ${selectedShape.fillStyle.a / 255})` }}
              />
              <span className="text-gray-900 text-xs">
                rgba({selectedShape.fillStyle.r}, {selectedShape.fillStyle.g}, {selectedShape.fillStyle.b}, {(selectedShape.fillStyle.a / 255).toFixed(2)})
              </span>
            </div>
          </div>
        )}

        {selectedShape.strokeStyle && (
          <div>
            <strong className="text-gray-700">Обводка:</strong>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-6 h-6 rounded border border-gray-300" 
                style={{ backgroundColor: `rgba(${selectedShape.strokeStyle.r}, ${selectedShape.strokeStyle.g}, ${selectedShape.strokeStyle.b}, ${selectedShape.strokeStyle.a / 255})` }}
              />
              <span className="text-gray-900 text-xs">
                rgba({selectedShape.strokeStyle.r}, {selectedShape.strokeStyle.g}, {selectedShape.strokeStyle.b}, {(selectedShape.strokeStyle.a / 255).toFixed(2)})
              </span>
            </div>
          </div>
        )}

        {selectedShape.strokeWidth !== undefined && (
          <p><strong className="text-gray-700">Толщина:</strong> <span className="text-gray-900">{selectedShape.strokeWidth}px</span></p>
        )}

        {selectedShape.fillOpacity !== undefined && (
          <p><strong className="text-gray-700">Непрозрачность:</strong> <span className="text-gray-900">{Math.round(selectedShape.fillOpacity * 100)}%</span></p>
        )}

        {selectedShape.points && (
          <div>
            <strong className="text-gray-700">Точки пути:</strong>
            <div className="mt-1 text-gray-900 text-xs max-h-24 overflow-auto">
              {selectedShape.points.map((p: any, i: number) => (
                <div key={i}>({p.x}, {p.y})</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <p className="text-gray-400">Загрузка проекта...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="h-16 border-b border-gray-200 bg-gray-50 flex items-center justify-between px-6 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all text-gray-700"
        >
          ← Назад
        </button>

        <div className="flex items-center gap-4">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="px-3 py-1 rounded-lg border border-gray-300 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all text-white"
          >
            Сохранить
          </button>
        </div>

        <div className="w-20" />
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-28 border-r border-gray-200 bg-gray-50 p-3 overflow-y-auto shrink-0">
          <div className="mb-6">
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
              Фигуры
            </h3>
            <div className="flex flex-col gap-2">
              {toolButton('select', <MousePointer className="w-5 h-5" />, 'Выбор')}
              {toolButton('rect', <Square className="w-5 h-5" />, 'Квадрат')}
              {toolButton('oval', <Circle className="w-5 h-5" />, 'Овал')}
              {toolButton('line', <Minus className="w-5 h-5" />, 'Линия')}
              {toolButton('triangle', <Triangle className="w-5 h-5" />, 'Треуг.')}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
              Кривые
            </h3>
            <div className="flex flex-col gap-2">
              {toolButton('quadratic', <Spline className="w-5 h-5" />, 'Квадро')}
              {toolButton('cubic', <Spline className="w-5 h-5 rotate-12" />, 'Кубич.')}
              {toolButton('path', <Spline className="w-5 h-5 -rotate-12" />, 'Замкн.')}
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <CanvasScene
            tool={tool}
            onToolChange={setTool}
            saveSignal={saveSignal}
            onSaveComplete={handleSaveComplete}
            initialShapes={loadedShapes}
            onSelectionChange={setSelectedShape}
          />
        </main>

        <aside className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto shrink-0">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Свойства</h3>
          {renderShapeProperties()}
        </aside>
      </div>
    </div>
  );
}