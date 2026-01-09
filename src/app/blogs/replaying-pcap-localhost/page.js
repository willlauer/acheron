import Link from "next/link";
import PDFDownload from "@/components/PDFDownload";
import {cppCodeSample} from './code_sample';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


export default function ReplayingFragmentedIPBlog() {
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
              <PDFDownload targetId="main-content" fileName="replaying-pcap-localhost" className="text-sm" />
            </div>
          </div>
        </div>
      </nav>
      
      <main id="main-content" className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/blogs" 
              className="text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white mb-4 inline-block"
            >
              ← Back to Blogs
            </Link>
          </div>
          
          <article>
            <header className="mb-12">
              <h1 className="text-4xl font-bold text-black dark:text-white mb-4">
                Replaying Pcap over Localhost
              </h1>

              <div className="prose prose-gray max-w-none">
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  In this post, we'll consider the problem of replaying some pcap data locally using tcpreplay.
                </p>

                <h2 className="text-2xl font-bold text-black dark:text-white mt-8 mb-4">The Problem</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  The core problem: loopback interface is a Layer3 device. <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">tcpreplay</code> injects packets at Layer2.
                </p>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  When <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">tcpreplay</code> is used naively, our receiving program does not receive the packets. The tcpreplay FAQ section provides some more information:
                </p>

                <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300 mb-6">
                  "Since the loopback interface doesn't use an Ethernet L2 header, the IP stack of the operating system is unable to parse the packet and deliver it to the listening daemon."
                </blockquote>

                <h2 className="text-2xl font-bold text-black dark:text-white mt-8 mb-4">The Solution</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  It's best to avoid loopback. Instead, we'll create our own virtual ethernet. Since <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">veth</code> is a layer2 device, we can use this instead.
                </p>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  We need an ethernet interface which receives our data as ingress. So create a virtual ethernet pair <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">veth0</code> and <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">veth1</code>. We'll assign an IP address to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">veth1</code>, which is going to serve the sensor data connection on our PC. Then, we'll inject the pcap data to <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">veth0</code>.
                </p>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Egress data on <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">veth0</code> will appear as ingress data on <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">veth1</code>, so the OS should handle it properly.
                </p>

                <h3 className="text-xl font-semibold text-black dark:text-white mt-6 mb-3">Setup Commands</h3>
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                  <SyntaxHighlighter language="bash" style={vscDarkPlus}>
{`# Create virtual ethernet pair (two connected interfaces)
sudo ip link add veth0 type veth peer name veth1
sudo ip link set veth0 up
sudo ip link set veth1 up
sudo ip addr add 192.168.100.1/24 dev veth1

# Inject on veth0 (appears as incoming on veth1)
sudo tcpreplay -i veth0 /tmp/fixed.pcap`}
                  </SyntaxHighlighter>
                </div>

              <h2 className="text-2xl font-bold text-black dark:text-white mt-12 mb-4">Alternative Approach: Layer3 Injection</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Contrast this with an earlier approach I was doing, where I replayed packets through our SDK and sent them to localhost broadcast. This worked fine, because this is injecting the data at Layer3.
              </p>

              <div className="bg-gray-900 rounded-lg p-4 mb-8">
                    <SyntaxHighlighter language="cpp" style={vscDarkPlus}>
                      {cppCodeSample}
                    </SyntaxHighlighter>
              </div>

              <h2 className="text-2xl font-bold text-black dark:text-white mt-12 mb-6">References</h2>
                <div className="space-y-2 mb-8">
                  <a href="https://tcpreplay-users.narkive.com/B4IgSpbe/loopback-on-linux" 
                     className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    TCPReplay Users - Loopback on Linux
                  </a>
                  <a href="https://tcpreplay.appneta.com/wiki/faq.html" 
                     className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    TCPReplay FAQ - Why doesn't my application see packets replayed over loopback
                  </a>
                  <a href="https://developers.redhat.com/blog/2018/10/22/introduction-to-linux-interfaces-for-virtual-networking" 
                     className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    Linux Interfaces for Virtual Networking
                  </a>
                </div>
              </div>
            </header>
          </article>
        </div>
      </main>
    </div>
  );
}