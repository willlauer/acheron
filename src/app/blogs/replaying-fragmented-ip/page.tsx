import Link from "next/link";
import PDFDownload from "@/components/PDFDownload";

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
              <PDFDownload targetId="main-content" fileName="replaying-fragmented-ip" className="text-sm" />
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
                Replaying Fragmented IP
              </h1>

              <div className="prose prose-gray max-w-none">
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  In this post, we'll consider the problem of replaying some pcap data locally using tcpreplay. Specifically, we're working with some lidar data which has been fragmented due to large packet size.
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
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`# Create virtual ethernet pair (two connected interfaces)
sudo ip link add veth0 type veth peer name veth1
sudo ip link set veth0 up
sudo ip link set veth1 up
sudo ip addr add 192.168.100.1/24 dev veth1

# Inject on veth0 (appears as incoming on veth1)
sudo tcpreplay -i veth0 /tmp/fixed.pcap`}
                  </pre>
                </div>

              <h2 className="text-2xl font-bold text-black dark:text-white mt-12 mb-4">Alternative Approach: Layer3 Injection</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Contrast this with an earlier approach I was doing, where I replayed packets through our SDK and sent them to localhost broadcast. This worked fine, because this is injecting the data at Layer3.
              </p>

              <div className="bg-gray-900 rounded-lg p-4 mb-8">
                <pre className="text-sm overflow-x-auto" style={{color: '#f8f8f2'}}>
{`#include `}<span style={{color: '#e6db74'}}>&lt;asio.hpp&gt;</span>{`
#include `}<span style={{color: '#e6db74'}}>&lt;iostream&gt;</span>{`
#include `}<span style={{color: '#e6db74'}}>&lt;thread&gt;</span>{`
#include `}<span style={{color: '#e6db74'}}>&lt;unordered_set&gt;</span>{`

#include `}<span style={{color: '#e6db74'}}>"cepton_sdk2.h"</span>{`

`}<span style={{color: '#66d9ef'}}>#define</span>{` `}<span style={{color: '#ae81ff'}}>SENSOR_COUNT</span>{` `}<span style={{color: '#ae81ff'}}>1</span>{`

`}<span style={{color: '#66d9ef'}}>using namespace</span>{` std;
`}<span style={{color: '#66d9ef'}}>using</span>{` asio::ip::udp;

`}<span style={{color: '#66d9ef'}}>void</span>{` `}<span style={{color: '#a6e22e'}}>check_api</span>{`(`}<span style={{color: '#66d9ef'}}>int</span>{` err, `}<span style={{color: '#66d9ef'}}>char const</span>{` *api) {
  `}<span style={{color: '#f92672'}}>if</span>{` (err != CEPTON_SUCCESS) {
    `}<span style={{color: '#a6e22e'}}>printf</span>{`(`}<span style={{color: '#e6db74'}}>"%s Failed\\n"</span>{`, api);
    `}<span style={{color: '#a6e22e'}}>exit</span>{`(1);
  }
}

`}<span style={{color: '#66d9ef'}}>bool</span>{` quitting = `}<span style={{color: '#ae81ff'}}>false</span>{`;

`}<span style={{color: '#75715e'}}>// Datasets</span>{`
CeptonReplayHandle replayHandle;

asio::io_context m_io_service;
udp::socket m_socket_0(m_io_service, udp::v4());  `}<span style={{color: '#75715e'}}>// first sensor</span>{`

`}<span style={{color: '#f92672'}}>#if</span>{` SENSOR_COUNT > 1
udp::socket m_socket_1(m_io_service, udp::v4());  `}<span style={{color: '#75715e'}}>// second sensor</span>{`
`}<span style={{color: '#f92672'}}>#endif</span>{`

`}<span style={{color: '#f92672'}}>#if</span>{` SENSOR_COUNT > 2
udp::socket m_socket_2(m_io_service, udp::v4());  `}<span style={{color: '#75715e'}}>// third sensor</span>{`
`}<span style={{color: '#f92672'}}>#endif</span>{`

CeptonSensorHandle firstHandle = `}<span style={{color: '#ae81ff'}}>0</span>{`, secondHandle = `}<span style={{color: '#ae81ff'}}>0</span>{`, thirdHandle = `}<span style={{color: '#ae81ff'}}>0</span>{`;

unordered_set<CeptonSensorHandle> used_handles;

`}<span style={{color: '#66d9ef'}}>int</span>{` `}<span style={{color: '#a6e22e'}}>udpBroadcast</span>{`(CeptonSensorHandle handle, `}<span style={{color: '#66d9ef'}}>int64_t</span>{` timestamp,
                 `}<span style={{color: '#66d9ef'}}>const</span>{` `}<span style={{color: '#66d9ef'}}>uint8_t</span>{` *data, `}<span style={{color: '#66d9ef'}}>size_t</span>{` data_size, `}<span style={{color: '#66d9ef'}}>void</span>{` *user_data) {
  `}<span style={{color: '#f92672'}}>if</span>{` (used_handles.find(handle) == used_handles.end()) {
    `}<span style={{color: '#f92672'}}>if</span>{` (firstHandle == `}<span style={{color: '#ae81ff'}}>0</span>{`)
      firstHandle = handle;
    `}<span style={{color: '#f92672'}}>else if</span>{` (secondHandle == `}<span style={{color: '#ae81ff'}}>0</span>{`)
      secondHandle = handle;
    `}<span style={{color: '#f92672'}}>else if</span>{` (thirdHandle == `}<span style={{color: '#ae81ff'}}>0</span>{`)
      thirdHandle = handle;
    used_handles.insert(handle);
  }

  `}<span style={{color: '#66d9ef'}}>static</span>{` array<`}<span style={{color: '#66d9ef'}}>uint8_t</span>{`, `}<span style={{color: '#ae81ff'}}>65536</span>{`> points;
  `}<span style={{color: '#a6e22e'}}>memcpy</span>{`(points.data(), data, data_size);

`}<span style={{color: '#75715e'}}>// Broadcast the data over localhost, using the socket mapped by this sensor
// handle</span>{`
`}<span style={{color: '#f92672'}}>#if</span>{` SENSOR_COUNT == 3
  `}<span style={{color: '#66d9ef'}}>auto</span>{` &sock = handle == firstHandle    ? m_socket_0
               : handle == secondHandle ? m_socket_1
                                        : m_socket_2;
`}<span style={{color: '#f92672'}}>#elif</span>{` SENSOR_COUNT == 2
  `}<span style={{color: '#66d9ef'}}>auto</span>{` &sock = handle == firstHandle ? m_socket_0 : m_socket_1;
`}<span style={{color: '#f92672'}}>#else</span>{`
  `}<span style={{color: '#66d9ef'}}>auto</span>{` &sock = m_socket_0;
`}<span style={{color: '#f92672'}}>#endif</span>{`
  sock.send_to(
      asio::buffer(points, data_size),
      asio::ip::udp::endpoint(
          asio::ip::address::from_string(`}<span style={{color: '#e6db74'}}>"127.255.255.255"</span>{`).to_v4(), `}<span style={{color: '#ae81ff'}}>8808</span>{`));
  `}<span style={{color: '#f92672'}}>return</span>{` -`}<span style={{color: '#ae81ff'}}>1</span>{`;  `}<span style={{color: '#75715e'}}>// not consumed</span>{`
}

`}<span style={{color: '#66d9ef'}}>int</span>{` `}<span style={{color: '#a6e22e'}}>main</span>{`(`}<span style={{color: '#66d9ef'}}>int</span>{` argc, `}<span style={{color: '#66d9ef'}}>char</span>{` **argv) {
  `}<span style={{color: '#75715e'}}>// Bind the sockets to different IP so that they can still be distinguished</span>{`
  m_socket_0.set_option(asio::socket_base::reuse_address(`}<span style={{color: '#ae81ff'}}>true</span>{`));
  m_socket_0.set_option(asio::socket_base::broadcast(`}<span style={{color: '#ae81ff'}}>true</span>{`));
  m_socket_0.bind(
      udp::endpoint(asio::ip::address_v4::from_string(`}<span style={{color: '#e6db74'}}>"127.0.0.2"</span>{`), `}<span style={{color: '#ae81ff'}}>8808</span>{`));

`}<span style={{color: '#f92672'}}>#if</span>{` SENSOR_COUNT > 1
  m_socket_1.set_option(asio::socket_base::reuse_address(`}<span style={{color: '#ae81ff'}}>true</span>{`));
  m_socket_1.set_option(asio::socket_base::broadcast(`}<span style={{color: '#ae81ff'}}>true</span>{`));
  m_socket_1.bind(
      udp::endpoint(asio::ip::address_v4::from_string(`}<span style={{color: '#e6db74'}}>"127.0.0.3"</span>{`), `}<span style={{color: '#ae81ff'}}>8808</span>{`));
`}<span style={{color: '#f92672'}}>#endif</span>{`

`}<span style={{color: '#f92672'}}>#if</span>{` SENSOR_COUNT > 2
  m_socket_2.set_option(asio::socket_base::reuse_address(`}<span style={{color: '#ae81ff'}}>true</span>{`));
  m_socket_2.set_option(asio::socket_base::broadcast(`}<span style={{color: '#ae81ff'}}>true</span>{`));
  m_socket_2.bind(
      udp::endpoint(asio::ip::address_v4::from_string(`}<span style={{color: '#e6db74'}}>"127.0.0.4"</span>{`), `}<span style={{color: '#ae81ff'}}>8808</span>{`));
`}<span style={{color: '#f92672'}}>#endif</span>{`

  `}<span style={{color: '#66d9ef'}}>thread</span>{` io([&]() {
    `}<span style={{color: '#f92672'}}>while</span>{` (!quitting) m_io_service.run_one();
  });

  `}<span style={{color: '#a6e22e'}}>check_api</span>{`(`}<span style={{color: '#a6e22e'}}>CeptonInitialize</span>{`(CEPTON_API_VERSION, `}<span style={{color: '#ae81ff'}}>0</span>{`), `}<span style={{color: '#e6db74'}}>"CeptonInitialize"</span>{`);
  `}<span style={{color: '#a6e22e'}}>check_api</span>{`(`}<span style={{color: '#a6e22e'}}>CeptonRegisterParser</span>{`(udpBroadcast, `}<span style={{color: '#ae81ff'}}>0</span>{`), `}<span style={{color: '#e6db74'}}>"CeptonRegisterParser"</span>{`);
  `}<span style={{color: '#a6e22e'}}>printf</span>{`(`}<span style={{color: '#e6db74'}}>"Loading %s\\n"</span>{`, argv[1]);
  `}<span style={{color: '#a6e22e'}}>check_api</span>{`(`}<span style={{color: '#a6e22e'}}>CeptonReplayLoadPcap</span>{`(argv[1], CEPTON_REPLAY_FLAG_PLAY_LOOPED,
                                 &replayHandle),
            `}<span style={{color: '#e6db74'}}>"CeptonReplayLoadPcap"</span>{`);

  `}<span style={{color: '#f92672'}}>while</span>{` (!`}<span style={{color: '#a6e22e'}}>CeptonReplayIsFinished</span>{`(replayHandle))
    this_thread::sleep_for(chrono::seconds(`}<span style={{color: '#ae81ff'}}>1</span>{`));

  quitting = `}<span style={{color: '#ae81ff'}}>true</span>{`;

  `}<span style={{color: '#f92672'}}>if</span>{` (io.joinable()) io.join();
}`}
                </pre>
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