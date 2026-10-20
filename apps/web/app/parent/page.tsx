import type { Metadata } from "next";
import { ParentHome } from "./ParentHome";

export const metadata: Metadata = { title: "ADHDCheck · Your children" };

export default function ParentPage() {
  return <ParentHome />;
}
