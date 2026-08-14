"use client";
import { ErrorState } from "@/components/ui";
export default function SysadminError({ error }: { error: Error }) {
  return <div className="dashboard-page"><ErrorState detail={error.message} /></div>;
}
