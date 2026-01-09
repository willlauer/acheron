export const cppCodeSample = `
#include <asio.hpp>
#include <iostream>
#include <thread>
#include <unordered_set>

#include "cepton_sdk2.h"

#define SENSOR_COUNT 1

using namespace std;
using asio::ip::udp;

void check_api(int err, char const *api) {
  if (err != CEPTON_SUCCESS) {
    printf("%s Failed\n", api);
    exit(1);
  }
}

bool quitting = false;

// Datasets
CeptonReplayHandle replayHandle;

asio::io_context m_io_service;
udp::socket m_socket_0(m_io_service, udp::v4());  // first sensor

#if SENSOR_COUNT > 1
udp::socket m_socket_1(m_io_service, udp::v4());  // second sensor
#endif

#if SENSOR_COUNT > 2
udp::socket m_socket_2(m_io_service, udp::v4());  // second sensor
#endif

CeptonSensorHandle firstHandle = 0, secondHandle = 0, thirdHandle = 0;

unordered_set<CeptonSensorHandle> used_handles;

int udpBroadcast(CeptonSensorHandle handle, int64_t timestamp,
                 const uint8_t *data, size_t data_size, void *user_data) {
  if (used_handles.find(handle) == used_handles.end()) {
    if (firstHandle == 0)
      firstHandle = handle;
    else if (secondHandle == 0)
      secondHandle = handle;
    else if (thirdHandle == 0)
      thirdHandle = handle;
    used_handles.insert(handle);
  }

  static array<uint8_t, 65536> points;
  memcpy(points.data(), data, data_size);

// Broadcast the data over localhost, using the socket mapped by this sensor
// handle
#if SENSOR_COUNT == 3
  auto &sock = handle == firstHandle    ? m_socket_0
               : handle == secondHandle ? m_socket_1
                                        : m_socket_2;
#elif SENSOR_COUNT == 2
  auto &sock = handle == firstHandle ? m_socket_0 : m_socket_1;
#else
  auto &sock = m_socket_0;
#endif
  sock.send_to(
      asio::buffer(points, data_size),
      asio::ip::udp::endpoint(
          asio::ip::address::from_string("127.255.255.255").to_v4(), 8808));
  return -1;  // not consumed
}

int main(int argc, char **argv) {
  // Bind the sockets to different IP so that they can still be distinguished
  m_socket_0.set_option(asio::socket_base::reuse_address(true));
  m_socket_0.set_option(asio::socket_base::broadcast(true));
  m_socket_0.bind(
      udp::endpoint(asio::ip::address_v4::from_string("127.0.0.2"), 8808));

#if SENSOR_COUNT > 1
  m_socket_1.set_option(asio::socket_base::reuse_address(true));
  m_socket_1.set_option(asio::socket_base::broadcast(true));
  m_socket_1.bind(
      udp::endpoint(asio::ip::address_v4::from_string("127.0.0.3"), 8808));
#endif

#if SENSOR_COUNT > 2
  m_socket_2.set_option(asio::socket_base::reuse_address(true));
  m_socket_2.set_option(asio::socket_base::broadcast(true));
  m_socket_2.bind(
      udp::endpoint(asio::ip::address_v4::from_string("127.0.0.4"), 8808));
#endif

  thread io([&]() {
    while (!quitting) m_io_service.run_one();
  });

  check_api(CeptonInitialize(CEPTON_API_VERSION, 0), "CeptonInitialize");
  check_api(CeptonRegisterParser(udpBroadcast, 0), "CeptonRegisterParser");
  printf("Loading %s\n", argv[1]);
  check_api(CeptonReplayLoadPcap(argv[1], CEPTON_REPLAY_FLAG_PLAY_LOOPED,
                                 &replayHandle),
            "CeptonReplayLoadPcap");

  while (!CeptonReplayIsFinished(replayHandle))
    this_thread::sleep_for(chrono::seconds(1));

  quitting = true;

  if (io.joinable()) io.join();
}`;