'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { Send, Bot, User, Paperclip } from 'lucide-react';

export default function AIChatPage() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">AI Tutor</h1>
          <p className="text-[#a0a0b0]">Ask questions about your uploaded notes or general topics.</p>
        </div>

        <div className="flex-1 bg-black/20 border border-white/10 rounded-2xl flex flex-col overflow-hidden relative">
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="flex items-start gap-4 max-w-[80%]">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 text-sm text-[#e0e0e0] leading-relaxed">
                Hello! I'm your AI tutor. I have access to your uploaded notes, including "Operating Systems - Chapter 4" and "Database Management Systems". How can I help you study today?
              </div>
            </div>

            <div className="flex items-start gap-4 max-w-[80%] ml-auto flex-row-reverse">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                <User className="w-5 h-5 text-purple-400" />
              </div>
              <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-2xl rounded-tr-sm p-4 text-sm text-white leading-relaxed">
                Can you explain what a race condition is from the Operating Systems notes?
              </div>
            </div>

            <div className="flex items-start gap-4 max-w-[80%]">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Bot className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 text-sm text-[#e0e0e0] leading-relaxed space-y-3">
                <p>Based on your "Operating Systems - Chapter 4" notes, a <strong>race condition</strong> is a situation where multiple processes or threads access and manipulate shared data concurrently.</p>
                <p>The final outcome of the execution depends on the specific order in which the instructions are executed. This can lead to unpredictable behavior and data corruption.</p>
                <div className="bg-black/40 border border-white/10 p-3 rounded-xl mt-3 font-mono text-xs text-indigo-300">
                  Example: Process A and Process B both try to increment a shared variable `counter = 5` at the exact same time. Instead of resulting in 7, the final value might be 6 because they overwrote each other's operation.
                </div>
                <p>Would you like me to generate a practice question about this?</p>
              </div>
            </div>

          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
            <div className="relative flex items-end gap-2">
              <button className="p-3 text-[#a0a0b0] hover:text-white transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea 
                rows={1}
                placeholder="Ask your AI tutor..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-white placeholder-[#a0a0b0] focus:outline-none focus:border-indigo-500/50 resize-none max-h-32 min-h-[48px]"
              ></textarea>
              <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
