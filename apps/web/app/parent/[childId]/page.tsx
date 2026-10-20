import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, Shell } from "../_components/shell";
import { ChildView } from "./ChildView";

export const metadata: Metadata = { title: "ADHDCheck · Child" };

async function WithChild({ params }: { params: PageProps<"/parent/[childId]">["params"] }) {
  const { childId } = await params;
  return <ChildView childId={childId} />;
}

// cacheComponents: route params are request data, read inside Suspense.
export default function ChildPage(props: PageProps<"/parent/[childId]">) {
  return (
    <Suspense
      fallback={
        <Shell>
          <Loading />
        </Shell>
      }
    >
      <WithChild params={props.params} />
    </Suspense>
  );
}
