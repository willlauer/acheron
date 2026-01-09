import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-black dark:text-white">
              Acheron
            </Link>
            <div className="flex space-x-6 items-center">
              <Link href="/blogs" className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white">
                Blogs
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-6">
            Welcome to Acheron
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            A personal website and technical blog for sharing thoughts, projects, and learnings.
          </p>
          <div className="flex space-x-4">
            <Link
              href="/blogs"
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            >
              Read Blogs
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}