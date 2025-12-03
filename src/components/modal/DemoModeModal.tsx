import React from "react";
import DetailModal from "./DetailModalNew";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DemoModeModal({ isOpen, onClose }: Props) {
  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title="Demo rejim"
    >
      <div className="text-center py-6">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Demo rejim faol
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Demo rejimda qo'shish, o'zgartirish va o'chirish mumkin emas.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
          Ushbu funksiyalardan foydalanish uchun ishlab chiqarish rejimiga o'ting.
        </p>
        <button
          onClick={onClose}
          className="mt-6 rounded-xl bg-brand-500 hover:bg-brand-600 px-6 py-2 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
        >
          Tushunarli
        </button>
      </div>
    </DetailModal>
  );
}
