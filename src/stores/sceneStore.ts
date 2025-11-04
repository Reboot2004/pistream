import { create } from 'zustand';

export interface Source {
    id: string;
    name: string;
    type: 'display' | 'camera' | 'audio' | 'image' | 'text';
    enabled: boolean;
    settings: any;
}

export interface Scene {
    id: string;
    name: string;
    sources: Source[];
    isActive: boolean;
}

interface SceneStore {
    scenes: Scene[];
    activeSceneId: string | null;
    addScene: (name: string) => void;
    removeScene: (id: string) => void;
    setActiveScene: (id: string) => void;
    addSourceToScene: (sceneId: string, source: Source) => void;
    removeSourceFromScene: (sceneId: string, sourceId: string) => void;
    toggleSource: (sceneId: string, sourceId: string) => void;
    updateSceneName: (id: string, name: string) => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
    scenes: [
        {
            id: 'scene-1',
            name: 'Scene 1',
            sources: [],
            isActive: true,
        },
    ],
    activeSceneId: 'scene-1',

    addScene: (name) => {
        const newScene: Scene = {
            id: `scene-${Date.now()}`,
            name,
            sources: [],
            isActive: false,
        };
        set((state) => ({
            scenes: [...state.scenes, newScene],
        }));
    },

    removeScene: (id) => {
        set((state) => {
            const newScenes = state.scenes.filter((s) => s.id !== id);
            if (state.activeSceneId === id && newScenes.length > 0) {
                newScenes[0].isActive = true;
                return { scenes: newScenes, activeSceneId: newScenes[0].id };
            }
            return { scenes: newScenes };
        });
    },

    setActiveScene: (id) => {
        set((state) => ({
            scenes: state.scenes.map((scene) => ({
                ...scene,
                isActive: scene.id === id,
            })),
            activeSceneId: id,
        }));
    },

    addSourceToScene: (sceneId, source) => {
        set((state) => ({
            scenes: state.scenes.map((scene) =>
                scene.id === sceneId
                    ? { ...scene, sources: [...scene.sources, source] }
                    : scene
            ),
        }));
    },

    removeSourceFromScene: (sceneId, sourceId) => {
        set((state) => ({
            scenes: state.scenes.map((scene) =>
                scene.id === sceneId
                    ? {
                        ...scene,
                        sources: scene.sources.filter((s) => s.id !== sourceId),
                    }
                    : scene
            ),
        }));
    },

    toggleSource: (sceneId, sourceId) => {
        set((state) => ({
            scenes: state.scenes.map((scene) =>
                scene.id === sceneId
                    ? {
                        ...scene,
                        sources: scene.sources.map((s) =>
                            s.id === sourceId ? { ...s, enabled: !s.enabled } : s
                        ),
                    }
                    : scene
            ),
        }));
    },

    updateSceneName: (id, name) => {
        set((state) => ({
            scenes: state.scenes.map((scene) =>
                scene.id === id ? { ...scene, name } : scene
            ),
        }));
    },
}));
