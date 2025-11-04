import { useState } from 'react';
import { useSceneStore } from '../stores/sceneStore';

export default function SceneManager() {
    const { scenes, activeSceneId, addScene, removeScene, setActiveScene, updateSceneName } = useSceneStore();
    const [isAddingScene, setIsAddingScene] = useState(false);
    const [newSceneName, setNewSceneName] = useState('');

    const handleAddScene = () => {
        if (newSceneName.trim()) {
            addScene(newSceneName.trim());
            setNewSceneName('');
            setIsAddingScene(false);
        }
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-300 uppercase">Scenes</h2>
                <button
                    onClick={() => setIsAddingScene(true)}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                    + Add
                </button>
            </div>

            <div className="space-y-2">
                {scenes.map((scene) => (
                    <div
                        key={scene.id}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${scene.isActive
                                ? 'bg-blue-600 border border-blue-500'
                                : 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                            }`}
                        onClick={() => setActiveScene(scene.id)}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{scene.name}</span>
                            {scenes.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeScene(scene.id);
                                    }}
                                    className="text-gray-400 hover:text-red-400 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="text-xs text-gray-300 mt-1">
                            {scene.sources.length} source{scene.sources.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                ))}
            </div>

            {isAddingScene && (
                <div className="mt-3 p-3 bg-gray-700 rounded-lg">
                    <input
                        type="text"
                        value={newSceneName}
                        onChange={(e) => setNewSceneName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddScene()}
                        placeholder="Scene name..."
                        className="w-full px-2 py-1 text-sm bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                        autoFocus
                    />
                    <div className="flex space-x-2 mt-2">
                        <button
                            onClick={handleAddScene}
                            className="flex-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => {
                                setIsAddingScene(false);
                                setNewSceneName('');
                            }}
                            className="flex-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
