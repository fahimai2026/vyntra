import { Bookmark } from "lucide-react";

export function BookmarksView() {
  return (
    <div className="flex-1 h-full overflow-y-auto w-full custom-scrollbar bg-vyntra-bg/80 backdrop-blur-md">
      <div className="sticky top-0 z-30 bg-vyntra-bg/80 backdrop-blur-xl border-b border-white/10 p-4">
        <h2 className="text-xl font-bold">Bookmarks</h2>
      </div>
      <div className="p-8 text-center text-vyntra-text-sec flex flex-col items-center mt-20">
        <Bookmark size={64} className="mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-white mb-2">Save posts for later</h3>
        <p className="max-w-xs mx-auto">Don't let the good stuff get lost. Bookmark posts to easily find them again.</p>
      </div>
    </div>
  );
}
