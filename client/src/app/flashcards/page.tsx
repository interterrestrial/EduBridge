'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { Layers, Plus, Play, MoreVertical } from 'lucide-react';

export default function FlashcardsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Flashcard Decks</h1>
            <p className="text-[#a0a0b0]">Master concepts through spaced repetition.</p>
          </div>
          <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
            <Plus className="w-5 h-5" /> Generate Deck
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            { title: 'Operating Systems - Deadlocks', cards: 24, masterLevel: '75%', lastReviewed: 'Today' },
            { title: 'React Hooks Deep Dive', cards: 18, masterLevel: '92%', lastReviewed: 'Yesterday' },
            { title: 'Database Normalization', cards: 12, masterLevel: '40%', lastReviewed: '3 days ago' },
            { title: 'Design Patterns', cards: 35, masterLevel: '12%', lastReviewed: 'Never' },
            { title: 'Machine Learning Basics', cards: 42, masterLevel: '60%', lastReviewed: 'Last week' },
          ].map((deck, i) => (
            <div key={i} className="bg-black/20 border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/5 hover:border-indigo-500/30 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-orange-500/20 p-3 rounded-xl text-orange-400">
                    <Layers className="w-6 h-6" />
                  </div>
                  <button className="text-[#a0a0b0] hover:text-white p-1">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-white font-bold text-lg mb-1 leading-tight">{deck.title}</h3>
                <p className="text-sm text-[#a0a0b0] mb-6">{deck.cards} cards</p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-[#a0a0b0] mb-2">
                  <span>Mastery: <strong className="text-white">{deck.masterLevel}</strong></span>
                  <span>{deck.lastReviewed}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 mb-4">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-1.5 rounded-full" 
                    style={{ width: deck.masterLevel }}
                  ></div>
                </div>
                
                <button className="w-full bg-white/5 hover:bg-indigo-500 hover:border-indigo-500 text-white border border-white/10 rounded-xl py-2.5 flex items-center justify-center gap-2 transition-colors font-medium text-sm">
                  <Play className="w-4 h-4 fill-current" /> Study Now
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </DashboardLayout>
  );
}
