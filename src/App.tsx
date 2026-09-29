/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  QUESTIONS_DATA,
  STUDENT_LIST,
  QuestionItem,
} from './data/questions';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  BookOpen,
  User,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

type Screen = 'welcome' | 'quiz' | 'result';
type OptionKey = 'A' | 'B' | 'C' | 'D';

const WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbw00EtPyhylfx8ZUg3o7CFvc5g44RK17byvTJqy8kMY6grcfIVpTAT7Enu9NenGnBFR/exec';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, OptionKey>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'wrong'>('all');
  const [showQuestionPalette, setShowQuestionPalette] = useState<boolean>(false);
  const [hasPromptedUnanswered, setHasPromptedUnanswered] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  // Question navigation and review scrolling
  const topRef = useRef<HTMLDivElement>(null);

  // Current active question
  const currentQuestion: QuestionItem = QUESTIONS_DATA[currentIndex];
  const totalQuestions = QUESTIONS_DATA.length;

  // Calculate score when submitted
  const score = useMemo(() => {
    let correct = 0;
    QUESTIONS_DATA.forEach((q) => {
      if (userAnswers[q.cau] === q.dapAn) {
        correct += 1;
      }
    });
    return correct;
  }, [userAnswers]);

  // Answered count
  const answeredCount = useMemo(() => {
    return Object.keys(userAnswers).length;
  }, [userAnswers]);

  // Send data to webhook upon entering result screen
  useEffect(() => {
    if (screen === 'result' && submitted) {
      setSyncStatus('syncing');
      const payload = {
        ten: selectedStudent,
        lop: 'IELTS - Loi Task1',
        diem: score,
        tongCau: totalQuestions,
        url: window.location.href,
      };

      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload),
      })
        .then((res) => {
          console.log('Đã gửi kết quả bài làm thành công:', res.status);
          setSyncStatus('synced');
        })
        .catch((err) => {
          console.error('Lỗi khi gửi kết quả về Google Sheet / Telegram:', err);
          setSyncStatus('error');
        });
    }
  }, [screen, submitted, score, selectedStudent, totalQuestions]);

  const handleStartQuiz = () => {
    if (!selectedStudent) return;
    setScreen('quiz');
    setCurrentIndex(0);
    setUserAnswers({});
    setSubmitted(false);
    setHasPromptedUnanswered(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectOption = (option: OptionKey) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.cau]: option,
    }));
    setHasPromptedUnanswered(false);
  };

  const handleNextQuestion = () => {
    const isAnswered = !!userAnswers[currentQuestion.cau];

    if (!isAnswered) {
      setHasPromptedUnanswered(true);
      return;
    }

    setHasPromptedUnanswered(false);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevQuestion = () => {
    setHasPromptedUnanswered(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    const isAnswered = !!userAnswers[currentQuestion.cau];
    if (!isAnswered) {
      setHasPromptedUnanswered(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitted(true);
    setScreen('result');
    setIsSubmitting(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestart = () => {
    setScreen('welcome');
    setSelectedStudent('');
    setCurrentIndex(0);
    setUserAnswers({});
    setSubmitted(false);
    setReviewFilter('all');
    setShowQuestionPalette(false);
    setSyncStatus('idle');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Questions filtered for review
  const filteredReviewQuestions = useMemo(() => {
    if (reviewFilter === 'all') return QUESTIONS_DATA;
    if (reviewFilter === 'correct') {
      return QUESTIONS_DATA.filter((q) => userAnswers[q.cau] === q.dapAn);
    }
    return QUESTIONS_DATA.filter((q) => userAnswers[q.cau] !== q.dapAn);
  }, [reviewFilter, userAnswers]);

  return (
    <div ref={topRef} className="min-h-screen bg-gradient-to-b from-sky-50 via-slate-50 to-amber-50/40 text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-sky-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-sm">
              IELTS
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Luyện Lỗi Task 1
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Writing Task 1 Common Errors & Data Reporting
              </p>
            </div>
          </div>

          {screen === 'quiz' && (
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-sky-800 bg-sky-50 border border-sky-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                <span className="truncate max-w-[120px]">{selectedStudent}</span>
              </span>
            </div>
          )}

          {screen === 'result' && (
            <button
              onClick={handleRestart}
              className="text-xs sm:text-sm font-medium text-slate-600 hover:text-sky-700 bg-slate-100 hover:bg-sky-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Làm lại
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* ========================================================= */}
        {/* SCREEN 1: MÀN HÌNH CHỌN TÊN                                */}
        {/* ========================================================= */}
        {screen === 'welcome' && (
          <div className="max-w-xl mx-auto w-full my-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-100/50 border border-sky-100">
              {/* Header illustration / Badge */}
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-6 mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>

              <div className="text-center mb-8">
                <span className="inline-block text-xs font-semibold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-2">
                  Lớp IELTS - Lỗi Task 1
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Trắc Nghiệm Luyện Lỗi Thường Gặp
                </h2>
                <p className="text-slate-600 text-sm sm:text-base mt-2 leading-relaxed">
                  Luyện tập 50 câu trọng tâm về đọc biểu đồ, ngữ pháp, từ vựng và câu tổng quan (Overview) trong IELTS Writing Task 1.
                </p>
              </div>

              {/* Quiz Features Quick Highlights */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-3.5 flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">50 Câu hỏi</div>
                    <div className="text-[11px] text-slate-500">Giữ nguyên văn tiếng Anh</div>
                  </div>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 flex items-start gap-3">
                  <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Tự động chấm</div>
                    <div className="text-[11px] text-slate-500">Lưu kết quả & báo cáo</div>
                  </div>
                </div>
              </div>

              {/* Form Selection */}
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="student-select"
                    className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-1.5"
                  >
                    <User className="w-4 h-4 text-sky-600" />
                    Chọn tên của em <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="student-select"
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-full h-13 px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-800 font-medium text-base rounded-2xl border-2 border-slate-200 focus:border-sky-500 focus:outline-hidden transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        -- Chọn tên của em --
                      </option>
                      {STUDENT_LIST.map((name) => (
                        <option key={name} value={name} className="py-2 text-slate-800">
                          {name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <ChevronRight className="w-5 h-5 rotate-90" />
                    </div>
                  </div>
                </div>

                {/* Notice message */}
                <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Em cần chọn tên trước khi bấm bắt đầu. Sau khi nộp bài, điểm sẽ tự động đồng bộ về hệ thống của lớp học.
                  </span>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartQuiz}
                  disabled={!selectedStudent}
                  className={`w-full h-13 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                    selectedStudent
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-sky-200 active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                  }`}
                >
                  <span>Bắt đầu làm bài</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 2: MÀN HÌNH LÀM BÀI — 50 CÂU TRẮC NGHIỆM            */}
        {/* ========================================================= */}
        {screen === 'quiz' && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-4">
            {/* Top Quiz Bar: Progress info */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-sky-100 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sky-700 text-sm sm:text-base">
                    Câu {currentIndex + 1}
                  </span>
                  <span className="text-slate-400 font-medium">/ {totalQuestions}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs hidden sm:inline">
                    Đã chọn: <strong className="text-slate-800 font-semibold">{answeredCount}</strong> / {totalQuestions}
                  </span>
                  <button
                    onClick={() => setShowQuestionPalette((v) => !v)}
                    className="text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {showQuestionPalette ? 'Ẩn bảng câu' : 'Bảng câu hỏi'}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Optional Question Palette Quick Navigator */}
              {showQuestionPalette && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-600 mb-2 flex items-center justify-between">
                    <span>Chọn nhanh câu để xem lại:</span>
                    <span className="text-[11px] text-slate-400">
                      Xanh: Đã chọn · Xám: Chưa chọn
                    </span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5 sm:gap-2 max-h-48 overflow-y-auto p-1">
                    {QUESTIONS_DATA.map((q, idx) => {
                      const isAnswered = !!userAnswers[q.cau];
                      const isCurrent = idx === currentIndex;
                      return (
                        <button
                          key={q.cau}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setHasPromptedUnanswered(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`h-8 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                            isCurrent
                              ? 'ring-2 ring-sky-600 font-black'
                              : ''
                          } ${
                            isAnswered
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {q.cau}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Question Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg shadow-sky-100/40 border border-sky-100 transition-all">
              {/* Question Number & Type tag */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Câu hỏi {currentQuestion.cau}
                </span>

                {userAnswers[currentQuestion.cau] && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã chọn
                  </span>
                )}
              </div>

              {/* Question Text (STRICTLY verbatim as requested) */}
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
                  {currentQuestion.hoi}
                </h3>
              </div>

              {/* 4 Options: A, B, C, D */}
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map((optionKey) => {
                  const optionText = currentQuestion[optionKey];
                  const isSelected = userAnswers[currentQuestion.cau] === optionKey;

                  return (
                    <button
                      key={optionKey}
                      type="button"
                      onClick={() => handleSelectOption(optionKey)}
                      className={`w-full min-h-[52px] p-3.5 sm:p-4 rounded-2xl border-2 text-left flex items-start gap-3.5 transition-all cursor-pointer active:scale-[0.99] ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/90 text-sky-950 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 text-slate-800'
                      }`}
                    >
                      {/* Letter Badge */}
                      <span
                        className={`w-7 h-7 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${
                          isSelected
                            ? 'bg-sky-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {optionKey}
                      </span>

                      {/* Option Text */}
                      <span className="flex-1 text-sm sm:text-base font-medium leading-relaxed pt-0.5">
                        {optionText}
                      </span>

                      {/* Check icon if selected */}
                      {isSelected && (
                        <span className="shrink-0 text-sky-600 pt-0.5">
                          <CheckCircle2 className="w-5 h-5 fill-sky-100" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Friendly notification if user attempts to go next without choosing an answer */}
              {hasPromptedUnanswered && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Em hãy chọn 1 đáp án cho câu hỏi này trước khi bấm tiếp tục nhé!</span>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1 pb-6">
              <button
                type="button"
                onClick={handlePrevQuestion}
                disabled={currentIndex === 0}
                className={`min-h-[48px] px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2 border transition-all cursor-pointer ${
                  currentIndex === 0
                    ? 'border-slate-200 text-slate-300 bg-slate-100/50 cursor-not-allowed'
                    : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-100 active:scale-[0.98]'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Câu trước</span>
                <span className="sm:hidden">Trước</span>
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="min-h-[48px] px-5 sm:px-7 py-2.5 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white shadow-md shadow-sky-200 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Câu tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-h-[48px] px-6 sm:px-8 py-2.5 rounded-2xl font-extrabold text-sm sm:text-base bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span>Nộp bài</span>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 3: MÀN HÌNH KẾT QUẢ                                 */}
        {/* ========================================================= */}
        {screen === 'result' && (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-6 py-2">
            {/* Main Score Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-sky-100/60 border border-sky-100 text-center relative overflow-hidden">
              {/* Decorative background glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-3">
                  <User className="w-3.5 h-3.5 text-sky-700" />
                  Học sinh: {selectedStudent}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Hoàn Thành Bài Kiểm Tra!
                </h2>

                {/* Score Callout */}
                <div className="my-6">
                  <div className="inline-block p-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-amber-500 rounded-3xl shadow-lg shadow-sky-200/50">
                    <div className="bg-white px-8 py-6 rounded-[22px]">
                      <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-700">
                        {score} / {totalQuestions}
                      </div>
                      <div className="text-base sm:text-lg font-bold text-slate-800 mt-1">
                        Em đúng {score}/{totalQuestions} câu
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tỷ lệ chính xác: {Math.round((score / totalQuestions) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Encouraging Feedback based on score */}
                <p className="text-sm sm:text-base font-medium text-slate-600 max-w-lg mx-auto leading-relaxed">
                  {score >= 45
                    ? 'Xuất sắc! Em đã nắm rất chắc các nguyên tắc số liệu, ngữ pháp và viết Overview trong Task 1!'
                    : score >= 38
                    ? 'Làm bài rất tốt! Hãy xem lại chi tiết các câu sai bên dưới để hoàn thiện kỹ năng nhé.'
                    : score >= 25
                    ? 'Khá tốt! Em hãy dành thời gian đọc lại các câu chưa chính xác để tránh mắc lỗi khi viết bài thi thật.'
                    : 'Cần cố gắng thêm! Hãy xem kỹ từng lỗi sai về cách dùng Amount/Number, cách chấm phẩy số và câu Overview.'}
                </p>

                {/* Webhook Sync status indicator (quiet, non-intrusive) */}
                <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  {syncStatus === 'syncing' && (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin text-sky-500" />
                      <span>Đang lưu kết quả vào hệ thống...</span>
                    </>
                  )}
                  {syncStatus === 'synced' && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-medium">Đã lưu kết quả thành công</span>
                    </>
                  )}
                  {syncStatus === 'error' && (
                    <span className="text-slate-400">Kết quả đã hiển thị đầy đủ cho em xem</span>
                  )}
                </div>

                {/* Restart Button */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleRestart}
                    className="min-h-[44px] px-6 py-2.5 rounded-2xl font-bold text-sm sm:text-base bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-200 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Làm lại từ đầu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Question Review List */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-lg shadow-sky-100/40 border border-sky-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Chi Tiết Bài Làm</h3>
                  <p className="text-xs text-slate-500">
                    Xem lại toàn bộ 50 câu hỏi kèm đáp án đúng và lựa chọn của em.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
                  <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      reviewFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({totalQuestions})
                  </button>
                  <button
                    onClick={() => setReviewFilter('correct')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      reviewFilter === 'correct'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Đúng ({score})
                  </button>
                  <button
                    onClick={() => setReviewFilter('wrong')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      reviewFilter === 'wrong'
                        ? 'bg-white text-rose-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sai ({totalQuestions - score})
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {filteredReviewQuestions.map((q) => {
                  const studentAns = userAnswers[q.cau];
                  const isCorrect = studentAns === q.dapAn;

                  return (
                    <div
                      key={q.cau}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      {/* Top row: Question index + Status badge */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                          Câu {q.cau}
                        </span>

                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đúng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100/70 px-2.5 py-0.5 rounded-full">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Sai
                          </span>
                        )}
                      </div>

                      {/* Question English prompt (verbatim) */}
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-3 leading-snug">
                        {q.hoi}
                      </h4>

                      {/* Choices breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        {(['A', 'B', 'C', 'D'] as OptionKey[]).map((opt) => {
                          const isOptionCorrect = q.dapAn === opt;
                          const isOptionStudentChoice = studentAns === opt;

                          let badgeStyle = 'border-slate-200 bg-white text-slate-700';
                          if (isOptionCorrect) {
                            badgeStyle = 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-300';
                          } else if (isOptionStudentChoice && !isOptionCorrect) {
                            badgeStyle = 'border-rose-300 bg-rose-50/80 text-rose-950 font-medium line-through';
                          }

                          return (
                            <div
                              key={opt}
                              className={`p-2.5 rounded-xl border flex items-start gap-2 ${badgeStyle}`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5 ${
                                  isOptionCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isOptionStudentChoice
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {opt}
                              </span>
                              <span className="flex-1 leading-snug">{q[opt]}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer Summary Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Em chọn:</span>
                          {studentAns ? (
                            <strong className={`font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {studentAns}
                            </strong>
                          ) : (
                            <span className="text-slate-400 italic">Chưa chọn</span>
                          )}
                        </div>

                        {!isCorrect && (
                          <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            <span className="text-emerald-800 font-semibold">Đáp án đúng:</span>
                            <span className="font-extrabold text-emerald-700">{q.dapAn}</span>
                            <span className="text-emerald-600 text-[11px]">({q[q.dapAn]})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Restart Button */}
              <div className="mt-8 text-center pt-4 border-t border-slate-100">
                <button
                  onClick={handleRestart}
                  className="min-h-[46px] px-8 py-2.5 rounded-2xl font-bold text-sm sm:text-base bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-200 inline-flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Làm lại từ đầu</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-medium">
          Chương trình luyện thi IELTS Writing Task 1 · Bản quyền học liệu phục vụ học tập
        </p>
      </footer>
    </div>
  );
}
