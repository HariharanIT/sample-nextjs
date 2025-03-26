import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const appId = "d7d97a62f2a1454a83cd5bbd3f9698db";

const channels = [
  {
    name: "test",
    token:
      "007eJxTYPjYNbkqlPWZwiN7VSVNqYlVGy8Ip3wINlROXZXeW/JROEuBIcU8xdI80cwozSjR0MTUJNHCODnFNCkpxTjN0szSIiVp5ubH6Q2BjAz7F3QxMEIhiM/CUJJaXMLAAAAAcx9s",
  },
  {
    name: "test2",
    token:
      "007eJxTYGiIOrNY4eRBtSaGzx6WYgt/Xbua/uPTnm+Kz0+zZP9g2/xWgSHFPMXSPNHMKM0o0dDE1CTRwjg5xTQpKcU4zdLM0iIlaeXmx+kNgYwMBRvDGBihEMRnZShJLS4xYmAAAGVZI3k=",
  },
];

const uid = 0;

export default function VideoCall() {
  const searchParams = useSearchParams();

  const channel = searchParams.get("channel");
  const audience = searchParams.get("audience");
  const [init, setInit] = useState(false);
  const [isUserJoined, setUserJoined] = useState(false);
  const joinedChannelName = useRef("");

  const client = useRef<IAgoraRTCClient>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack>(null);
  const localVideoTrack = useRef<ICameraVideoTrack>(null);

  // Join a channel and publish local media
  const joinChannel = useCallback(
    async (isHost: boolean, channel: string, token: string) => {
      if (isHost) {
        client.current?.setClientRole("host");
      }
      await client.current?.join(appId, channel, token, uid);
      if (isHost) {
        await createLocalMediaTracks();
        displayLocalVideo();
        publishLocalTracks();
      }
      setUserJoined(true);
    },
    [],
  );

  // Create local audio and video tracks
  async function createLocalMediaTracks() {
    localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
  }

  async function publishLocalTracks() {
    if (localAudioTrack.current && localVideoTrack.current) {
      await client.current?.publish([
        localAudioTrack.current,
        localVideoTrack.current,
      ]);
    }
  }

  // Handle client events
  const setupEventListeners = useCallback(() => {
    client.current?.on("user-published", async (user, mediaType) => {
      await client.current?.subscribe(user, mediaType);
      console.log("subscribe success");
      if (mediaType === "video") {
        displayRemoteVideo(user);
      }
      if (mediaType === "audio") {
        user?.audioTrack?.play();
      }
    });
    client.current?.on("user-unpublished", (user) => {
      const remotePlayerContainer = document.getElementById(
        user?.uid.toString(),
      );
      remotePlayerContainer?.remove();
    });
  }, []);

  // Display local video
  function displayLocalVideo() {
    const localPlayerContainer = document.getElementById("local-video");
    if (localPlayerContainer) {
      localVideoTrack.current?.play(localPlayerContainer);
    }
  }

  // Display remote user's video
  function displayRemoteVideo(user: IAgoraRTCRemoteUser) {
    let containerId = "";
    if (joinedChannelName.current === "test") {
      containerId = "channel-one";
    } else {
      containerId = "channel-two";
    }
    const remotePlayerContainer = document.getElementById(containerId);
    if (remotePlayerContainer) {
      user?.videoTrack?.play(remotePlayerContainer);
    }
  }

  // Leave the channel and clean up
  async function leaveChannel() {
    // Stop the local media tracks to release the microphone and camera resources
    if (localAudioTrack.current) {
      localAudioTrack.current?.close();
      localAudioTrack.current = null;
    }
    if (localVideoTrack.current) {
      localVideoTrack.current?.close();
      localVideoTrack.current = null;
    }

    // Leave the channel
    await client.current?.leave();
    setUserJoined(false);
  }

  const initializeClient = useCallback(() => {
    client.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    setupEventListeners();
    setInit(true);
  }, [setupEventListeners]);

  useEffect(() => {
    initializeClient();
  }, [initializeClient]);

  useEffect(() => {
    if (init && channel && !audience) {
      const data = channels.filter((i) => i.name == channel);
      if (data.length) {
        joinChannel(true, channel, data[0].token);
      }
    }

    if (init && audience && !channel) {
      client.current?.setClientRole("audience");
      channels.forEach((item) => {
        AgoraRTC.preload(appId, item?.name, item?.token, uid);
      });
    }
  }, [init, channel, audience, joinChannel]);

  return (
    <div className="block m-10">
      <h2 className="heading">Web SDK Video Quickstart</h2>

      <div className="row m-5">
        <div>
          <button
            type="button"
            id="join"
            className="btn btn-blue mr-5"
            onClick={() => {
              if (isUserJoined) {
                leaveChannel();
              }
              joinedChannelName.current = channels[0].name;
              joinChannel(false, channels[0].name, channels[0].token);
            }}
          >
            Join Channel One
          </button>

          <button
            type="button"
            id="join"
            className="btn btn-blue"
            onClick={() => {
              if (isUserJoined) {
                leaveChannel();
              }
              joinedChannelName.current = channels[1].name;
              joinChannel(false, channels[1].name, channels[1].token);
            }}
          >
            Join Channel Two
          </button>
        </div>
      </div>

      <div className="row">
        <div className="m-5">
          <h1 className="m-2">Channel : test</h1>
          <div
            id="channel-one"
            style={{ width: 640, height: 480, margin: 5 }}
          ></div>
        </div>
        <div className="m-5">
          <h1 className="m-2">Channel : test2</h1>
          <div
            id="channel-two"
            style={{ width: 640, height: 480, margin: 5 }}
          ></div>
        </div>
        <div className="m-5">
          <h1 className="m-2">Local Video</h1>
          <div
            id="local-video"
            style={{ width: 640, height: 480, margin: 5 }}
          ></div>
        </div>
      </div>
    </div>
  );
}
