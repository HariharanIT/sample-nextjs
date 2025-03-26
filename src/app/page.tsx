"use client";

import dynamic from "next/dynamic";

const Videocall = dynamic(() => import("./components/VideoCall"), {
  ssr: false,
});

export default function Home() {
  return <Videocall />;
}
