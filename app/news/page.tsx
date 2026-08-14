import { redirect } from "next/navigation";

/** News is no longer part of the public site; keep old bookmarks useful. */
export default function NewsPage() {
  redirect("/faq");
}
