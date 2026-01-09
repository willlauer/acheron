import Link from "next/link";
import PDFDownload from "@/components/PDFDownload";

export default function BlogsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-black dark:text-white">
              Acheron
            </Link>
            <div className="flex space-x-6 items-center">
              <Link href="/blogs" className="text-black dark:text-white font-medium">
                Blogs
              </Link>
              <PDFDownload targetId="main-content" fileName="acheron-blogs" className="text-sm" />
            </div>
          </div>
        </div>
      </nav>
      
      <main id="main-content" className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-black dark:text-white mb-8">Blogs</h1>
        <div className="space-y-6">
          <article className="border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
              <Link href="/blogs/replaying-pcap-localhost" className="hover:text-blue-600 dark:hover:text-blue-400">
                Replaying Pcap over Localhost
              </Link>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Exploring the challenges of replaying pcap data locally using tcpreplay, specifically working with fragmented lidar data and the solutions involving virtual ethernet interfaces.
            </p>
            <Link 
              href="/blogs/replaying-pcap-localhost"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Read more →
            </Link>
          </article>
        </div>
      </main>
    </div>
  );
}