import { redirect } from "next/navigation";

/**
 * Content Page
 *
 * Redirects to the content library.
 */
export default function ContentPage() {
  redirect("/content/library");
}
