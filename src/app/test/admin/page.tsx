'use client';

import React, { useState } from 'react';
import WorkflowCanvas from '@/components/admin/WorkflowCanvas';
import SettingsPanel from '@/components/admin/SettingsPanel';
import { Node } from '@xyflow/react';

export default function AdminPage() {
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const handleNodeClick = (node: Node) => {
        setSelectedNode(node);
    };

    const handleClosePanel = () => {
        setSelectedNode(null);
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <h1 className="text-2xl font-bold text-gray-900">TAG Chatbot Visual Admin</h1>
                <div className="text-sm text-gray-500">
                    설정을 변경하면 즉시 반영됩니다.
                </div>
            </header>

            <main className="flex-1 relative overflow-hidden">
                <WorkflowCanvas onNodeClick={handleNodeClick} />
                {selectedNode && (
                    <SettingsPanel selectedNode={selectedNode} onClose={handleClosePanel} />
                )}
            </main>
        </div>
    );
}
