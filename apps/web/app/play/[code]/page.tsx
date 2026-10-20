import type { Metadata } from "next";
import { Suspense } from "react";
import { PlayLinkClient, PlayScreen } from "./PlayLinkClient";

// The page a play link and its QR code open on the tablet (FR-01, FR-32). The code is checked in the
// browser, so a shared or used link never renders anything about the child.
export const metadata: Metadata = { title: "ADHDCheck · Play", robots: { index: false, follow: false } };

async function WithCode({ params }: { params: PageProps<"/play/[code]">["params"] }) {
  const { code } = await params;
  return <PlayLinkClient code={code} />;
}

// cacheComponents: the code is request data, so it is read inside Suspense; the shell shows the
// "checking" screen until it arrives.
export default function PlayLinkPage(props: PageProps<"/play/[code]">) {
  return (
    <Suspense fallback={<PlayScreen screen={{ kind: "checking" }} />}>
      <WithCode params={props.params} />
    </Suspense>
  );
}
