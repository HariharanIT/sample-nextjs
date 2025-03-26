"use client";

import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

const appId = "d7d97a62f2a1454a83cd5bbd3f9698db";

const channels = [
  {
    name: "test",
    token:
      "007eJxTYDDiWKG09LX+3ehbek4eZ5NmmHcuP3jxbb/B5HBu0ZSej+oKDCnmKZbmiWZGaUaJhiamJokWxskppklJKcZplmaWFilJFQGP0hsCGRn03t5nYIRCEJ+FoSS1uISBAQA65B/x",
  },
  {
    name: "test2",
    token:
      "007eJxTYGiYnLyB///l557yZT1R0SZ3nWU/KgtNuy8Vn3Z8/ounzu0KDCnmKZbmiWZGaUaJhiamJokWxskppklJKcZplmaWFilJaUmP0hsCGRmOhu1mZWSAQBCflaEktbjEiIEBAKSBIO8=",
  },
];

const uid = 0;

export default function Home() {
  const searchParams = useSearchParams();

  const channel = searchParams.get("channel");
  const audience = searchParams.get("audience");
  const [init, setInit] = useState(false);
  const [isUserJoined, setUserJoined] = useState(false);
  const joinedChannelName = useRef("");

  const client = useRef<IAgoraRTCClient>(null);
  const localAudioTrack = useRef<IMicrophoneAudioTrack>(null);
  const localVideoTrack = useRef<ICameraVideoTrack>(null);
  const remotePlayerUid = useRef([]);

  function initializeClient() {
    client.current = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
    setupEventListeners();
    setInit(true);
  }

  // Join a channel and publish local media
  async function joinChannel(isHost: boolean, channel: string, token: string) {
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
  }

  // Create local audio and video tracks
  async function createLocalMediaTracks() {
    localAudioTrack.current = await AgoraRTC.createMicrophoneAudioTrack();
    localVideoTrack.current = await AgoraRTC.createCameraVideoTrack();
  }

  async function publishLocalTracks() {
    await client.current?.publish([
      localAudioTrack.current,
      localVideoTrack.current,
    ]);
  }

  // Handle client events
  function setupEventListeners() {
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
  }

  // Display local video
  function displayLocalVideo() {
    const localPlayerContainer = document.getElementById("local-video");
    if (localPlayerContainer) {
      localVideoTrack.current?.play(localPlayerContainer);
    }
  }

  // Display remote user's video
  function displayRemoteVideo(user) {
    let containerId = "";
    if (joinedChannelName.current === "test") {
      containerId = "channel-one";
    } else {
      containerId = "channel-two";
    }
    const remotePlayerContainer = document.getElementById(containerId);
    //remotePlayerContainer.id = user.uid.toString();
    user?.videoTrack?.play(remotePlayerContainer);
    remotePlayerUid.current = [...remotePlayerUid.current, user.uid.toString()];
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

    //removing the remote user div element
    //if (remotePlayerUid.current && remotePlayerUid.current?.length) {
    // remotePlayerUid.current.forEach((i) => {
    //   document?.getElementById(i)?.remove();
    // });
    //}

    // Leave the channel
    await client.current?.leave();
    setUserJoined(false);
  }

  useEffect(() => {
    initializeClient();
  }, []);

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
  }, [init, channel, audience]);

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
