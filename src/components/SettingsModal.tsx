'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  Download, 
  Upload, 
  Volume2, 
  Sliders, 
  ShieldAlert, 
  Check, 
  Copy,
  Languages,
  Zap
} from 'lucide-react';
import { LanguagePref, UserSettings } from '@/types/vocab';
import { storage } from '@/lib/storage';

interface SettingsModalProps {
  settings: UserSettings;
  syncId: string;
  isCloudSynced: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onUpdateSyncId: (newSyncId: string) => void;
  onReloadState: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  syncId,
  isCloudSynced,
  onClose,
  onUpdateSettings,
  onUpdateSyncId,
  onReloadState,
}) => {
  const [syncIdInput, setSyncIdInput] = useState(syncId);
  const [copied, setCopied] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleCopySyncId = () => {
    navigator.clipboard.writeText(syncIdInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplySyncId = async () => {
    if (!syncIdInput.trim()) return;
    setSyncLoading(true);
    setSyncMessage('');
    onUpdateSyncId(syncIdInput.trim());
    const ok = await storage.pullFromServer();
    setSyncLoading(false);
    if (ok) {
      setSyncMessage('Данные успешно загружены с сервера!');
      onReloadState();
    } else {
      setSyncMessage('Профиль привязан к серверу.');
    }
  };

  const handleExportBackup = () => {
    const json = storage.exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vocab_backup_${syncIdInput}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const ok = storage.importBackupJson(text);
        if (ok) {
          alert('Резервная копия успешно восстановлена!');
          onReloadState();
        } else {
          alert('Ошибка при чтении файла резервной копии.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white">Настройки приложения</h3>
            <p className="text-xs text-slate-400">Синхронизация с сервером и параметры обучения</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Server Sync Profile */}
        <div className="my-5 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Cloud className="w-4 h-4" /> Серверная синхронизация (Vercel)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              В сети
            </span>
          </div>

          <p className="text-xs text-slate-300 mb-3">
            Ваш уникальный идентификатор профиля. Используйте его на других устройствах (телефоне / ПК), чтобы продолжать обучение с того же места:
          </p>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={syncIdInput}
              onChange={(e) => setSyncIdInput(e.target.value)}
              placeholder="Введите ваш ID (например: alex)"
              className="flex-1 py-2 px-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleCopySyncId}
              title="Скопировать ID"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано' : 'Копия'}</span>
            </button>
            <button
              onClick={handleApplySyncId}
              disabled={syncLoading}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
              <span>Применить</span>
            </button>
          </div>

          {syncMessage && (
            <p className="text-xs text-emerald-400 mt-2 font-medium">{syncMessage}</p>
          )}
        </div>

        {/* Section 2: Study Mode */}
        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-400" /> Режим изучения
          </h4>

          {/* Translation Language */}
          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 block mb-2">
              Язык перевода в карточках:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ru', label: '🇷🇺 Русский' },
                { id: 'tj', label: '🇹🇯 Тоҷикӣ' },
                { id: 'both', label: '🌐 Оба языка' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ language: opt.id as LanguagePref })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                    settings.language === opt.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-500/20'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strict Level */}
          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 block mb-1">
              Уровень хардкора для освоения слова:
            </span>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Сколько раз подряд нужно правильно напечатать слово для полного закрепления:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { level: 2, label: '2 раза подряд', desc: 'Стандартный жесткий' },
                { level: 3, label: '3 раза подряд', desc: 'Экстремальный хардкор' },
              ].map((opt) => (
                <button
                  key={opt.level}
                  onClick={() => onUpdateSettings({ strictLevel: opt.level })}
                  className={`py-2.5 px-3 rounded-xl text-left border transition-all ${
                    settings.strictLevel === opt.level
                      ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50 shadow-sm shadow-indigo-500/20'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span className="block text-xs font-bold">{opt.label}</span>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Options */}
          <div className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-300 block">
              Озвучка и произношение:
            </span>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Авто-озвучка при правильном ответе</span>
              <input
                type="checkbox"
                checked={settings.autoPronounce}
                onChange={(e) => onUpdateSettings({ autoPronounce: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Звуковые эффекты победы / ошибки</span>
              <input
                type="checkbox"
                checked={settings.soundFx}
                onChange={(e) => onUpdateSettings({ soundFx: e.target.checked })}
                className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Скорость речи (TTS):</span>
                <span className="font-mono text-cyan-400">{settings.voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.2"
                step="0.05"
                value={settings.voiceSpeed}
                onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Backup & Export */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            onClick={handleExportBackup}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Скачать бэкап</span>
          </button>

          <label className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Загрузить бэкап</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
