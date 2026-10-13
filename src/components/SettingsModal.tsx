'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  RefreshCw, 
  Download, 
  Upload, 
  Sliders, 
  Check, 
  Copy,
  Trash2,
  AlertTriangle
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
  onResetProgress?: () => Promise<void> | void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  syncId,
  isCloudSynced,
  onClose,
  onUpdateSettings,
  onUpdateSyncId,
  onReloadState,
  onResetProgress,
}) => {
  const [syncIdInput, setSyncIdInput] = useState(syncId);
  const [copied, setCopied] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);

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
      setSyncMessage('Данные успешно загружены с сервера.');
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
          alert('Резервная копия успешно восстановлена.');
          onReloadState();
        } else {
          alert('Ошибка при чтении файла резервной копии.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteReset = async () => {
    setResetting(true);
    try {
      if (onResetProgress) {
        await onResetProgress();
      } else {
        await storage.resetProgress();
        onReloadState();
      }
      onClose();
    } finally {
      setResetting(false);
      setShowConfirmReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="studio-surface w-full max-w-lg rounded-2xl p-6 border border-white/[0.12] shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Настройки приложения</h3>
            <p className="text-xs text-slate-400 mt-0.5">Синхронизация прогресса и параметры тренировки</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06]"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Server Sync Profile */}
        <div className="my-5 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-sky-400" /> Серверный профиль
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              В сети
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Ваш идентификатор синхронизации. Используйте его на телефоне или компьютере, чтобы продолжать обучение с того же места:
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={syncIdInput}
              onChange={(e) => setSyncIdInput(e.target.value)}
              placeholder="Введите ID (например: alex)"
              className="flex-1 py-2 px-3 rounded-lg studio-input text-xs font-mono"
            />
            <button
              onClick={handleCopySyncId}
              title="Скопировать ID"
              className="px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium flex items-center gap-1 border border-white/[0.08] transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Скопировано' : 'Копия'}</span>
            </button>
            <button
              onClick={handleApplySyncId}
              disabled={syncLoading}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${syncLoading ? 'animate-spin' : ''}`} />
              <span>Применить</span>
            </button>
          </div>

          {syncMessage && (
            <p className="text-xs text-emerald-400 mt-2 font-medium">{syncMessage}</p>
          )}
        </div>

        {/* Section 2: Study Mode */}
        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" /> Параметры обучения
          </h4>

          {/* Translation Language */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
            <span className="text-xs font-medium text-slate-300 block mb-2">
              Язык перевода в карточках:
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ru', label: 'Русский' },
                { id: 'tj', label: 'Тоҷикӣ' },
                { id: 'both', label: 'Оба языка' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ language: opt.id as LanguagePref })}
                  className={`py-2 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                    settings.language === opt.id
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-white/[0.02] text-slate-400 border border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strict Level */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
            <span className="text-xs font-medium text-slate-300 block mb-1">
              Уровень строгости:
            </span>
            <p className="text-[11px] text-slate-400 mb-2.5">
              Количество безошибочных повторений для освоения слова:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { level: 2, label: '2 раза подряд', desc: 'Стандартный жесткий' },
                { level: 3, label: '3 раза подряд', desc: 'Максимальный хардкор' },
              ].map((opt) => (
                <button
                  key={opt.level}
                  onClick={() => onUpdateSettings({ strictLevel: opt.level })}
                  className={`py-2 px-3 rounded-lg text-left transition-colors ${
                    settings.strictLevel === opt.level
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-white/[0.02] text-slate-400 border border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="block text-xs font-medium">{opt.label}</span>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Audio Options */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <span className="text-xs font-medium text-slate-300 block">
              Озвучка и звуковые сигналы:
            </span>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Авто-озвучка при правильном ответе</span>
              <input
                type="checkbox"
                checked={settings.autoPronounce}
                onChange={(e) => onUpdateSettings({ autoPronounce: e.target.checked })}
                className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Звуковые сигналы успеха и ошибок</span>
              <input
                type="checkbox"
                checked={settings.soundFx}
                onChange={(e) => onUpdateSettings({ soundFx: e.target.checked })}
                className="w-4 h-4 accent-sky-400 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Скорость речи (TTS):</span>
                <span className="font-mono text-sky-400">{settings.voiceSpeed}x</span>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.2"
                step="0.05"
                value={settings.voiceSpeed}
                onChange={(e) => onUpdateSettings({ voiceSpeed: parseFloat(e.target.value) })}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Backup & Export */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-2">
          <button
            onClick={handleExportBackup}
            className="flex-1 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Скачать резервную копию</span>
          </button>

          <label className="flex-1 py-2 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-medium border border-white/[0.08] flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-center">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Загрузить резервную копию</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>

        {/* Section 4: Danger Zone / Reset Progress */}
        <div className="mt-6 p-4 rounded-xl border border-rose-500/25 bg-rose-500/5">
          <div className="flex items-center gap-2 mb-1.5 text-rose-400">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Опасная зона
            </h4>
          </div>

          <p className="text-xs text-slate-400 mb-3 leading-relaxed">
            Сброс обнулит все выученные слова, статистику и ошибки. Блоки заблокируются заново, кроме первого, чтобы вы могли протестировать всё с чистого листа.
          </p>

          {showConfirmReset ? (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 animate-fade-in space-y-2.5">
              <p className="text-xs font-medium text-rose-200">
                Вы точно уверены? Все выученные слова будут сброшены до нуля.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleExecuteReset}
                  disabled={resetting}
                  className="flex-1 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{resetting ? 'Сброс...' : 'Да, сбросить всё'}</span>
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  disabled={resetting}
                  className="py-2 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="w-full py-2.5 px-3 rounded-lg border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Сбросить весь прогресс обучения</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
