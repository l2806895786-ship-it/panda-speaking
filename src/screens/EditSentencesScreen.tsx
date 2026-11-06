import { useState, useRef } from 'react';
import { Sentence, MOVIE_INFO } from '../types';
import { YouTubePlayer, YouTubePlayerHandle } from '../components/YouTubePlayer';
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Clock,
  AlertTriangle,
  Check,
  CheckCircle2,
} from 'lucide-react';

interface EditSentencesScreenProps {
  sentences: Sentence[];
  onSaveSentences: (newSentences: Sentence[]) => void;
  onBack: () => void;
  onResetDefault: () => void;
}

export function EditSentencesScreen({
  sentences,
  onSaveSentences,
  onBack,
  onResetDefault,
}: EditSentencesScreenProps) {
  const playerRef = useRef<YouTubePlayerHandle>(null);

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [speaker, setSpeaker] = useState('Zhen');
  const [text, setText] = useState('');
  const [korean, setKorean] = useState('');
  const [stressInput, setStressInput] = useState('');
  const [startTime, setStartTime] = useState<number>(MOVIE_INFO.startSeconds);
  const [endTime, setEndTime] = useState<number>(MOVIE_INFO.startSeconds + 2.5);

  const [formError, setFormError] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Set Start = now & Set End = now
  const handleSetStartNow = () => {
    if (playerRef.current) {
      const now = Math.round(playerRef.current.getCurrentTime() * 10) / 10;
      setStartTime(now);
    }
  };

  const handleSetEndNow = () => {
    if (playerRef.current) {
      const now = Math.round(playerRef.current.getCurrentTime() * 10) / 10;
      setEndTime(now);
    }
  };

  // Test play segment
  const handleTestSegment = () => {
    if (playerRef.current) {
      playerRef.current.playSegment(startTime, endTime, false);
    }
  };

  const handleTestSentence = (s: Sentence) => {
    if (playerRef.current) {
      playerRef.current.playSegment(s.start, s.end, false);
    }
  };

  // Validation
  const validateForm = (): boolean => {
    setFormError(null);

    if (!text.trim()) {
      setFormError('Please enter the English sentence / 영어 문장을 입력해 주세요.');
      return false;
    }

    if (startTime < MOVIE_INFO.startSeconds || startTime > MOVIE_INFO.endSeconds) {
      setFormError(
        `Start time must be within practice range (${MOVIE_INFO.startSeconds}s – ${MOVIE_INFO.endSeconds}s)`
      );
      return false;
    }

    if (endTime < MOVIE_INFO.startSeconds || endTime > MOVIE_INFO.endSeconds) {
      setFormError(
        `End time must be within practice range (${MOVIE_INFO.startSeconds}s – ${MOVIE_INFO.endSeconds}s)`
      );
      return false;
    }

    if (endTime <= startTime) {
      setFormError('End time must be greater than start time / 종료 시간은 시작 시간보다 커야 합니다.');
      return false;
    }

    return true;
  };

  // Word count and duration gentle warnings
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const duration = Math.round((endTime - startTime) * 10) / 10;
  const isTooLong = duration > 4.0 || wordCount > 12;

  // Save new or edited sentence
  const handleSaveSentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const stressArr = stressInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (editingId !== null) {
      // Update existing
      const updated = sentences.map((item) => {
        if (item.id === editingId) {
          return {
            ...item,
            speaker: speaker.trim() || 'Speaker',
            text: text.trim(),
            korean: korean.trim(),
            stress: stressArr,
            start: startTime,
            end: endTime,
          };
        }
        return item;
      });
      onSaveSentences(updated);
      setEditingId(null);
    } else {
      // Add new
      const nextId =
        sentences.length > 0 ? Math.max(...sentences.map((s) => s.id)) + 1 : 1;
      const newSentence: Sentence = {
        id: nextId,
        speaker: speaker.trim() || 'Speaker',
        text: text.trim(),
        korean: korean.trim(),
        stress: stressArr,
        start: startTime,
        end: endTime,
      };
      onSaveSentences([...sentences, newSentence]);
    }

    // Reset form
    setText('');
    setKorean('');
    setStressInput('');
    setStartTime(Math.min(endTime, MOVIE_INFO.endSeconds - 2));
    setEndTime(Math.min(endTime + 2, MOVIE_INFO.endSeconds));
  };

  const startEditSentence = (s: Sentence) => {
    setEditingId(s.id);
    setSpeaker(s.speaker);
    setText(s.text);
    setKorean(s.korean);
    setStressInput(s.stress.join(', '));
    setStartTime(s.start);
    setEndTime(s.end);
    window.scrollTo({ top: 320, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText('');
    setKorean('');
    setStressInput('');
  };

  const deleteSentence = (id: number) => {
    if (window.confirm('Delete this sentence? / 이 문장을 삭제하시겠습니까?')) {
      const filtered = sentences.filter((s) => s.id !== id);
      onSaveSentences(filtered);
      if (editingId === id) cancelEdit();
    }
  };

  const moveSentence = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sentences.length) return;
    const copy = [...sentences];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onSaveSentences(copy);
  };

  // JSON Export
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(sentences, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    });
  };

  // JSON Import
  const handleImportSubmit = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed)) {
        throw new Error('Imported data must be an array of sentences.');
      }
      for (const item of parsed) {
        if (!item.text || typeof item.start !== 'number' || typeof item.end !== 'number') {
          throw new Error('Each sentence must have text, start, and end properties.');
        }
      }
      onSaveSentences(parsed);
      setImportModalOpen(false);
      setImportText('');
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON format.');
    }
  };

  return (
    <div className="flex flex-col space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Practice / 뒤로가기</span>
        </button>

        <button
          type="button"
          onClick={onResetDefault}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg"
          title="Restore default Kung Fu Panda 4 sentences"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Video Player at top */}
      <YouTubePlayer ref={playerRef} />

      {/* Add / Edit Sentence Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {editingId !== null ? 'Edit Sentence / 문장 수정' : 'Add New Sentence / 새 문장 추가'}
            </h2>
          </div>
          {editingId !== null && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {formError && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveSentence} className="space-y-3">
          {/* Speaker */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Speaker / 화자
              </label>
              <input
                type="text"
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                placeholder="e.g. Zhen, Po"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Stress words / 강조 단어
              </label>
              <input
                type="text"
                value={stressInput}
                onChange={(e) => setStressInput(e.target.value)}
                placeholder="e.g. urn, creepy"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* English sentence text */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              English Sentence / 영어 문장 (3–12 words)
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Why would you keep an urn of souls?"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Korean meaning */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Korean Meaning / 한국어 뜻
            </label>
            <input
              type="text"
              value={korean}
              onChange={(e) => setKorean(e.target.value)}
              placeholder="e.g. 왜 영혼의 항아리를 보관하시겠습니까?"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time range controls with Set Start = now and Set End = now */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Segment Timing / 구간 시간 (190s – 245s)</span>
              </span>
              <button
                type="button"
                onClick={handleTestSegment}
                className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded-md font-bold"
              >
                <Play className="w-3 h-3 fill-blue-700" />
                <span>Test Segment</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Start (seconds)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min={MOVIE_INFO.startSeconds}
                    max={MOVIE_INFO.endSeconds}
                    value={startTime}
                    onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSetStartNow}
                    title="Set start to current video position"
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold rounded-lg shrink-0 whitespace-nowrap"
                  >
                    Set = now
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">End (seconds)</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.1"
                    min={MOVIE_INFO.startSeconds}
                    max={MOVIE_INFO.endSeconds}
                    value={endTime}
                    onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSetEndNow}
                    title="Set end to current video position"
                    className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold rounded-lg shrink-0 whitespace-nowrap"
                  >
                    Set = now
                  </button>
                </div>
              </div>
            </div>

            {/* Gentle warning if sentence is longer than 4s or 12 words */}
            {isTooLong && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Gentle tip: This sentence is {duration}s long ({wordCount} words). Sentences over 4s or 12 words might be tricky for beginner shadowing.
                </span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full min-h-[46px] px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{editingId !== null ? 'Save Changes / 변경사항 저장' : 'Add Sentence / 문장 추가'}</span>
          </button>
        </form>
      </div>

      {/* Current Sentences List & Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900">
            Current Practice List ({sentences.length})
          </h3>

          <div className="flex items-center gap-2">
            {/* Export JSON */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg"
              title="Copy JSON to clipboard"
            >
              {copiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedJson ? 'Copied!' : 'Export JSON'}</span>
            </button>

            {/* Import JSON */}
            <button
              type="button"
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg"
            >
              <Upload className="w-3 h-3" />
              <span>Import JSON</span>
            </button>
          </div>
        </div>

        {sentences.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No sentences yet. Tap 'Reset Default' or add a sentence above!
          </div>
        ) : (
          <div className="space-y-2">
            {sentences.map((s, idx) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex flex-col space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-blue-700">{s.speaker}</span>
                    <span className="text-[11px] text-slate-400">
                      {s.start.toFixed(1)}s – {s.end.toFixed(1)}s
                    </span>
                  </div>

                  {/* Actions: Reorder, Test, Edit, Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSentence(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSentence(idx, 'down')}
                      disabled={idx === sentences.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTestSentence(s)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Test playback"
                    >
                      <Play className="w-3.5 h-3.5 fill-blue-600" />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditSentence(s)}
                      className="p-1 text-slate-600 hover:text-slate-900"
                      title="Edit sentence"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSentence(s.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Delete sentence"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-xs font-medium text-slate-900">
                  {s.text}
                </div>
                <div className="text-[11px] text-slate-500">
                  {s.korean}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Import Sentences JSON</h3>
            <p className="text-xs text-slate-500">
              Paste a JSON array of sentences matching the format: id, speaker, text, korean, stress, start, end.
            </p>
            {importError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg">
                {importError}
              </div>
            )}
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[ { "id": 1, "speaker": "Zhen", "text": "...", "start": 190.0, "end": 192.0 } ]'
              className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportError(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
