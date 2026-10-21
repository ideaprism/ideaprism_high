'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Node } from '@xyflow/react';

// Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SettingsPanelProps {
    selectedNode: Node | null;
    onClose: () => void;
}

interface BotSetting {
    key: string;
    value: string;
    description: string;
}

export default function SettingsPanel({ selectedNode, onClose }: SettingsPanelProps) {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<Record<string, BotSetting>>({});
    const [hasChanges, setHasChanges] = useState(false);

    // 노드별 편집 가능한 설정 키 매핑
    const nodeSettingsMap: Record<string, string[]> = {
        'router': ['router_model', 'router_system_prompt'],
        'tag-engine': ['tag_model', 'tag_system_prompt'],
        'rag-engine': ['rag_model', 'rag_system_prompt'],
        'database': ['tag_search_limit'],
        'response': ['tag_summary_prompt'],
    };

    const keysToEdit = selectedNode ? nodeSettingsMap[selectedNode.id] || [] : [];

    useEffect(() => {
        if (keysToEdit.length > 0) {
            fetchSettings();
        }
    }, [selectedNode]);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bot_settings')
            .select('*')
            .in('key', keysToEdit);

        if (error) {
            console.error('Error fetching settings:', error);
        } else if (data) {
            const settingsMap: Record<string, BotSetting> = {};
            data.forEach((item: BotSetting) => {
                settingsMap[item.key] = item;
            });
            setSettings(settingsMap);
        }
        setLoading(false);
    };

    const handleChange = (key: string, newValue: string) => {
        setSettings((prev) => ({
            ...prev,
            [key]: { ...prev[key], value: newValue },
        }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        setLoading(true);
        const updates = Object.values(settings).map((setting) => ({
            key: setting.key,
            value: setting.value,
            description: setting.description, // required if insert, ignored on update if not changed but good to include
            updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase
            .from('bot_settings')
            .upsert(updates, { onConflict: 'key' });

        if (error) {
            alert(`저장 실패: ${error.message}`);
        } else {
            alert('설정이 저장되었습니다. 챗봇에 즉시 반영됩니다.');
            setHasChanges(false);
        }
        setLoading(false);
    };

    if (!selectedNode || keysToEdit.length === 0) {
        return null;
    }

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out z-50">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">{selectedNode.data.label as string}</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                    ✕
                </button>
            </div>

            {loading && <div className="text-center py-4">Loading...</div>}

            {!loading && keysToEdit.map((key) => {
                const setting = settings[key];
                if (!setting) return null;

                return (
                    <div key={key} className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {key}
                        </label>
                        <p className="text-xs text-gray-500 mb-2">{setting.description}</p>
                        {key.includes('prompt') ? (
                            <textarea
                                value={setting.value}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className="w-full h-48 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 font-mono"
                            />
                        ) : (
                            <input
                                type="text"
                                value={setting.value}
                                onChange={(e) => handleChange(key, e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                        )}
                    </div>
                );
            })}

            <div className="mt-8 pt-4 border-t border-gray-200">
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || loading}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium ${hasChanges && !loading
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-300 cursor-not-allowed'
                        }`}
                >
                    {loading ? '저장 중...' : '변경사항 저장'}
                </button>
            </div>
        </div>
    );
}
