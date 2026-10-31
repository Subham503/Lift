"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  return (
    <div className="font-sans text-[13px] text-[#8E8E93] leading-relaxed select-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-[22px] font-semibold text-[#F5F5F7] mt-6 mb-3 tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-[17px] font-semibold text-[#F5F5F7] mt-6 mb-2.5 pb-1.5 border-b border-[rgba(255,255,255,0.06)]">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[14px] font-semibold text-[#F5F5F7] mt-4 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          hr: () => <hr className="my-6 border-[rgba(255,255,255,0.08)]" />,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-[8px] border border-[rgba(255,255,255,0.08)] bg-[#0E0E10]">
              <table className="w-full text-left text-[12px] tabular-nums">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-[rgba(255,255,255,0.08)] bg-[#161618] text-[#8E8E93]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#161618]/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="py-2.5 px-3 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="py-2.5 px-3 text-[#F5F5F7]">{children}</td>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded-[4px] bg-[#0E0E10] border border-[rgba(255,255,255,0.08)] font-mono text-[11px] text-[#F5F5F7]">
                  {children}
                </code>
              );
            }
            return (
              <pre className="my-3 p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.08)] font-mono text-[12px] text-[#8E8E93] overflow-x-auto leading-relaxed">
                <code>{children}</code>
              </pre>
            );
          },
          strong: ({ children }) => (
            <strong className="font-semibold text-[#F5F5F7]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#8E8E93]">{children}</em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
