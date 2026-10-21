import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    MousePointer2,
    Server,
    Database,
    Globe,
    Code2,
    Search,
    Filter,
    Bot,
    MessageSquare,
    FileText,
    Layers
} from 'lucide-react';

const icons: Record<string, any> = {
    mouse: MousePointer2,
    server: Server,
    database: Database,
    globe: Globe,
    code: Code2,
    search: Search,
    filter: Filter,
    bot: Bot,
    message: MessageSquare,
    file: FileText,
    layers: Layers,
};

const colors: Record<string, { bg: string, border: string, iconBg: string, iconColor: string }> = {
    trigger: { bg: 'bg-white', border: 'border-rose-400', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    action: { bg: 'bg-white', border: 'border-blue-400', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    logic: { bg: 'bg-white', border: 'border-amber-400', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    db: { bg: 'bg-white', border: 'border-emerald-400', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    default: { bg: 'bg-white', border: 'border-slate-300', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
};

function CustomNode({ data, selected }: NodeProps) {
    const Icon = icons[data.icon as string] || icons.server;
    const type = (data.type as string) || 'default';
    const style = colors[type] || colors.default;

    const isInactive = data.inactive === true;
    const inactiveStyle = isInactive ? 'opacity-50 grayscale cursor-not-allowed' : '';

    return (
        <div className={`shadow-sm rounded-lg border-2 w-[240px] transition-all duration-200 overflow-hidden ${style.bg} ${style.border} ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${inactiveStyle}`}>
            {/* Header */}
            <div className={`px-3 py-2 border-b ${style.border} border-opacity-30 bg-gray-50 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${style.iconBg} ${style.iconColor}`}>
                        <Icon size={14} strokeWidth={2.5} />
                    </div>
                    <span className="font-semibold text-xs text-gray-700 uppercase tracking-wider">{type}</span>
                </div>

                {/* AI Indicator */}
                {(data.system_prompt !== undefined || data.icon === 'bot' || (data.label as string)?.includes('Engine') || (data.label as string)?.includes('Router')) && (
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${(data.desc as string)?.includes('Embedding') || (data.label as string)?.includes('Vector')
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`} title={(data.desc as string)?.includes('Embedding') ? "Uses Embedding Model" : "Uses LLM"}>
                        <Bot size={10} />
                        <span>
                            {(data.desc as string)?.includes('Embedding') || (data.label as string)?.includes('Vector') ? 'Vector' : 'LLM'}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3">
                <div className="font-bold text-gray-800 text-sm mb-1">{data.label as string}</div>
                <div className="text-xs text-gray-500 leading-snug">{data.desc as string || 'No description'}</div>
            </div>

            {/* ID Tag (Optional, for debug or visual) */}
            <div className="px-3 py-1 bg-gray-50 border-t border-gray-100 text-[10px] text-gray-400 font-mono text-right">
                {/* ID: {id} */}
            </div>

            <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-gray-400 border-2 !border-white" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-gray-400 border-2 !border-white" />
        </div>
    );
}

export default memo(CustomNode);
